import { Router } from "express";
import { db, usersTable, conversionsTable, systemConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getConversionRate, gemsToEtr, gemsToUsdt } from "../lib/mining.js";

const router = Router();

async function getTotalEtrSwapped(): Promise<number> {
  const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "total_etr_swapped"));
  return row ? parseFloat(row.value) : 0;
}

// GET /conversions
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const conversions = await db.select().from(conversionsTable)
      .where(eq(conversionsTable.userId, user.id))
      .orderBy(conversionsTable.createdAt);

    res.json(conversions.map(c => ({
      id: c.id,
      gemsSpent: c.gemsSpent,
      outputType: c.outputType,
      outputAmount: c.outputAmount,
      conversionRate: c.conversionRate,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Get conversions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /conversions
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { gemsAmount, outputType } = req.body;

    if (!gemsAmount || gemsAmount <= 0) {
      res.status(400).json({ error: "Invalid gems amount" });
      return;
    }

    if (!["etr", "usdt"].includes(outputType)) {
      res.status(400).json({ error: "Invalid output type. Use 'etr' or 'usdt'" });
      return;
    }

    if (user.gemsBalance < gemsAmount) {
      res.status(400).json({ error: "Insufficient gems balance" });
      return;
    }

    const totalEtrSwapped = await getTotalEtrSwapped();
    const conversionRate = getConversionRate(totalEtrSwapped);

    let outputAmount: number;
    let etrEquivalent: number;

    if (outputType === "etr") {
      outputAmount = gemsToEtr(gemsAmount, totalEtrSwapped);
      etrEquivalent = outputAmount;

      // Update user ETR balance
      await db.update(usersTable).set({
        gemsBalance: user.gemsBalance - gemsAmount,
        etrBalance: user.etrBalance + outputAmount,
      }).where(eq(usersTable.id, user.id));
    } else {
      // USDT: convert via ETR pricing
      outputAmount = gemsToUsdt(gemsAmount, totalEtrSwapped);
      etrEquivalent = gemsToEtr(gemsAmount, totalEtrSwapped);

      await db.update(usersTable).set({
        gemsBalance: user.gemsBalance - gemsAmount,
        usdtBalance: user.usdtBalance + outputAmount,
      }).where(eq(usersTable.id, user.id));
    }

    const newEtrSwapped = totalEtrSwapped + etrEquivalent;

    // Distribute referral rewards: level 1 = 15% of gems, level 2 = 5%
    if (user.referredByUserId) {
      const level1Id = user.referredByUserId as number;
      const [level1User] = await db.select().from(usersTable).where(eq(usersTable.id, level1Id));
      if (level1User && !level1User.isBanned) {
        const level1Reward = gemsAmount * 0.15;
        await db.update(usersTable).set({
          gemsBalance: level1User.gemsBalance + level1Reward,
        }).where(eq(usersTable.id, level1User.id));

        if (level1User.referredByUserId) {
          const level2Id = level1User.referredByUserId as number;
          const [level2User] = await db.select().from(usersTable).where(eq(usersTable.id, level2Id));
          if (level2User && !level2User.isBanned) {
            const level2Reward = gemsAmount * 0.05;
            await db.update(usersTable).set({
              gemsBalance: level2User.gemsBalance + level2Reward,
            }).where(eq(usersTable.id, level2User.id));
          }
        }
      }
    }

    // Update system total ETR swapped
    await db.insert(systemConfigTable).values({
      key: "total_etr_swapped",
      value: newEtrSwapped.toString(),
    }).onConflictDoUpdate({
      target: systemConfigTable.key,
      set: { value: newEtrSwapped.toString(), updatedAt: new Date() },
    });

    // Record the conversion
    const [conversion] = await db.insert(conversionsTable).values({
      userId: user.id,
      gemsSpent: gemsAmount,
      outputType,
      outputAmount,
      conversionRate,
    }).returning();

    res.status(201).json({
      id: conversion.id,
      gemsSpent: conversion.gemsSpent,
      outputType: conversion.outputType,
      outputAmount: conversion.outputAmount,
      conversionRate: conversion.conversionRate,
      createdAt: conversion.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Create conversion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
