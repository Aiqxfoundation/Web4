// ─── Level Definitions ────────────────────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  name: string;
  unlockCost: number | null;        // Incremental cost — used for computeTotalMiningPower
  investmentThreshold: number | null; // Cumulative total investment needed to unlock this level
  description: string;
  gemsPerYear: number;
  usdtReturn: number | null;        // Annual return based on investmentThreshold × returnMultiplier
  returnMultiplier: number;         // Annual return multiplier: 1.0 = 100%, 2.5 = 250%
  pickaxeImage: string;
}

// ─── Scalable Investment Thresholds ──────────────────────────────────────────
// Base = $100. Each level unlocks when totalMiningPower reaches the threshold.
// Thresholds: $100 × 1, 2.5, 3, 3.5, 4, 4.5, 5
// Incremental costs (unlockCost) are the DIFFERENCE between adjacent thresholds.
// computeTotalMiningPower sums incremental costs + additionalInvestment, giving
// the exact totalMiningPower at any level.

const THRESHOLDS = [0, 100, 250, 300, 350, 400, 450, 500] as const;

function incrementalCost(level: number): number {
  if (level === 0) return 0;
  return THRESHOLDS[level] - THRESHOLDS[level - 1];
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    level: 0,
    name: "Shadow Initiate",
    unlockCost: 0,
    investmentThreshold: 0,
    description: "Free mining — accumulate gems at no cost. Invest $100 USDT to level up.",
    gemsPerYear: 285_714,
    usdtReturn: null,
    returnMultiplier: 0,
    pickaxeImage: "/images/etr-logo.png",
  },
  {
    level: 1,
    name: "Fire Starter",
    unlockCost: incrementalCost(1),          // $100
    investmentThreshold: THRESHOLDS[1],      // $100
    description: "Begin your journey. Earn 1× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[1] * 40_000 * 1.0),
    usdtReturn: Math.round(THRESHOLDS[1] * 1.0 * 100) / 100,
    returnMultiplier: 1.0,
    pickaxeImage: "/images/pickaxe-1.png",
  },
  {
    level: 2,
    name: "Nature Walker",
    unlockCost: incrementalCost(2),          // $150
    investmentThreshold: THRESHOLDS[2],      // $250
    description: "Growth phase. Earn 1.2× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[2] * 40_000 * 1.2),
    usdtReturn: Math.round(THRESHOLDS[2] * 1.2 * 100) / 100,
    returnMultiplier: 1.2,
    pickaxeImage: "/images/pickaxe-2.png",
  },
  {
    level: 3,
    name: "Storm Chaser",
    unlockCost: incrementalCost(3),          // $50
    investmentThreshold: THRESHOLDS[3],      // $300
    description: "Electrify your output. Earn 1.4× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[3] * 40_000 * 1.4),
    usdtReturn: Math.round(THRESHOLDS[3] * 1.4 * 100) / 100,
    returnMultiplier: 1.4,
    pickaxeImage: "/images/pickaxe-3.png",
  },
  {
    level: 4,
    name: "Shadow Raider",
    unlockCost: incrementalCost(4),          // $50
    investmentThreshold: THRESHOLDS[4],      // $350
    description: "Dominate the darkness. Earn 1.6× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[4] * 40_000 * 1.6),
    usdtReturn: Math.round(THRESHOLDS[4] * 1.6 * 100) / 100,
    returnMultiplier: 1.6,
    pickaxeImage: "/images/pickaxe-4.png",
  },
  {
    level: 5,
    name: "Ice Breaker",
    unlockCost: incrementalCost(5),          // $50
    investmentThreshold: THRESHOLDS[5],      // $400
    description: "Shatter the limits. Earn 1.85× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[5] * 40_000 * 1.85),
    usdtReturn: Math.round(THRESHOLDS[5] * 1.85 * 100) / 100,
    returnMultiplier: 1.85,
    pickaxeImage: "/images/pickaxe-5.png",
  },
  {
    level: 6,
    name: "Gold Sovereign",
    unlockCost: incrementalCost(6),          // $50
    investmentThreshold: THRESHOLDS[6],      // $450
    description: "Command wealth. Earn 2.1× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[6] * 40_000 * 2.1),
    usdtReturn: Math.round(THRESHOLDS[6] * 2.1 * 100) / 100,
    returnMultiplier: 2.1,
    pickaxeImage: "/images/pickaxe-6.png",
  },
  {
    level: 7,
    name: "Rainbow Emperor",
    unlockCost: incrementalCost(7),          // $50
    investmentThreshold: THRESHOLDS[7],      // $500
    description: "Infinite power. Earn 2.5× your total investment annually.",
    gemsPerYear: Math.round(THRESHOLDS[7] * 40_000 * 2.5),
    usdtReturn: Math.round(THRESHOLDS[7] * 2.5 * 100) / 100,
    returnMultiplier: 2.5,
    pickaxeImage: "/images/pickaxe-7.png",
  },
];

// ─── Mining Rate Constants ────────────────────────────────────────────────────

