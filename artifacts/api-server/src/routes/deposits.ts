import { Router } from "express";
import { db, depositsTable, depositAddressesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// GET /deposits — user's own deposit history
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const deposits = await db
      .select()
      .from(depositsTable)
      .where(eq(depositsTable.userId, user.id))
      .orderBy(depositsTable.createdAt);

    res.json(
      deposits.map((d) => ({
        id: d.id,
        amountUsdt: d.amountUsdt,
        status: d.status,
        txHash: d.txHash,
        assignedAddress: d.assignedAddress,
        hasScreenshot: !!d.screenshotData,
        screenshotData: d.screenshotData,
        createdAt: d.createdAt.toISOString(),
        approvedAt: d.approvedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    console.error("Get deposits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /deposits/generate-address — pick a random active BSC address from the pool
router.get("/generate-address", requireAuth, async (_req, res) => {
  try {
    const addresses = await db
      .select()
      .from(depositAddressesTable)
      .where(eq(depositAddressesTable.isActive, true));

    if (!addresses.length) {
      res.status(503).json({ error: "No deposit addresses available. Please contact support." });
      return;
    }

    const random = addresses[Math.floor(Math.random() * addresses.length)];
    res.json({
      id: random.id,
      address: random.address,
      label: random.label,
      network: random.network,
    });
  } catch (err) {
    console.error("Generate address error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /deposits — submit a new deposit request
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { amountUsdt, txHash, screenshotData, assignedAddress } = req.body;

    const amount = Number(amountUsdt);
    if (!amount || amount < 10) {
      res.status(400).json({ error: "Minimum deposit is $10 USDT" });
      return;
    }

    if (!txHash && !screenshotData) {
      res.status(400).json({ error: "Please provide either a transaction hash or upload a payment screenshot." });
      return;
    }

    // Validate txHash format if provided
    if (txHash && typeof txHash !== "string") {
      res.status(400).json({ error: "Invalid transaction hash" });
      return;
    }

    // Validate base64 screenshot — limit to ~5 MB (base64 expands ~33%)
    if (screenshotData) {
      if (typeof screenshotData !== "string") {
        res.status(400).json({ error: "Invalid screenshot data" });
        return;
      }
      if (screenshotData.length > 7 * 1024 * 1024) {
        res.status(400).json({ error: "Screenshot is too large. Maximum 5 MB." });
        return;
      }
      // Must be a valid data URL or base64
      if (!screenshotData.startsWith("data:image/")) {
        res.status(400).json({ error: "Invalid screenshot format. Must be an image." });
        return;
      }
    }

    const [deposit] = await db
      .insert(depositsTable)
      .values({
        userId: user.id,
        amountUsdt: amount,
        txHash: txHash?.trim() || null,
        screenshotData: screenshotData || null,
        assignedAddress: assignedAddress?.trim() || null,
      })
      .returning();

    res.status(201).json({
      id: deposit.id,
      amountUsdt: deposit.amountUsdt,
      status: deposit.status,
      txHash: deposit.txHash,
      assignedAddress: deposit.assignedAddress,
      hasScreenshot: !!deposit.screenshotData,
      createdAt: deposit.createdAt.toISOString(),
      approvedAt: null,
    });
  } catch (err) {
    console.error("Create deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /deposits/:id/screenshot — user removes their own screenshot from a pending deposit
router.delete("/:id/screenshot", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const depositId = parseInt(req.params.id);

    if (isNaN(depositId)) {
      res.status(400).json({ error: "Invalid deposit ID" });
      return;
    }

    const [deposit] = await db
      .select()
      .from(depositsTable)
      .where(and(eq(depositsTable.id, depositId), eq(depositsTable.userId, user.id)));

    if (!deposit) {
      res.status(404).json({ error: "Deposit not found" });
      return;
    }

    if (deposit.status !== "pending") {
      res.status(400).json({ error: "Cannot edit a processed deposit" });
      return;
    }

    await db.update(depositsTable).set({ screenshotData: null }).where(eq(depositsTable.id, depositId));
    res.json({ message: "Screenshot removed" });
  } catch (err) {
    console.error("Delete screenshot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
