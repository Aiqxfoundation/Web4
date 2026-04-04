import { Router } from "express";
import { db, usersTable, levelUnlocksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import {
  calculatePendingGems,
  computeTotalMiningPower,
  DAILY_GEMS_PER_USDT,
  FREE_USER_DAILY_GEMS,
  PAID_MINING_PERIOD_DAYS,
  FREE_USER_SESSION_HOURS,
  PAID_USER_SESSION_HOURS,
  getSessionDurationMs,
} from "../lib/mining.js";

const router = Router();

async function getUserLevelData(userId: number) {
  const unlockedLevels = await db
    .select()
    .from(levelUnlocksTable)
    .where(eq(levelUnlocksTable.userId, userId))
    .orderBy(levelUnlocksTable.level);

  const totalMiningPower = computeTotalMiningPower(
    unlockedLevels.map((ul: typeof unlockedLevels[0]) => ({ level: ul.level, additionalInvestment: ul.additionalInvestment }))
  );

  return { unlockedLevels, totalMiningPower };
}

// GET /mining/status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Ensure miningStartedAt exists (backfill for existing free users)
    if (!user.miningStartedAt) {
      await db
        .update(usersTable)
        .set({ miningStartedAt: new Date() })
        .where(eq(usersTable.id, user.id));
      user.miningStartedAt = new Date();
    }

    const { totalMiningPower } = await getUserLevelData(user.id);

    const currentLevel: number = user.currentLevel ?? 0;
    const isFreeUser = currentLevel === 0;

    const pendingGems = calculatePendingGems(
      currentLevel,
      totalMiningPower,
      user.miningStartedAt,
      user.lastClaimedAt
    );

    const dailyRate = isFreeUser
      ? FREE_USER_DAILY_GEMS
      : totalMiningPower * DAILY_GEMS_PER_USDT;

    const now = new Date();
    const totalDaysSinceStart =
      (now.getTime() - user.miningStartedAt.getTime()) / (1000 * 60 * 60 * 24);

    const daysElapsed = isFreeUser
      ? totalDaysSinceStart
      : Math.min(totalDaysSinceStart, PAID_MINING_PERIOD_DAYS);
    const daysRemaining = isFreeUser
      ? null
      : Math.max(0, PAID_MINING_PERIOD_DAYS - daysElapsed);
    const progressPercent = isFreeUser
      ? null
      : (daysElapsed / PAID_MINING_PERIOD_DAYS) * 100;

    const totalGemsTarget = isFreeUser
      ? null
      : totalMiningPower * DAILY_GEMS_PER_USDT * PAID_MINING_PERIOD_DAYS;

    // ── Session window ──────────────────────────────────────────────────────
    const sessionDurationMs = getSessionDurationMs(currentLevel);
    const sessionStartedAt  = user.lastClaimedAt ?? user.miningStartedAt;
    const sessionExpiresAt  = new Date(sessionStartedAt.getTime() + sessionDurationMs);
    const isMiningActive    = now < sessionExpiresAt;
    const timeRemainingMs   = Math.max(0, sessionExpiresAt.getTime() - now.getTime());
    const sessionDurationHours = isFreeUser ? FREE_USER_SESSION_HOURS : PAID_USER_SESSION_HOURS;

    res.json({
      isFreeUser,
      currentLevel,
      isActive: user.isActive,
      gemsBalance: user.gemsBalance,
      pendingGems: Math.floor(pendingGems),
      totalMiningPower,
      totalDepositUsdt: user.totalDepositUsdt,
      dailyRate: Math.floor(dailyRate),
      miningStartedAt: user.miningStartedAt.toISOString(),
      lastClaimedAt: user.lastClaimedAt?.toISOString() ?? null,
      progressPercent: progressPercent !== null ? Math.min(100, progressPercent) : null,
      totalGemsTarget,
      daysRemaining: daysRemaining !== null ? Math.ceil(daysRemaining) : null,
      sessionDurationHours,
      sessionStartedAt: sessionStartedAt.toISOString(),
      sessionExpiresAt: sessionExpiresAt.toISOString(),
      isMiningActive,
      timeRemainingMs,
    });
  } catch (err) {
    console.error("Mining status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /mining/claim
router.post("/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user.miningStartedAt) {
      res.status(400).json({ error: "Mining has not started yet." });
      return;
    }

    const { totalMiningPower } = await getUserLevelData(user.id);
    const currentLevel: number = user.currentLevel ?? 0;

    const pendingGems = calculatePendingGems(
      currentLevel,
      totalMiningPower,
      user.miningStartedAt,
      user.lastClaimedAt
    );

    if (pendingGems < 1) {
      res.status(400).json({ error: "No gems to claim yet." });
      return;
    }

    const claimedGems = Math.floor(pendingGems);
    const newBalance = user.gemsBalance + claimedGems;

    await db
      .update(usersTable)
      .set({ gemsBalance: newBalance, lastClaimedAt: new Date() })
      .where(eq(usersTable.id, user.id));

    res.json({ claimedGems, newBalance });
  } catch (err) {
    console.error("Claim gems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
