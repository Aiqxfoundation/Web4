import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /wallet
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      gemsBalance: user.gemsBalance,
      etrBalance: user.etrBalance,
      usdtBalance: user.usdtBalance,
      isVerified: user.isKycVerified ?? false,
      verifiedAt: user.kycVerifiedAt?.toISOString() ?? null,
      miningStartedAt: user.miningStartedAt?.toISOString() ?? null,
    });
  } catch (err) {
    console.error("Wallet error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /wallet/transfer — ETR transfer between users (verified only)
router.post("/transfer", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { toUsername, amount } = req.body;

    if (!toUsername || !amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Invalid transfer request" });
      return;
    }

    // Only verified users can transfer ETR
    if (!user.isKycVerified) {
      res.status(403).json({
        error: "ETR transfers are only available to verified miners. Mint your Verification Badge to unlock transfers.",
        code: "VERIFICATION_REQUIRED",
      });
      return;
    }

    if (user.etrBalance < Number(amount)) {
      res.status(400).json({ error: "Insufficient ETR balance" });
      return;
    }

    if (toUsername === user.username) {
      res.status(400).json({ error: "Cannot transfer to yourself" });
      return;
    }

    const [recipient] = await db.select().from(usersTable).where(eq(usersTable.username, toUsername));
    if (!recipient) {
      res.status(400).json({ error: "Recipient user not found" });
      return;
    }

    if (recipient.isBanned) {
      res.status(400).json({ error: "Recipient account is not accessible" });
      return;
    }

    await db.update(usersTable).set({
      etrBalance: user.etrBalance - Number(amount),
    }).where(eq(usersTable.id, user.id));

    await db.update(usersTable).set({
      etrBalance: recipient.etrBalance + Number(amount),
    }).where(eq(usersTable.id, recipient.id));

    res.json({ message: `Transferred ${amount} ETR to ${toUsername}` });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
