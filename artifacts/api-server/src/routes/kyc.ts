import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const KYC_ETR_COST = 20;

// POST /kyc/pay — pay 20 ETR to get KYC verified
router.post("/pay", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.isKycVerified) {
      res.status(400).json({ error: "Account is already KYC verified." });
      return;
    }

    // Re-fetch fresh balance
    const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    if (!freshUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (freshUser.etrBalance < KYC_ETR_COST) {
      res.status(400).json({
        error: `Insufficient ETR balance. You need ${KYC_ETR_COST} ETR to complete KYC verification. You have ${freshUser.etrBalance.toFixed(4)} ETR.`,
      });
      return;
    }

    await db.update(usersTable).set({
      etrBalance: freshUser.etrBalance - KYC_ETR_COST,
      isKycVerified: true,
      kycVerifiedAt: new Date(),
    }).where(eq(usersTable.id, freshUser.id));

    res.json({
      message: "KYC verification successful! Your account is now fully verified.",
      etrDeducted: KYC_ETR_COST,
    });
  } catch (err) {
    console.error("KYC pay error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
