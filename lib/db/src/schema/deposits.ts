import { pgTable, serial, integer, doublePrecision, text, timestamp } from "drizzle-orm/pg-core";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amountUsdt: doublePrecision("amount_usdt").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  txHash: text("tx_hash"),
  screenshotData: text("screenshot_data"), // base64 image data
  assignedAddress: text("assigned_address"), // BSC address assigned to this deposit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export type Deposit = typeof depositsTable.$inferSelect;
export type InsertDeposit = typeof depositsTable.$inferInsert;
