import { Router } from "express";
import { db, usersTable, depositsTable, withdrawalsTable, conversionsTable, systemConfigTable, depositAddressesTable } from "@workspace/db";
import { eq, sum } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

// ─── USERS ──────────────────────────────────────────────────────────

// GET /admin/users
router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      isActive: u.isActive,
      isBanned: u.isBanned,
      isAdmin: u.isAdmin,
      gemsBalance: u.gemsBalance,
      etrBalance: u.etrBalance,
      usdtBalance: u.usdtBalance,
      totalDepositUsdt: u.totalDepositUsdt,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Admin get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users/:userId/ban
router.post("/users/:userId/ban", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { banned } = req.body;
    if (typeof banned !== "boolean") {
      res.status(400).json({ error: "banned field must be boolean" });
      return;
    }
    await db.update(usersTable).set({ isBanned: banned }).where(eq(usersTable.id, userId));
    res.json({ message: `User ${banned ? "banned" : "unbanned"} successfully` });
  } catch (err) {
    console.error("Admin ban user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users/:userId/adjust-balance
router.post("/users/:userId/adjust-balance", requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { gemsBalance, etrBalance, usdtBalance } = req.body;
    const updates: any = {};
    if (gemsBalance !== undefined) updates.gemsBalance = Number(gemsBalance);
    if (etrBalance !== undefined) updates.etrBalance = Number(etrBalance);
    if (usdtBalance !== undefined) updates.usdtBalance = Number(usdtBalance);
    if (!Object.keys(updates).length) {
      res.status(400).json({ error: "No balance fields provided" });
      return;
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
    res.json({ message: "Balance updated" });
  } catch (err) {
    console.error("Admin adjust balance error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DEPOSITS ──────────────────────────────────────────────────────

// GET /admin/deposits
router.get("/deposits", requireAdmin, async (_req, res) => {
  try {
    const deposits = await db.select({
      id: depositsTable.id,
      userId: depositsTable.userId,
      username: usersTable.username,
      amountUsdt: depositsTable.amountUsdt,
      status: depositsTable.status,
      txHash: depositsTable.txHash,
      assignedAddress: depositsTable.assignedAddress,
      screenshotData: depositsTable.screenshotData,
      createdAt: depositsTable.createdAt,
      approvedAt: depositsTable.approvedAt,
    }).from(depositsTable)
      .leftJoin(usersTable, eq(depositsTable.userId, usersTable.id))
      .orderBy(depositsTable.createdAt);

    res.json(deposits.map(d => ({
      id: d.id,
      userId: d.userId,
      username: d.username || "Unknown",
      amountUsdt: d.amountUsdt,
      status: d.status,
      txHash: d.txHash,
      assignedAddress: d.assignedAddress,
      hasScreenshot: !!d.screenshotData,
      screenshotData: d.screenshotData,
      createdAt: d.createdAt.toISOString(),
      approvedAt: d.approvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Admin get deposits error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/deposits/:depositId/approve
router.post("/deposits/:depositId/approve", requireAdmin, async (req, res) => {
  try {
    const depositId = parseInt(req.params.depositId);
    const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.id, depositId));
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
    if (deposit.status !== "pending") { res.status(400).json({ error: "Deposit is not pending" }); return; }

    const now = new Date();
    await db.update(depositsTable).set({ status: "approved", approvedAt: now }).where(eq(depositsTable.id, depositId));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId));
    if (user) {
      const newTotal = user.totalDepositUsdt + deposit.amountUsdt;
      await db.update(usersTable).set({
        isActive: true,
        totalDepositUsdt: newTotal,
        miningStartedAt: user.isActive ? user.miningStartedAt : now,
      }).where(eq(usersTable.id, user.id));
    }

    res.json({ message: "Deposit approved successfully" });
  } catch (err) {
    console.error("Admin approve deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/deposits/:depositId/reject
router.post("/deposits/:depositId/reject", requireAdmin, async (req, res) => {
  try {
    const depositId = parseInt(req.params.depositId);
    const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.id, depositId));
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
    await db.update(depositsTable).set({ status: "rejected" }).where(eq(depositsTable.id, depositId));
    res.json({ message: "Deposit rejected" });
  } catch (err) {
    console.error("Admin reject deposit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/deposits/:depositId/screenshot — admin deletes screenshot
router.delete("/deposits/:depositId/screenshot", requireAdmin, async (req, res) => {
  try {
    const depositId = parseInt(req.params.depositId);
    const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.id, depositId));
    if (!deposit) { res.status(404).json({ error: "Deposit not found" }); return; }
    await db.update(depositsTable).set({ screenshotData: null }).where(eq(depositsTable.id, depositId));
    res.json({ message: "Screenshot deleted" });
  } catch (err) {
    console.error("Admin delete screenshot error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── WITHDRAWALS ─────────────────────────────────────────────────────

// GET /admin/withdrawals
router.get("/withdrawals", requireAdmin, async (_req, res) => {
  try {
    const withdrawals = await db.select({
      id: withdrawalsTable.id,
      userId: withdrawalsTable.userId,
      username: usersTable.username,
      currency: withdrawalsTable.currency,
      amount: withdrawalsTable.amount,
      walletAddress: withdrawalsTable.walletAddress,
      status: withdrawalsTable.status,
      createdAt: withdrawalsTable.createdAt,
      processedAt: withdrawalsTable.processedAt,
    }).from(withdrawalsTable)
      .leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
      .orderBy(withdrawalsTable.createdAt);

    res.json(withdrawals.map(w => ({
      id: w.id,
      userId: w.userId,
      username: w.username || "Unknown",
      currency: w.currency,
      amount: w.amount,
      walletAddress: w.walletAddress,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      processedAt: w.processedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    console.error("Admin get withdrawals error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/withdrawals/:withdrawalId/approve
router.post("/withdrawals/:withdrawalId/approve", requireAdmin, async (req, res) => {
  try {
    const withdrawalId = parseInt(req.params.withdrawalId);
    await db.update(withdrawalsTable).set({ status: "approved", processedAt: new Date() }).where(eq(withdrawalsTable.id, withdrawalId));
    res.json({ message: "Withdrawal approved" });
  } catch (err) {
    console.error("Admin approve withdrawal error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/withdrawals/:withdrawalId/reject
router.post("/withdrawals/:withdrawalId/reject", requireAdmin, async (req, res) => {
  try {
    const withdrawalId = parseInt(req.params.withdrawalId);
    const [withdrawal] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, withdrawalId));
    if (!withdrawal) { res.status(404).json({ error: "Withdrawal not found" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId));
    if (user) {
      if (withdrawal.currency === "etr") {
        await db.update(usersTable).set({ etrBalance: user.etrBalance + withdrawal.amount }).where(eq(usersTable.id, user.id));
      } else {
        await db.update(usersTable).set({ usdtBalance: user.usdtBalance + withdrawal.amount }).where(eq(usersTable.id, user.id));
      }
    }

    await db.update(withdrawalsTable).set({ status: "rejected", processedAt: new Date() }).where(eq(withdrawalsTable.id, withdrawalId));
    res.json({ message: "Withdrawal rejected and funds refunded" });
  } catch (err) {
    console.error("Admin reject withdrawal error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DEPOSIT ADDRESSES ─────────────────────────────────────────────────

// GET /admin/addresses
router.get("/addresses", requireAdmin, async (_req, res) => {
  try {
    const addresses = await db.select().from(depositAddressesTable).orderBy(depositAddressesTable.createdAt);
    res.json(addresses.map(a => ({
      id: a.id,
      address: a.address,
      label: a.label,
      network: a.network,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("Admin get addresses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/addresses
router.post("/addresses", requireAdmin, async (req, res) => {
  try {
    const { address, label, network } = req.body;
    if (!address || !address.trim()) {
      res.status(400).json({ error: "Address is required" });
      return;
    }
    // Basic BSC address validation (0x prefix + 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      res.status(400).json({ error: "Invalid BSC/BNB address format (must be 0x...)" });
      return;
    }
    const [newAddr] = await db.insert(depositAddressesTable).values({
      address: address.trim(),
      label: label?.trim() || "",
      network: network || "BSC (BEP-20)",
      isActive: true,
    }).returning();

    res.status(201).json({
      id: newAddr.id,
      address: newAddr.address,
      label: newAddr.label,
      network: newAddr.network,
      isActive: newAddr.isActive,
      createdAt: newAddr.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Admin add address error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/addresses/:id
router.put("/addresses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { address, label, network, isActive } = req.body;

    const [existing] = await db.select().from(depositAddressesTable).where(eq(depositAddressesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Address not found" }); return; }

    if (address && !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      res.status(400).json({ error: "Invalid BSC/BNB address format" });
      return;
    }

    const updates: any = { updatedAt: new Date() };
    if (address !== undefined) updates.address = address.trim();
    if (label !== undefined) updates.label = label.trim();
    if (network !== undefined) updates.network = network.trim();
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db.update(depositAddressesTable).set(updates).where(eq(depositAddressesTable.id, id)).returning();
    res.json({
      id: updated.id,
      address: updated.address,
      label: updated.label,
      network: updated.network,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Admin update address error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/addresses/:id
router.delete("/addresses/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(depositAddressesTable).where(eq(depositAddressesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Address not found" }); return; }
    await db.delete(depositAddressesTable).where(eq(depositAddressesTable.id, id));
    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("Admin delete address error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── STATS ─────────────────────────────────────────────────────────────

// GET /admin/stats
router.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const bannedUsers = users.filter(u => u.isBanned).length;
    const totalGemsMined = users.reduce((acc, u) => acc + u.gemsBalance, 0);
    const totalDepositsUsdt = users.reduce((acc, u) => acc + u.totalDepositUsdt, 0);

    const [etrRow] = await db.select({ total: sum(conversionsTable.outputAmount) })
      .from(conversionsTable).where(eq(conversionsTable.outputType, "etr"));
    const totalEtrConverted = etrRow?.total ? parseFloat(etrRow.total) : 0;

    const [configRow] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "total_etr_swapped"));
    const totalEtrSupplyUsed = configRow ? parseFloat(configRow.value) : 0;

    const deposits = await db.select().from(depositsTable);
    const pendingDeposits = deposits.filter(d => d.status === "pending").length;

    const withdrawals = await db.select().from(withdrawalsTable);
    const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;

    const addresses = await db.select().from(depositAddressesTable);
    const activeAddresses = addresses.filter(a => a.isActive).length;

    res.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalGemsMined,
      totalEtrConverted,
      totalEtrSupplyUsed,
      totalDepositsUsdt,
      pendingDeposits,
      pendingWithdrawals,
      totalAddresses: addresses.length,
      activeAddresses,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
