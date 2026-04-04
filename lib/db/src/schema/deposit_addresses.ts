import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const depositAddressesTable = pgTable("deposit_addresses", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  label: text("label").notNull().default(""),
  network: text("network").notNull().default("BSC"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DepositAddress = typeof depositAddressesTable.$inferSelect;
export type InsertDepositAddress = typeof depositAddressesTable.$inferInsert;
