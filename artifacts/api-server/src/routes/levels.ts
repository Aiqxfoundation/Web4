import { Router } from "express";
import { db, usersTable, levelUnlocksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import {
  LEVEL_DEFINITIONS,
  BASE_DAILY_GEMS_PER_USDT,
  FREE_USER_DAILY_GEMS,
  computeTotalMiningPower,
  computeLevelFromPower,
  getLevelMultiplier,
} from "../lib/mining.js";

const router = Router();

// GET /levels — returns user's level status and all available levels
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const unlockedLevels = await db
      .select()
      .from(levelUnlocksTable)
      .where(eq(levelUnlocksTable.userId, user.id))
      .orderBy(levelUnlocksTable.level);

    const totalMiningPower = computeTotalMiningPower(
      unlockedLevels.map((ul: typeof unlockedLevels[0]) => ({ level: ul.level, additionalInvestment: ul.additionalInvestment }))
    );

    const levelMultiplier = getLevelMultiplier(user.currentLevel);
    const dailyGems =
      user.currentLevel === 0
        ? FREE_USER_DAILY_GEMS
        : totalMiningPower * BASE_DAILY_GEMS_PER_USDT * levelMultiplier;

    res.json({
      currentLevel: user.currentLevel,
      totalMiningPower,
      dailyGems: Math.floor(dailyGems),
      usdtBalance: user.usdtBalance,
      unlockedLevels: unlockedLevels.map((ul: typeof unlockedLevels[0]) => ({
        level: ul.level,
        additionalInvestment: ul.additionalInvestment,
        unlockedAt: ul.unlockedAt.toISOString(),
      })),
      levelDefinitions: LEVEL_DEFINITIONS,
    });
  } catch (err) {
    console.error("Get levels error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /levels/invest — invest USDT to boost mining power and auto-unlock levels
// Works for Level 0 users (starts their mining journey) and all paid levels.
// Auto-unlocks any levels whose investmentThreshold is met by the new totalMiningPower.
router.post("/invest", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { additionalUsdt } = req.body;

    if (!additionalUsdt || typeof additionalUsdt !== "number" || additionalUsdt <= 0) {
      res.status(400).json({ error: "Invalid investment amount." });
      return;
    }

    if (user.usdtBalance < additionalUsdt) {
      res.status(400).json({ error: "Insufficient USDT balance." });
      return;
    }

    // Minimum investment to enter the system ($100 = Level 1 threshold)
    const minInvestment = LEVEL_DEFINITIONS.find(d => d.level === 1)?.investmentThreshold ?? 100;
    if (user.currentLevel === 0 && additionalUsdt < minInvestment) {
      res.status(400).json({ error: `Minimum investment to start is $${minInvestment} USDT.` });
      return;
    }

    // Get existing unlock records
    const existingUnlocks = await db
      .select()
      .from(levelUnlocksTable)
      .where(eq(levelUnlocksTable.userId, user.id))
      .orderBy(levelUnlocksTable.level);

    const currentTotalPower = computeTotalMiningPower(
      existingUnlocks.map(ul => ({ level: ul.level, additionalInvestment: ul.additionalInvestment }))
    );
    const newTotalPower = currentTotalPower + additionalUsdt;
    const newCurrentLevel = computeLevelFromPower(newTotalPower);

    // Determine which levels get newly unlocked
    const existingLevelNumbers = new Set(existingUnlocks.map(ul => ul.level));
    const levelsToUnlock: number[] = [];
    let remainingAmount = additionalUsdt;

    for (let lvl = user.currentLevel + 1; lvl <= newCurrentLevel; lvl++) {
      if (!existingLevelNumbers.has(lvl)) {
        const def = LEVEL_DEFINITIONS.find(d => d.level === lvl);
        if (def && def.unlockCost !== null) {
          levelsToUnlock.push(lvl);
          remainingAmount -= def.unlockCost;
        }
      }
    }

    // Insert new level unlock records (zero additionalInvestment for auto-unlocked levels)
    for (const lvl of levelsToUnlock) {
      await db.insert(levelUnlocksTable).values({
        userId: user.id,
        level: lvl,
        additionalInvestment: 0,
      });
    }

    // The remainder (beyond incremental unlock costs) goes into the highest level's additionalInvestment
    const targetLevel = newCurrentLevel > 0 ? newCurrentLevel : user.currentLevel;
    if (remainingAmount > 0 && targetLevel > 0) {
      const existingHighestRecord = existingUnlocks.find(ul => ul.level === targetLevel);
      if (existingHighestRecord) {
        await db
          .update(levelUnlocksTable)
          .set({ additionalInvestment: existingHighestRecord.additionalInvestment + remainingAmount })
          .where(eq(levelUnlocksTable.id, existingHighestRecord.id));
      } else {
        // Update the newly inserted record for this level
        await db
          .update(levelUnlocksTable)
          .set({ additionalInvestment: remainingAmount })
          .where(
            and(
              eq(levelUnlocksTable.userId, user.id),
              eq(levelUnlocksTable.level, targetLevel)
            )
          );
      }
    }

    // Set miningStartedAt if this is the first investment
    const miningStartedAt = user.miningStartedAt || (newCurrentLevel > 0 ? new Date() : null);

    await db
      .update(usersTable)
      .set({
        usdtBalance: user.usdtBalance - additionalUsdt,
        currentLevel: newCurrentLevel,
        isActive: newCurrentLevel > 0,
        miningStartedAt,
        totalDepositUsdt: user.totalDepositUsdt + additionalUsdt,
      })
      .where(eq(usersTable.id, user.id));

    const leveledUp = newCurrentLevel > user.currentLevel;
    const levelDef = LEVEL_DEFINITIONS.find(d => d.level === newCurrentLevel);
    const message = leveledUp
      ? `Invested $${additionalUsdt} — Level ${newCurrentLevel} (${levelDef?.name}) unlocked!`
      : `Added $${additionalUsdt} to your mining power.`;

    res.json({
      message,
      additionalUsdt,
      newUsdtBalance: user.usdtBalance - additionalUsdt,
      newLevel: newCurrentLevel,
      leveledUp,
    });
  } catch (err) {
    console.error("Invest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /levels/unlock — manual unlock: checks if totalMiningPower >= investmentThreshold,
// and if so marks the level (no USDT deducted — investment already happened via /invest).
// This is a fallback for edge cases; normal flow uses /invest which auto-unlocks.
router.post("/unlock", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { level } = req.body;

    if (!level || typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 7) {
      res.status(400).json({ error: "Invalid level. Must be 1–7." });
      return;
    }

    const levelDef = LEVEL_DEFINITIONS.find((d) => d.level === level);
    if (!levelDef) {
      res.status(400).json({ error: "Level not found." });
      return;
    }

    if (user.currentLevel >= level) {
      res.status(400).json({ error: "This level is already unlocked." });
      return;
    }

    if (user.currentLevel < level - 1) {
      res.status(400).json({ error: `You must unlock Level ${level - 1} first.` });
      return;
    }

    // Check if the user's totalMiningPower qualifies (investment already made)
    const existingUnlocks = await db
      .select()
      .from(levelUnlocksTable)
      .where(eq(levelUnlocksTable.userId, user.id));

    const totalMiningPower = computeTotalMiningPower(
      existingUnlocks.map(ul => ({ level: ul.level, additionalInvestment: ul.additionalInvestment }))
    );

    const threshold = levelDef.investmentThreshold ?? 0;
    if (totalMiningPower < threshold) {
      const needed = threshold - totalMiningPower;
      res.status(400).json({
        error: `You need $${needed.toFixed(2)} more invested to unlock this level (total $${threshold} required).`,
      });
      return;
    }

    const miningStartedAt = user.miningStartedAt || new Date();

    await db.insert(levelUnlocksTable).values({
      userId: user.id,
      level,
      additionalInvestment: 0,
    });

    await db
      .update(usersTable)
      .set({
        currentLevel: level,
        isActive: true,
        miningStartedAt,
      })
      .where(eq(usersTable.id, user.id));

    res.json({
      message: `Level ${level} — ${levelDef.name} — unlocked!`,
      newLevel: level,
      deducted: 0,
      newUsdtBalance: user.usdtBalance,
    });
  } catch (err) {
    console.error("Unlock level error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
