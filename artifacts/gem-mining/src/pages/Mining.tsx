import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGetMiningStatus, useClaimGems } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import { ChevronRight, TrendingUp, Gem } from "lucide-react";
import { useLocation } from "wouter";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ExtendedMiningStatus {
  isFreeUser: boolean;
  currentLevel: number;
  isActive: boolean;
  gemsBalance: number;
  pendingGems: number;
  totalMiningPower: number;
  totalDepositUsdt: number;
  dailyRate: number;
  miningStartedAt: string | null;
  lastClaimedAt: string | null;
  progressPercent: number | null;
  totalGemsTarget: number | null;
  daysRemaining: number | null;
  sessionDurationHours: number;
  sessionStartedAt: string;
  sessionExpiresAt: string;
  isMiningActive: boolean;
  timeRemainingMs: number;
}

const LEVEL_NAMES = [
  "Free Node", "Miner I", "Miner II", "Miner III",
  "Senior Miner", "Master Miner", "Elite Miner", "Sovereign",
];

// ─── Smooth real-time gem counter (50ms ticks = 20fps visual counting) ─────────
function useSmoothGems(
  pendingGems: number,
  dailyRate: number,
  isMiningActive: boolean,
  sessionExpiresAt: string,
) {
  const [live, setLive] = useState<number>(pendingGems);
  const baseRef  = useRef<number>(pendingGems);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    baseRef.current  = pendingGems;
    startRef.current = Date.now();
    setLive(pendingGems);
  }, [pendingGems]);

  useEffect(() => {
    if (!isMiningActive || dailyRate <= 0) return;
    const perMs  = dailyRate / 86_400_000;
    const expiry = new Date(sessionExpiresAt).getTime();
    const id = setInterval(() => {
      const now     = Date.now();
      const elapsed = Math.min(now, expiry) - startRef.current;
      if (elapsed <= 0) return;
      setLive(baseRef.current + elapsed * perMs);
    }, 50);
    return () => clearInterval(id);
  }, [isMiningActive, dailyRate, sessionExpiresAt]);

  return Math.floor(live);
}

