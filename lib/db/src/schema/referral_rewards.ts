import { pgTable, serial, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";

export const referralGemRewardsTable = pgTable("referral_gem_rewards", {
  id: serial("id").primaryKey(),
  uplineUserId: integer("upline_user_id").notNull(),
  refereeUserId: integer("referee_user_id").notNull(),
  gemsAmount: doublePrecision("gems_amount").notNull(),
  isClaimed: boolean("is_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReferralGemReward = typeof referralGemRewardsTable.$inferSelect;
