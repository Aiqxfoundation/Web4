import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const VERIFICATION_ETR_COST = 20;

// POST /verify/mint — pay 20 ETR to mint Verification Badge
router.post("/mint", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    if (user.isKycVerified) {
      res.status(400).json({ error: "Verification badge already minted." });
      return;
    }

    const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    if (!freshUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (freshUser.etrBalance < VERIFICATION_ETR_COST) {
      res.status(400).json({
        error: `You need ${VERIFICATION_ETR_COST} ETR to mint your Verification Badge. Current balance: ${freshUser.etrBalance.toFixed(4)} ETR.`,
        code: "INSUFFICIENT_ETR",
      });
      return;
    }

    await db.update(usersTable).set({
      etrBalance: freshUser.etrBalance - VERIFICATION_ETR_COST,
      isKycVerified: true,
      kycVerifiedAt: new Date(),
    }).where(eq(usersTable.id, freshUser.id));

    res.json({
      message: "Verification Badge minted successfully.",
      etrDeducted: VERIFICATION_ETR_COST,
    });
  } catch (err) {
    console.error("Verify mint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
