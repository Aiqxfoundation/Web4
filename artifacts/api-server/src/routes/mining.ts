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

const MIN_CLAIM_MS = 3 * 60 * 60 * 1000; // 3 hours

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

    // Mining has not been started yet — return a minimal "not started" state
    if (!user.miningStartedAt) {
      return res.json({
        miningNotStarted: true,
        isFreeUser: true,
        currentLevel: user.currentLevel ?? 0,
        isActive: user.isActive,
        gemsBalance: user.gemsBalance,
        pendingGems: 0,
        totalMiningPower: 0,
        totalDepositUsdt: user.totalDepositUsdt,
        dailyRate: 0,
        miningStartedAt: null,
        lastClaimedAt: null,
        progressPercent: null,
        totalGemsTarget: null,
        daysRemaining: null,
        sessionDurationHours: FREE_USER_SESSION_HOURS,
        sessionStartedAt: null,
        sessionExpiresAt: null,
        isMiningActive: false,
        timeRemainingMs: 0,
      });
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

    const sessionDurationMs = getSessionDurationMs(currentLevel);
    const sessionStartedAt  = user.lastClaimedAt ?? user.miningStartedAt;
    const sessionExpiresAt  = new Date(sessionStartedAt.getTime() + sessionDurationMs);
    const isMiningActive    = now < sessionExpiresAt;
    const timeRemainingMs   = Math.max(0, sessionExpiresAt.getTime() - now.getTime());
    const sessionDurationHours = isFreeUser ? FREE_USER_SESSION_HOURS : PAID_USER_SESSION_HOURS;

    res.json({
      miningNotStarted: false,
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

// POST /mining/start  — explicitly start mining for the first time
router.post("/start", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.miningStartedAt) {
      res.status(400).json({ error: "Mining has already been started." });
      return;
    }

    const now = new Date();
    await db
      .update(usersTable)
      .set({ miningStartedAt: now })
      .where(eq(usersTable.id, user.id));

    res.json({ started: true, miningStartedAt: now.toISOString() });
  } catch (err) {
    console.error("Start mining error:", err);
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

    // Enforce 3-hour minimum claim window per session
    const sessionStartedAt = user.lastClaimedAt ?? user.miningStartedAt;
    const now = new Date();
    const msElapsed = now.getTime() - sessionStartedAt.getTime();
    if (msElapsed < MIN_CLAIM_MS) {
      const msRemaining = MIN_CLAIM_MS - msElapsed;
      const minutesRemaining = Math.ceil(msRemaining / 60_000);
      const h = Math.floor(minutesRemaining / 60);
      const m = minutesRemaining % 60;
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      res.status(400).json({ error: `Too early to claim. Please wait ${timeStr} more.` });
      return;
    }

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
