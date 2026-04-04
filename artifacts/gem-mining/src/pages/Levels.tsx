import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  useGetLevels,
  useInvestInLevel,
} from "@workspace/api-client-react";
import { Zap, X, ChevronUp, Gem, TrendingUp, Pickaxe } from "lucide-react";

// ── Constants (mirror server mining.ts) ──────────────────────────────────────
const BASE_ANNUAL_GEMS_PER_USDT = 40_000;
const BASE_DAILY_GEMS_PER_USDT  = BASE_ANNUAL_GEMS_PER_USDT / 365;
const FREE_DAILY_GEMS = 285_714 / 365;

// Cumulative investment thresholds per level
const LEVEL_THRESHOLDS = [0, 100, 250, 300, 350, 400, 450, 500];
const LEVEL_MULTIPLIERS = [0, 1.0, 1.2, 1.4, 1.6, 1.85, 2.1, 2.5];
const LEVEL_NAMES = [
  "Shadow Initiate", "Fire Starter", "Nature Walker", "Storm Chaser",
  "Shadow Raider", "Ice Breaker", "Gold Sovereign", "Rainbow Emperor",
];

// Per-level accent colours (used sparingly)
const LEVEL_ACCENTS = [
  "#94a3b8","#f97316","#22c55e","#38bdf8","#a855f7","#67e8f9","#fbbf24","#f43f5e",
];

