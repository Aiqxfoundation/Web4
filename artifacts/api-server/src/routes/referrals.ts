import { Router } from "express";
import { db, usersTable, referralGemRewardsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /referrals — get full referral network with gem reward breakdown
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get level 1 referrals (direct referrals)
    const level1Users = await db.select().from(usersTable)
      .where(eq(usersTable.referredByUserId, user.id as unknown as number));

    // Get level 2 referrals (referrals of referrals)
    const level2Users: typeof level1Users = [];
    for (const l1 of level1Users) {
      const l2 = await db.select().from(usersTable)
        .where(eq(usersTable.referredByUserId, l1.id as unknown as number));
      level2Users.push(...l2);
    }

    // Get all unclaimed referral gem rewards for this upline
    const allRewards = await db.select().from(referralGemRewardsTable)
      .where(and(
        eq(referralGemRewardsTable.uplineUserId, user.id),
        eq(referralGemRewardsTable.isClaimed, false)
      ));

    // Build per-referee reward map
    const rewardsByReferee = new Map<number, { claimable: number; locked: number }>();
    for (const reward of allRewards) {
      const referee = [...level1Users, ...level2Users].find(u => u.id === reward.refereeUserId);
      const refereeVerified = referee?.isKycVerified ?? false;
      const uplineVerified = user.isKycVerified;
      const isLocked = !refereeVerified || !uplineVerified;

      const current = rewardsByReferee.get(reward.refereeUserId) ?? { claimable: 0, locked: 0 };
      if (isLocked) {
        current.locked += reward.gemsAmount;
      } else {
        current.claimable += reward.gemsAmount;
      }
      rewardsByReferee.set(reward.refereeUserId, current);
    }

    // Build level1 list with rewards
    const level1 = level1Users.map(u => {
      const rewards = rewardsByReferee.get(u.id) ?? { claimable: 0, locked: 0 };
      return {
        username: u.username,
        isActive: u.isActive,
        isKycVerified: u.isKycVerified,
        joinedAt: u.createdAt.toISOString(),
        claimableGems: Math.floor(rewards.claimable),
        lockedGems: Math.floor(rewards.locked),
      };
    });

    // Build level2 list with rewards
    const level2 = level2Users.map(u => {
      const rewards = rewardsByReferee.get(u.id) ?? { claimable: 0, locked: 0 };
      return {
        username: u.username,
        isActive: u.isActive,
        isKycVerified: u.isKycVerified,
        joinedAt: u.createdAt.toISOString(),
        claimableGems: Math.floor(rewards.claimable),
        lockedGems: Math.floor(rewards.locked),
      };
    });

    const totalClaimableGems = level1.reduce((s, u) => s + u.claimableGems, 0) +
      level2.reduce((s, u) => s + u.claimableGems, 0);
    const totalLockedGems = level1.reduce((s, u) => s + u.lockedGems, 0) +
      level2.reduce((s, u) => s + u.lockedGems, 0);

    res.json({
      referralCode: user.referralCode,
      totalReferrals: level1.length + level2.length,
      totalRewardGems: totalClaimableGems + totalLockedGems,
      totalClaimableGems,
      totalLockedGems,
      uplineIsVerified: user.isKycVerified,
      level1,
      level2,
    });
  } catch (err) {
    console.error("Referrals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /referrals/claim-gems — claim all unlocked referral gem rewards
router.post("/claim-gems", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (!user.isKycVerified) {
      res.status(403).json({ error: "You must be KYC verified to claim referral gems." });
      return;
    }

    // Get all unclaimed rewards for this upline
    const allRewards = await db.select().from(referralGemRewardsTable)
      .where(and(
        eq(referralGemRewardsTable.uplineUserId, user.id),
        eq(referralGemRewardsTable.isClaimed, false)
      ));

    if (!allRewards.length) {
      res.status(400).json({ error: "No referral gem rewards available to claim." });
      return;
    }

    // Determine which rewards are claimable (both upline and referee must be KYC verified)
    const claimableRewardIds: number[] = [];
    let totalClaimableGems = 0;

    for (const reward of allRewards) {
      const [referee] = await db.select().from(usersTable).where(eq(usersTable.id, reward.refereeUserId));
      if (referee?.isKycVerified) {
        claimableRewardIds.push(reward.id);
        totalClaimableGems += reward.gemsAmount;
      }
    }

    if (!claimableRewardIds.length) {
      res.status(400).json({
        error: "No claimable gems yet — your referees must also be KYC verified before you can claim their gem rewards.",
      });
      return;
    }

    const claimedGems = Math.floor(totalClaimableGems);
    const now = new Date();

    // Mark rewards as claimed
    for (const id of claimableRewardIds) {
      await db.update(referralGemRewardsTable)
        .set({ isClaimed: true, claimedAt: now })
        .where(eq(referralGemRewardsTable.id, id));
    }

    // Credit gems to upline balance
    const newBalance = user.gemsBalance + claimedGems;
    await db.update(usersTable)
      .set({ gemsBalance: newBalance })
      .where(eq(usersTable.id, user.id));

    res.json({
      claimedGems,
      newGemsBalance: newBalance,
      message: `Successfully claimed ${claimedGems.toLocaleString()} referral gems!`,
    });
  } catch (err) {
    console.error("Claim referral gems error:", err);
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
      .set({ referredByUserId: referrer.id as unknown as number })
      .where(eq(usersTable.id, user.id));

    res.json({ message: `Successfully linked to ${referrer.username}'s referral.` });
  } catch (err) {
    console.error("Apply referral error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
