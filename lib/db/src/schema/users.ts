import { pgTable, serial, text, boolean, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  recoveryQuestion: text("recovery_question").notNull(),
  recoveryAnswerHash: text("recovery_answer_hash").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredByUserId: doublePrecision("referred_by_user_id"),
  isActive: boolean("is_active").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  gemsBalance: doublePrecision("gems_balance").notNull().default(0),
  etrBalance: doublePrecision("etr_balance").notNull().default(0),
  usdtBalance: doublePrecision("usdt_balance").notNull().default(0),
  totalDepositUsdt: doublePrecision("total_deposit_usdt").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(0),
  isKycVerified: boolean("is_kyc_verified").notNull().default(false),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  miningStartedAt: timestamp("mining_started_at"),
  lastClaimedAt: timestamp("last_claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  isActive: true,
  isBanned: true,
  isAdmin: true,
  gemsBalance: true,
  etrBalance: true,
  usdtBalance: true,
  totalDepositUsdt: true,
  miningStartedAt: true,
  lastClaimedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