function levelFromPower(power: number): number {
  let lvl = 0;
  for (let i = 1; i <= 7; i++) {
    if (power >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
}

function dailyGems(totalPower: number, level: number): number {
  if (level === 0) return FREE_DAILY_GEMS;
  return totalPower * BASE_DAILY_GEMS_PER_USDT * LEVEL_MULTIPLIERS[level];
}

function fmtGems(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function fmtUSDT(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

// ── Invest Modal ──────────────────────────────────────────────────────────────
function InvestModal({
  open, onClose, usdtBalance, currentTotalPower, currentLevel, prefillAmount,
}: {
  open: boolean; onClose: () => void;
  usdtBalance: number; currentTotalPower: number; currentLevel: number; prefillAmount?: string;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(prefillAmount ?? "");
  const { mutate: investInLevel, isPending } = useInvestInLevel();

  React.useEffect(() => {
    if (open) setAmount(prefillAmount ?? "");
  }, [open, prefillAmount]);

  const numAmount = Number(amount) || 0;
  const newTotal  = currentTotalPower + numAmount;
  const newLevel  = levelFromPower(newTotal);
  const newDaily  = dailyGems(newTotal, newLevel);
  const levelUp   = newLevel > currentLevel;
  const accent    = LEVEL_ACCENTS[newLevel] ?? LEVEL_ACCENTS[0];

  const handleInvest = () => {
    if (!numAmount || numAmount <= 0) { toast.error("Enter a valid USDT amount"); return; }
    if (currentLevel === 0 && numAmount < 100) { toast.error("Minimum $100 USDT to start mining"); return; }
    if (numAmount > usdtBalance) { toast.error("Insufficient USDT balance"); return; }
    investInLevel({ additionalUsdt: numAmount }, {
      onSuccess: (res: { message: string }) => {
        toast.success(res.message);
        setAmount(""); onClose();
        queryClient.invalidateQueries();
      },
      onError: (err: any) => toast.error(err?.data?.error || "Failed to invest"),
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="fixed z-50 inset-x-4 bottom-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm"
          >
            <div className="rounded-2xl p-6 shadow-2xl"
              style={{ background: "#0b0c12", border: `1px solid ${accent}30` }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-white text-base">Invest USDT</h3>
                  <p className="text-xs text-white/35 mt-0.5">
                    Balance: <span className="text-white/60 font-semibold">{fmtUSDT(usdtBalance)}</span>
                  </p>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                  <X size={14} className="text-white/60" />
                </button>
              </div>

              {/* Input */}
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold">$</span>
                <input
                  type="number" min="1" placeholder="0"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-white text-lg font-bold placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs">USDT</span>
              </div>

              {/* Live preview */}
              {numAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl p-4 space-y-2.5"
                  style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}
                >
                  {levelUp && (
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <ChevronUp size={13} style={{ color: accent }} />
                      <span className="text-xs font-bold" style={{ color: accent }}>
                        Unlocks Level {newLevel} — {LEVEL_NAMES[newLevel]}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 flex items-center gap-1.5">
                      <Gem size={11} className="text-primary" /> Gems / day
                    </span>
                    <span className="text-sm font-black text-white">{fmtGems(newDaily)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40 flex items-center gap-1.5">
                      <Gem size={11} className="text-primary" /> Gems / year
                    </span>
                    <span className="text-sm font-black" style={{ color: accent }}>{fmtGems(newDaily * 365)}</span>
                  </div>
                </motion.div>
              )}

              <button onClick={handleInvest} disabled={isPending}
                className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}80)` }}
              >
                {isPending
                  ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />Processing...</>
                  : <><Zap size={15} />Invest Now</>
                }
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Levels() {
  const { data, isLoading } = useGetLevels();
  const [calcInput, setCalcInput] = useState("");
  const [showInvest, setShowInvest] = useState(false);

  // All derived values — must be computed unconditionally (rules of hooks)
  const currentLevel      = data?.currentLevel ?? 0;
  const totalMiningPower  = data?.totalMiningPower ?? 0;
  const currentDailyGems  = data?.dailyGems ?? 0;
  const usdtBalance       = data?.usdtBalance ?? 0;
  const isFree            = currentLevel === 0;
  const accent            = LEVEL_ACCENTS[currentLevel] ?? LEVEL_ACCENTS[0];

  const calcUsdt    = Number(calcInput) || 0;
  const calcTotal   = totalMiningPower + calcUsdt;
  const calcLevel   = levelFromPower(calcTotal);
  const calcDaily   = calcUsdt > 0 ? dailyGems(calcTotal, calcLevel) : currentDailyGems;
  const calcAccent  = LEVEL_ACCENTS[calcLevel] ?? LEVEL_ACCENTS[0];
  const willLevelUp = calcUsdt > 0 && calcLevel > currentLevel;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-white/40">Loading...</p>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28 md:pb-8 space-y-5">

      {/* ── Current status ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0d0d12, #12121e)",
          border: `1px solid ${accent}35`,
          boxShadow: `0 0 40px ${accent}18`,
        }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: accent }} />

        {/* Pickaxe level indicators */}
        <div className="relative z-10 flex items-center gap-1.5 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Pickaxe
              key={i}
              size={14}
              style={{
                color: i < currentLevel ? accent : "rgba(255,255,255,0.12)",
                filter: i < currentLevel ? `drop-shadow(0 0 4px ${accent}80)` : "none",
              }}
            />
          ))}
          <span className="text-[10px] text-white/25 ml-1">Lv {currentLevel}/7</span>
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Your Mining Level</p>
            <h2 className="text-xl font-black text-white leading-tight">{LEVEL_NAMES[currentLevel]}</h2>
            <p className="text-sm font-bold mt-1" style={{ color: accent }}>Level {currentLevel}</p>
          </div>
          {!isFree && (
            <button
              onClick={() => setShowInvest(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:brightness-110"
              style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
            >
              <Zap size={11} /> Boost
            </button>
          )}
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-black/25 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gem size={10} className="text-primary" />
              <span className="text-[9px] text-white/35 uppercase tracking-wider">Daily Gems</span>
            </div>
            <p className="font-black text-white text-lg leading-none">{fmtGems(currentDailyGems)}</p>
          </div>
          <div className="bg-black/25 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gem size={10} className="text-primary" />
              <span className="text-[9px] text-white/35 uppercase tracking-wider">Yearly Gems</span>
            </div>
            <p className="font-black text-lg leading-none" style={{ color: accent }}>
              {fmtGems(currentDailyGems * 365)}
            </p>
          </div>
        </div>

        {!isFree && (
          <div className="relative z-10 mt-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 6px #4ade80" }} />
            <span className="text-[10px] text-white/35">Mining power: <span className="text-white/60 font-bold">${totalMiningPower.toLocaleString()} USDT</span></span>
          </div>
        )}
      </motion.div>

      {/* ── Gem Calculator ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0e0f16", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <h3 className="font-bold text-white text-sm">Gem Calculator</h3>
          <p className="text-[11px] text-white/30 mt-0.5">
            Enter a USDT amount to see how many gems you'd earn
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* USDT input */}
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-widest block mb-2">
              USDT Investment
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-bold pointer-events-none">$</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={calcInput}
                onChange={e => setCalcInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-16 py-4 text-white text-2xl font-black placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold pointer-events-none">USDT</span>
            </div>
          </div>

          {/* Live gem preview */}
          <AnimatePresence mode="wait">
            {calcUsdt > 0 ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${calcAccent}30` }}
              >
                {/* Level unlock banner */}
                {willLevelUp && (
                  <div className="px-4 py-2.5 flex items-center gap-2"
                    style={{ background: `${calcAccent}18` }}>
                    <ChevronUp size={13} style={{ color: calcAccent }} />
                    <span className="text-xs font-bold" style={{ color: calcAccent }}>
                      Unlocks Level {calcLevel} — {LEVEL_NAMES[calcLevel]}
                    </span>
                  </div>
                )}
                {!willLevelUp && (
                  <div className="px-4 py-2.5 flex items-center gap-2 bg-white/3">
                    <span className="text-xs text-white/40">
                      Stays at Level {calcLevel} — {LEVEL_NAMES[calcLevel]}
                    </span>
                  </div>
                )}

                {/* Gem rows */}
                <div className="p-4 space-y-3 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gem size={12} className="text-primary" />
                      </div>
                      <span className="text-sm text-white/60">Per day</span>
                    </div>
                    <span className="text-lg font-black text-white">{fmtGems(calcDaily)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gem size={12} className="text-primary" />
                      </div>
                      <span className="text-sm text-white/60">Per week</span>
                    </div>
                    <span className="text-lg font-black text-white">{fmtGems(calcDaily * 7)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gem size={12} className="text-primary" />
                      </div>
                      <span className="text-sm text-white/60">Per year</span>
                    </div>
                    <span className="text-xl font-black" style={{ color: calcAccent }}>{fmtGems(calcDaily * 365)}</span>
                  </div>

                  <div className="pt-2">
                    <div className="h-px bg-white/5 mb-3" />
                    <div className="flex items-center justify-between text-[10px] text-white/25 mb-2">
                      <span>Multiplier: {LEVEL_MULTIPLIERS[calcLevel]}×</span>
                      <span>Total power: ${calcTotal.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => setShowInvest(true)}
                      className="w-full h-11 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                      style={{ background: `linear-gradient(135deg, ${calcAccent}, ${calcAccent}80)` }}
                    >
                      <Zap size={14} /> Activate {fmtUSDT(calcUsdt)}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-white/[0.02] border border-white/5 p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Gem size={18} className="text-primary" />
                </div>
                <p className="text-sm text-white/40">Type a USDT amount above to see your gem projection</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Invest Modal ──────────────────────────────────────────────── */}
      <InvestModal
        open={showInvest}
        onClose={() => setShowInvest(false)}
        usdtBalance={usdtBalance}
        currentTotalPower={totalMiningPower}
        currentLevel={currentLevel}
        prefillAmount={calcInput}
      />
    </div>
  );
}