// ─── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(sessionExpiresAt: string, isMiningActive: boolean) {
  const [ms, setMs] = useState(() =>
    Math.max(0, new Date(sessionExpiresAt).getTime() - Date.now()),
  );
  useEffect(() => {
    if (!isMiningActive) { setMs(0); return; }
    const expiry = new Date(sessionExpiresAt).getTime();
    const id = setInterval(() => setMs(Math.max(0, expiry - Date.now())), 500);
    return () => clearInterval(id);
  }, [sessionExpiresAt, isMiningActive]);
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms % 3_600_000) / 60_000);
  const s  = Math.floor((ms % 60_000) / 1_000);
  return { h, m, s, ms };
}

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Mining Animation Scene ────────────────────────────────────────────────────
// Active → animated GIF plays (pickaxe strikes, gems fly)
// Idle   → frozen first-frame PNG, pickaxe at rest, subtle dark overlay
function MiningScene({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center select-none overflow-hidden"
      style={{ width: "100%", maxWidth: 360, margin: "0 auto", borderRadius: 14 }}
    >
      {/* ── Ambient orange glow — blooms behind scene when mining ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={active ? { opacity: [0.45, 0.80, 0.45] } : { opacity: 0 }}
        transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        style={{
          borderRadius: 14,
          background:
            "radial-gradient(ellipse 75% 50% at 50% 65%, rgba(249,115,22,0.28) 0%, transparent 80%)",
          zIndex: 1,
        }}
      />

      {/* ── Active: animated GIF plays from frame 0 on each activation ── */}
      {active && (
        <motion.img
          key="gif-active"
          src="/images/mining-animation.gif"
          alt="Mining active"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 14,
            position: "relative",
            zIndex: 0,
          }}
        />
      )}

      {/* ── Idle: frozen first-frame PNG, pickaxe at rest ── */}
      {!active && (
        <motion.div
          key="gif-idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          style={{ width: "100%", position: "relative", zIndex: 0 }}
        >
          <img
            src="/images/mining-idle.png"
            alt="Mining idle"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              borderRadius: 14,
              filter: "brightness(0.62) saturate(0.7)",
            }}
          />
          {/* Idle overlay badge */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{ paddingBottom: 14, borderRadius: 14, zIndex: 2 }}
          >
            <span
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                background: "rgba(8,9,14,0.80)",
                border: "1px solid rgba(249,115,22,0.15)",
                borderRadius: 999,
                color: "rgba(249,115,22,0.55)",
                backdropFilter: "blur(8px)",
              }}
            >
              ⏸ Mining Paused
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Strike ring — orange pulse border synced with pickaxe beat ── */}
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.22, 0] }}
          transition={{ repeat: Infinity, duration: 1.05, ease: "easeOut", repeatDelay: 0.08 }}
          style={{
            borderRadius: 14,
            boxShadow: "0 0 0 2.5px rgba(249,115,22,0.7) inset",
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
}

// ─── Stat cell (used in 2-col grid inside unified card) ────────────────────────
function StatCell({
  label, value, sub,
}: {
  label: string; value: string; sub?: string;
}) {
  return (
    <div className="p-4 flex flex-col gap-1">
      <span className="text-[9px] text-white/30 uppercase tracking-[0.16em] font-semibold">
        {label}
      </span>
      <span className="text-xl font-black font-mono tabular-nums text-white leading-tight">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-white/25">{sub}</span>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Mining() {
  const queryClient                   = useQueryClient();
  const [, setLocation]               = useLocation();
  const { data, isLoading }           = useGetMiningStatus();
  const { mutate: claim, isPending }  = useClaimGems();
  const [claimFlash, setClaimFlash]   = useState(false);

  const status           = data as unknown as ExtendedMiningStatus | undefined;
  const isFreeUser       = status?.isFreeUser ?? true;
  const currentLevel     = status?.currentLevel ?? 0;
  const dailyRate        = status?.dailyRate ?? 0;
  const isMiningActive   = status?.isMiningActive ?? false;
  const sessionExpiresAt = status?.sessionExpiresAt ?? new Date(Date.now() + 1000).toISOString();
  const sessionDurationH = status?.sessionDurationHours ?? (isFreeUser ? 3 : 24);
  const totalSessionMs   = sessionDurationH * 3_600_000;

  const liveGems = useSmoothGems(
    status?.pendingGems ?? 0, dailyRate, isMiningActive, sessionExpiresAt,
  );
  const { h, m, s, ms: remainingMs } = useCountdown(sessionExpiresAt, isMiningActive);

  const perSecond   = dailyRate / 86_400;
  const hasPending  = liveGems > 0;
  const stoppedAndEmpty = !isMiningActive && liveGems <= 0;
  const progressPct = totalSessionMs > 0
    ? Math.max(0, Math.min(100, (1 - remainingMs / totalSessionMs) * 100))
    : 0;

  const handleClaim = useCallback(() => {
    if (!status?.pendingGems && liveGems <= 0) {
      toast.error("No gems to claim yet.");
      return;
    }
    claim(undefined, {
      onSuccess: (res: any) => {
        setClaimFlash(true);
        setTimeout(() => setClaimFlash(false), 600);
        toast.success(`Claimed ${formatGems(res.claimedGems)} gems — mining restarted`);
        queryClient.invalidateQueries();
      },
      onError: (err: any) => toast.error(err.error || "Claim failed"),
    });
  }, [status, liveGems, claim, queryClient]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "2px solid rgba(249,115,22,0.15)", borderTopColor: "#f97316" }}
        />
      </div>
    );
  }

  if (!status) return null;

  // End-time formatted
  const endTimeStr = isMiningActive
    ? new Date(sessionExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 md:pb-8 space-y-3">

      {/* ── Page title row ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-0.5">
        <h1 className="text-xs text-white/35 uppercase tracking-widest font-semibold">Mining</h1>
        <div className="flex items-center gap-2">
          <motion.div
            animate={isMiningActive
              ? { opacity: [1, 0.25, 1] }
              : { opacity: 0.3 }
            }
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isMiningActive ? "#f97316" : "rgba(255,255,255,0.15)",
              boxShadow: isMiningActive ? "0 0 6px rgba(249,115,22,0.8)" : "none",
            }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: isMiningActive ? "#f97316" : "rgba(255,255,255,0.3)" }}
          >
            {isMiningActive ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN UNIFIED DASHBOARD CARD
        ════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(155deg, #0a0b10 0%, #101218 65%, #0c0e14 100%)",
          border: `1px solid ${isMiningActive ? "rgba(249,115,22,0.22)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: isMiningActive ? "0 0 48px rgba(249,115,22,0.07)" : "none",
          transition: "border-color 0.5s, box-shadow 0.5s",
        }}
      >
        {/* Decorative ambient blob — top-right */}
        {isMiningActive && (
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(249,115,22,0.12)", opacity: 0.8 }}
          />
        )}

        {/* ── Section 1: Status + Level ──────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{
                background: isMiningActive ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isMiningActive ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.08)"}`,
                color: isMiningActive ? "#f97316" : "rgba(255,255,255,0.3)",
              }}
            >
              {isMiningActive ? "⛏ Mining" : "⏸ Paused"}
            </div>
          </div>
          <div
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {isFreeUser ? "Free Node" : LEVEL_NAMES[currentLevel]}
            {!isFreeUser && ` · Lv ${currentLevel}`}
          </div>
        </div>

        {/* ── Section 2: Mining animation ────────────────────────────────── */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <MiningScene active={isMiningActive} />
        </div>

        {/* ── Section 3: Live gem counter ────────────────────────────────── */}
        <div
          className="px-5 pt-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-semibold mb-2">
            Gems mined this session
          </p>
          <motion.p
            animate={claimFlash ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 0.22 }}
            className="text-[2.75rem] font-black font-mono tabular-nums text-white leading-none tracking-tight"
          >
            {formatGems(liveGems)}
          </motion.p>
          <div className="flex items-center gap-3 mt-2">
            {isMiningActive && perSecond > 0 ? (
              <span className="text-xs font-mono text-white/30">
                +{perSecond < 1
                  ? perSecond.toFixed(2)
                  : formatGems(Math.round(perSecond))
                } <span className="text-white/15">gems/sec</span>
              </span>
            ) : (
              <span className="text-xs text-white/20">
                {hasPending ? "Session ended — claim to restart" : "No gems yet"}
              </span>
            )}
          </div>
        </div>

        {/* ── Section 4: Session progress + timer ───────────────────────── */}
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] uppercase tracking-[0.16em] text-white/25 font-semibold">
              Session
            </span>
            <div className="flex items-center gap-2.5">
              <span
                className="text-sm font-black font-mono tabular-nums"
                style={{ color: isMiningActive ? "#f97316" : "rgba(255,255,255,0.2)" }}
              >
                {pad(h)}:{pad(m)}:{pad(s)}
              </span>
              {endTimeStr && (
                <span className="text-[9px] text-white/20 font-mono">
                  ends {endTimeStr}
                </span>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 3, background: "rgba(255,255,255,0.05)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.6) 0%, #f97316 100%)" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-white/15 font-mono">0%</span>
            <span className="text-[9px] font-mono" style={{ color: "rgba(249,115,22,0.45)" }}>
              {progressPct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* ── Section 5: Stats 2×1 grid ──────────────────────────────────── */}
        <div className="grid grid-cols-2">
          <StatCell
            label="Total Balance"
            value={formatGems(status.gemsBalance)}
            sub="gems"
          />
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
            <StatCell
              label="Mining Rate"
              value={formatGems(dailyRate)}
              sub="gems / day"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Claim button — compact, centered ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex justify-center pt-1"
      >
        <motion.button
          onClick={handleClaim}
          disabled={isPending || stoppedAndEmpty}
          whileTap={{ scale: 0.97 }}
          animate={claimFlash ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={
            !stoppedAndEmpty
              ? {
                  background: "#f97316",
                  boxShadow: "0 4px 18px rgba(249,115,22,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
                  color: "#fff",
                }
              : {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.2)",
                }
          }
        >
          {isPending ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.25)",
                  borderTopColor: "#fff",
                }}
              />
              Processing
            </>
          ) : !isMiningActive && hasPending ? (
            <>
              <Gem size={14} />
              Claim &amp; Restart
            </>
          ) : hasPending ? (
            <>
              <Gem size={14} />
              Claim {formatGems(liveGems)} Gems
            </>
          ) : (
            <>
              <Gem size={14} />
              Mining in Progress
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ── Upgrade / level card ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isFreeUser ? (
          <button
            onClick={() => setLocation("/levels")}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-white/[0.025] transition-colors text-left"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(249,115,22,0.1)",
                  border: "1px solid rgba(249,115,22,0.18)",
                }}
              >
                <TrendingUp size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Upgrade Mining Power</p>
                <p className="text-[11px] text-white/35 mt-0.5">
                  Invest USDT · earn more gems daily
                </p>
              </div>
            </div>
            <ChevronRight size={15} className="text-white/20 shrink-0" />
          </button>
        ) : (
          <div
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.15)",
                }}
              >
                <Gem size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{LEVEL_NAMES[currentLevel]}</p>
                <p className="text-[11px] text-white/35 mt-0.5">
                  ${status.totalDepositUsdt?.toLocaleString() ?? 0} USDT · Level {currentLevel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/levels")}
              className="text-[11px] font-bold hover:opacity-70 transition-opacity"
              style={{ color: "#f97316" }}
            >
              Boost →
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
}