export const FREE_USER_DAILY_GEMS = 285_714 / 365;
export const BASE_ANNUAL_GEMS_PER_USDT = 40_000;
export const BASE_DAILY_GEMS_PER_USDT  = BASE_ANNUAL_GEMS_PER_USDT / 365;

export const DAILY_GEMS_PER_USDT = BASE_DAILY_GEMS_PER_USDT;
export const PAID_MINING_PERIOD_DAYS = 365;

// ─── Session Durations ────────────────────────────────────────────────────────
// Free users: 3-hour session — must claim to restart mining
// Paid users (Level 1+): 24-hour session
export const FREE_USER_SESSION_HOURS = 3;
export const PAID_USER_SESSION_HOURS = 24;

export const LEVEL_MULTIPLIER = 28_571 * 2.5;
export const GEMS_PER_100_USDT = 10_000_000;
export const MINING_PERIOD_DAYS = 180;
export const DAILY_GEMS_PER_100_USDT = GEMS_PER_100_USDT / MINING_PERIOD_DAYS;

// ─── Conversion Constants ─────────────────────────────────────────────────────

export const GEMS_PER_ETR_NORMAL  = 100_000;
export const GEMS_PER_ETR_DYNAMIC = 200_000;
export const ETR_DYNAMIC_THRESHOLD = 1_000_000;

export const ETR_PRICE_USD        = 3.5;
export const USDT_PRICE_PER_ETR   = 2.5;
export const ETR_PER_USDT         = 100 / 350;
export const ETR_TOTAL_SUPPLY     = 21_000_000;
export const ETR_USER_ALLOCATION  = ETR_TOTAL_SUPPLY * 0.6;

// ─── Mining Calculations ──────────────────────────────────────────────────────

/**
 * Total mining power = sum of (incrementalUnlockCost + additionalInvestment) for each unlocked level.
 * This equals the user's total USDT invested.
 */
export function computeTotalMiningPower(
  unlockedLevels: Array<{ level: number; additionalInvestment: number }>
): number {
  return unlockedLevels.reduce((total, ul) => {
    const def = LEVEL_DEFINITIONS.find((d) => d.level === ul.level);
    const baseCost = def?.unlockCost ?? 0;
    return total + baseCost + ul.additionalInvestment;
  }, 0);
}

/**
 * Determine the highest level eligible based on total mining power.
 */
export function computeLevelFromPower(totalPower: number): number {
  let highestLevel = 0;
  for (const def of LEVEL_DEFINITIONS) {
    if (def.investmentThreshold !== null && totalPower >= def.investmentThreshold && def.level > highestLevel) {
      highestLevel = def.level;
    }
  }
  return highestLevel;
}

export function getLevelMultiplier(currentLevel: number): number {
  const def = LEVEL_DEFINITIONS.find((d) => d.level === currentLevel);
  return def?.returnMultiplier ?? 0;
}

export function getSessionDurationMs(currentLevel: number): number {
  return (currentLevel === 0 ? FREE_USER_SESSION_HOURS : PAID_USER_SESSION_HOURS) * 3_600_000;
}

export function calculatePendingGems(
  currentLevel: number,
  totalMiningPower: number,
  miningStartedAt: Date,
  lastClaimedAt: Date | null
): number {
  const now = new Date();
  const sessionStartedAt = lastClaimedAt ?? miningStartedAt;
  const sessionDurationMs = getSessionDurationMs(currentLevel);
  const sessionExpiresAt = new Date(sessionStartedAt.getTime() + sessionDurationMs);

  // Cap effective time to session expiry — mining stops if not claimed in time
  const effectiveNow = now < sessionExpiresAt ? now : sessionExpiresAt;
  const msElapsed = effectiveNow.getTime() - sessionStartedAt.getTime();
  const daysElapsed = msElapsed / 86_400_000;

  if (currentLevel === 0) {
    return daysElapsed * FREE_USER_DAILY_GEMS;
  }

  const totalDaysSinceStart =
    (now.getTime() - miningStartedAt.getTime()) / 86_400_000;
  const daysLeft = Math.max(0, PAID_MINING_PERIOD_DAYS - totalDaysSinceStart);
  const effectiveDays = Math.min(daysElapsed, daysLeft);

  const multiplier = getLevelMultiplier(currentLevel);
  return effectiveDays * totalMiningPower * BASE_DAILY_GEMS_PER_USDT * multiplier;
}

// ─── Conversion Helpers ───────────────────────────────────────────────────────

export function getConversionRate(totalEtrSwapped: number): number {
  return totalEtrSwapped >= ETR_DYNAMIC_THRESHOLD
    ? GEMS_PER_ETR_DYNAMIC
    : GEMS_PER_ETR_NORMAL;
}

export function gemsToEtr(gems: number, totalEtrSwapped: number): number {
  return gems / getConversionRate(totalEtrSwapped);
}

export function gemsToUsdt(gems: number, totalEtrSwapped: number): number {
  return gemsToEtr(gems, totalEtrSwapped) * USDT_PRICE_PER_ETR;
}

export function etrToUsdValue(etr: number): number {
  return etr * ETR_PRICE_USD;
}
