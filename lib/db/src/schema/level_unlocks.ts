import { pgTable, serial, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

export const levelUnlocksTable = pgTable("level_unlocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  level: integer("level").notNull(),
  additionalInvestment: doublePrecision("additional_investment").notNull().default(0),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export type LevelUnlock = typeof levelUnlocksTable.$inferSelect;
