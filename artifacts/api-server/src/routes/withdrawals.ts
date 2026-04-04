import { Router } from "express";
import { db, withdrawalsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const WITHDRAWAL_ETR_FEE = 0.1;
const MINING_REQUIRED_HOURS = 24;

// GET /withdrawals — user's own withdrawal history
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const withdrawals = await db
      .select()
      .from(withdrawalsTable)
      .where(eq(withdrawalsTable.userId, user.id))
      .orderBy(withdrawalsTable.createdAt);

    res.json(
      withdrawals.map((w) => ({
        id: w.id,
        currency: w.currency,
        amount: w.amount,
        walletAddress: w.walletAddress,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        processedAt: w.processedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    console.error("Get withdrawals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /withdrawals — create a new withdrawal request
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { currency, amount, walletAddress } = req.body;

    // Validate currency
    if (!currency || !["etr", "usdt"].includes(currency)) {
      res.status(400).json({ error: "Invalid currency. Use 'etr' or 'usdt'" });
      return;
    }

    // ETR withdrawal is locked until mainnet goes live
    if (currency === "etr") {
      res.status(403).json({
        error: "ETR withdrawal is currently disabled. It will be enabled after the ETR Mainnet launch.",
        code: "ETR_MAINNET_PENDING",
      });
      return;
    }

    // USDT withdrawal requires Verification Badge
    if (currency === "usdt" && !user.isKycVerified) {
      res.status(403).json({
        error: "USDT withdrawals are only available to verified miners. Mint your Verification Badge (20 ETR) to unlock withdrawals.",
        code: "VERIFICATION_REQUIRED",
      });
      return;
    }

    // Check 24-hour mining requirement
    if (!user.miningStartedAt) {
      res.status(403).json({
        error: "You must start mining before you can withdraw.",
        code: "MINING_NOT_STARTED",
      });
      return;
    }

    const hoursSinceMiningStart =
      (Date.now() - new Date(user.miningStartedAt).getTime()) / (1000 * 60 * 60);

    if (hoursSinceMiningStart < MINING_REQUIRED_HOURS) {
      const hoursLeft = Math.ceil(MINING_REQUIRED_HOURS - hoursSinceMiningStart);
      res.status(403).json({
        error: `Withdrawals unlock after 24 hours of active mining. Please wait ${hoursLeft} more hour${hoursLeft !== 1 ? "s" : ""}.`,
        code: "MINING_24H_REQUIRED",
      });
      return;
    }

    // Validate amount
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0 || !isFinite(numAmount)) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== "string" || !walletAddress.trim()) {
      res.status(400).json({ error: "Wallet address is required" });
      return;
    }

    // Check minimum withdrawal
    if (numAmount < 1) {
      res.status(400).json({ error: "Minimum withdrawal amount is 1" });
      return;
    }

    // Re-fetch user balance fresh to prevent race conditions
    const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    if (!freshUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check 0.1 ETR fee availability
    if (freshUser.etrBalance < WITHDRAWAL_ETR_FEE) {
      res.status(400).json({
        error: `Each withdrawal requires a 0.1 ETR processing fee. Your current ETR balance is ${freshUser.etrBalance.toFixed(4)} ETR.`,
        code: "INSUFFICIENT_ETR_FEE",
      });
      return;
    }

    if (currency === "usdt" && freshUser.usdtBalance < numAmount) {
      res.status(400).json({ error: "Insufficient USDT balance" });
      return;
    }

    // Deduct USDT balance + 0.1 ETR fee
    await db.update(usersTable).set({
      usdtBalance: freshUser.usdtBalance - numAmount,
      etrBalance: freshUser.etrBalance - WITHDRAWAL_ETR_FEE,
    }).where(eq(usersTable.id, freshUser.id));

    const [withdrawal] = await db.insert(withdrawalsTable).values({
      userId: freshUser.id,
      currency,
      amount: numAmount,
      walletAddress: walletAddress.trim(),
    }).returning();

    res.status(201).json({
      id: withdrawal.id,
      currency: withdrawal.currency,
      amount: withdrawal.amount,
      walletAddress: withdrawal.walletAddress,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt.toISOString(),
      processedAt: null,
    });
  } catch (err) {
    console.error("Create withdrawal error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
