import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /referrals
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get level 1 referrals (direct referrals)
    const level1Users = await db.select().from(usersTable)
      .where(eq(usersTable.referredByUserId, user.id));

    const level1 = level1Users.map(u => ({
      username: u.username,
      isActive: u.isActive,
      joinedAt: u.createdAt.toISOString(),
    }));

    // Get level 2 referrals (referrals of referrals)
    const level2: { username: string; isActive: boolean; joinedAt: string }[] = [];
    for (const l1 of level1Users) {
      const l2Users = await db.select().from(usersTable)
        .where(eq(usersTable.referredByUserId, l1.id));
      for (const u of l2Users) {
        level2.push({
          username: u.username,
          isActive: u.isActive,
          joinedAt: u.createdAt.toISOString(),
        });
      }
    }

    const totalReferrals = level1.length + level2.length;

    // Total referral rewards can be tracked if needed; for now return current gems balance context
    // In a more advanced system, we'd track referral rewards separately
    res.json({
      referralCode: user.referralCode,
      totalReferrals,
      totalRewardGems: 0, // Would need separate tracking table in full implementation
      level1,
      level2,
    });
  } catch (err) {
    console.error("Referrals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /referrals/apply — apply a referral code after signup
router.post("/apply", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.referredByUserId) {
      res.status(400).json({ error: "You have already applied a referral code." });
      return;
    }

    const { referralCode } = req.body;
    if (!referralCode || typeof referralCode !== "string" || !referralCode.trim()) {
      res.status(400).json({ error: "Referral code is required." });
      return;
    }

    const code = referralCode.trim().toUpperCase();

    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, code));

    if (!referrer) {
      res.status(404).json({ error: "Invalid referral code. No user found." });
      return;
    }

    if (referrer.id === user.id) {
      res.status(400).json({ error: "You cannot refer yourself." });
      return;
    }

    await db
      .update(usersTable)
      .set({ referredByUserId: referrer.id })
      .where(eq(usersTable.id, user.id));

    res.json({ message: `Successfully linked to ${referrer.username}'s referral.` });
  } catch (err) {
    console.error("Apply referral error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
