import { pgTable, serial, integer, doublePrecision, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversionsTable = pgTable("conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gemsSpent: doublePrecision("gems_spent").notNull(),
  outputType: text("output_type").notNull(), // etr | usdt
  outputAmount: doublePrecision("output_amount").notNull(),
  conversionRate: doublePrecision("conversion_rate").notNull(), // gems per etr at time of conversion
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversionSchema = createInsertSchema(conversionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversionsTable.$inferSelect;
