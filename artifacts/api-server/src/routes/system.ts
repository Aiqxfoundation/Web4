import { Router } from "express";
import { db, systemConfigTable, conversionsTable } from "@workspace/db";
import { eq, sum } from "drizzle-orm";
import { getConversionRate, ETR_DYNAMIC_THRESHOLD, ETR_TOTAL_SUPPLY } from "../lib/mining.js";

const router = Router();

// GET /system/stats
router.get("/stats", async (_req, res) => {
  try {
    const [row] = await db.select().from(systemConfigTable).where(eq(systemConfigTable.key, "total_etr_swapped"));
    const totalEtrSwapped = row ? parseFloat(row.value) : 0;

    const conversionRate = getConversionRate(totalEtrSwapped);

    // Calculate circulating ETR (sum of all etr outputs from conversions)
    const [etrResult] = await db.select({ total: sum(conversionsTable.outputAmount) })
      .from(conversionsTable)
      .where(eq(conversionsTable.outputType, "etr"));

    const etrCirculating = etrResult?.total ? parseFloat(etrResult.total) : 0;

    res.json({
      totalEtrSwapped,
      conversionRateGemsPerEtr: conversionRate,
      isDynamicRateActive: totalEtrSwapped >= ETR_DYNAMIC_THRESHOLD,
      etrTotalSupply: ETR_TOTAL_SUPPLY,
      etrCirculating,
    });
  } catch (err) {
    console.error("System stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
