import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGetMiningStatus, useClaimGems } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import { ChevronRight, TrendingUp, Zap, Clock, BarChart3, Pickaxe } from "lucide-react";
import { useLocation } from "wouter";
import { GemIcon } from "@/components/GemIcon";

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

// ─── Smooth real-time gem counter ──────────────────────────────────────────────
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
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return { h, m, s, ms };
}

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Floating Gems Scene ───────────────────────────────────────────────────────
const GEM_CONFIG = [
  { size: 44, x: "12%",  y: "18%", delay: 0,    dur: 3.8 },
  { size: 28, x: "32%",  y: "8%",  delay: 0.6,  dur: 4.2 },
  { size: 56, x: "52%",  y: "22%", delay: 1.1,  dur: 3.5 },
  { size: 22, x: "72%",  y: "10%", delay: 0.3,  dur: 4.6 },
  { size: 36, x: "88%",  y: "30%", delay: 1.7,  dur: 3.2 },
  { size: 18, x: "6%",   y: "58%", delay: 0.9,  dur: 5.0 },
  { size: 48, x: "26%",  y: "65%", delay: 1.4,  dur: 3.7 },
  { size: 24, x: "60%",  y: "70%", delay: 0.2,  dur: 4.4 },
  { size: 32, x: "80%",  y: "60%", delay: 2.0,  dur: 3.9 },
  { size: 20, x: "44%",  y: "48%", delay: 0.7,  dur: 4.8 },
  { size: 40, x: "16%",  y: "40%", delay: 1.8,  dur: 3.3 },
  { size: 16, x: "92%",  y: "75%", delay: 1.2,  dur: 5.2 },
];

function FloatingGems({ active }: { active: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: 160, borderRadius: 12 }}
    >
      {/* Dark background with subtle glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #0a0b12 0%, #0f1020 100%)",
          borderRadius: 12,
        }}
      />

      {/* Active glow bloom */}
      {active && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
          style={{
            borderRadius: 12,
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.18) 0%, transparent 80%)",
          }}
        />
      )}

      {/* Floating gems */}
      {GEM_CONFIG.map((g, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: g.x, top: g.y }}
          animate={
            active
              ? {
                  y: [0, -10, 0],
                  rotate: [0, i % 2 === 0 ? 8 : -8, 0],
                  opacity: [0.6, 1, 0.6],
                }
              : { opacity: 0.18, y: 0, rotate: 0 }
          }
          transition={
            active
              ? {
                  repeat: Infinity,
                  duration: g.dur,
                  delay: g.delay,
                  ease: "easeInOut",
                }
              : { duration: 0.5 }
          }
        >
          <GemIcon size={g.size} />
        </motion.div>
      ))}

      {/* Paused overlay */}
      {!active && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(6,7,14,0.55)", borderRadius: 12 }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(249,115,22,0.45)" }}
          >
            ⏸ Mining Paused
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Circular Session Ring ─────────────────────────────────────────────────────
function SessionRing({
  pct, h, m, s, active, endTimeStr,
}: {
  pct: number; h: number; m: number; s: number; active: boolean; endTimeStr: string | null;
}) {
  const R = 54, C = 2 * Math.PI * R;
  const filled = C * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative" style={{ width: 136, height: 136 }}>
        <svg width="136" height="136" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="68" cy="68" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="68" cy="68" r={R}
            fill="none"
            stroke="url(#ring-grad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            animate={{ strokeDashoffset: C - filled }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span
            className="text-lg font-black font-mono tabular-nums leading-none tracking-tight"
            style={{ color: active ? "#f97316" : "rgba(255,255,255,0.25)" }}
          >
            {pad(h)}:{pad(m)}:{pad(s)}
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-semibold">
            {active ? "remaining" : "ended"}
          </span>
        </div>
      </div>
      {endTimeStr && (
        <span className="text-[10px] text-white/20 font-mono">ends {endTimeStr}</span>
      )}
    </div>
  );
}

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex-1 flex flex-col gap-2 rounded-2xl px-4 py-4"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)"
          : "rgba(255,255,255,0.025)",
        border: accent ? "1px solid rgba(249,115,22,0.2)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{
          background: accent ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
          border: accent ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ color: accent ? "#f97316" : "rgba(255,255,255,0.3)" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-semibold">{label}</p>
        <p className="text-base font-black font-mono tabular-nums text-white leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
      </div>
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

  const perSecond  = dailyRate / 86_400;
  const hasPending = liveGems > 0;
  const stoppedAndEmpty = !isMiningActive && liveGems <= 0;
  const progressPct = totalSessionMs > 0
    ? Math.max(0, Math.min(100, (1 - remainingMs / totalSessionMs) * 100))
    : 0;

  const endTimeStr = isMiningActive
    ? new Date(sessionExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full"
            style={{ border: "2px solid rgba(249,115,22,0.15)", borderTopColor: "#f97316" }}
          />
          <p className="text-[11px] uppercase tracking-widest text-white/20 font-semibold">
            Loading Mining Data
          </p>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 md:pb-8 space-y-3">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-0.5 mb-1">
        <div className="flex items-center gap-2.5">
          <Pickaxe size={13} className="text-white/25" />
          <h1 className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-semibold">
            Mining Station
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={isMiningActive ? { opacity: [1, 0.2, 1] } : { opacity: 0.3 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isMiningActive ? "#f97316" : "rgba(255,255,255,0.15)",
              boxShadow: isMiningActive ? "0 0 8px rgba(249,115,22,0.9)" : "none",
            }}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-wide"
            style={{ color: isMiningActive ? "#f97316" : "rgba(255,255,255,0.22)" }}
          >
            {isMiningActive ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          HERO CARD
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: `1px solid ${isMiningActive ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: isMiningActive
            ? "0 0 60px rgba(249,115,22,0.08), 0 20px 40px rgba(0,0,0,0.4)"
            : "0 20px 40px rgba(0,0,0,0.35)",
          transition: "border-color 0.5s, box-shadow 0.5s",
        }}
      >
        {/* Ambient blobs */}
        {isMiningActive && (
          <>
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(249,115,22,0.09)" }} />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(124,58,237,0.08)" }} />
          </>
        )}

        {/* ── Status + Level row ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={{
              background: isMiningActive ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isMiningActive ? "rgba(249,115,22,0.22)" : "rgba(255,255,255,0.07)"}`,
              color: isMiningActive ? "#f97316" : "rgba(255,255,255,0.28)",
            }}
          >
            {isMiningActive ? <><Zap size={10} /> Mining</> : "⏸ Paused"}
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <GemIcon size={11} />
            {isFreeUser ? "Free Node" : LEVEL_NAMES[currentLevel]}
            {!isFreeUser && ` · Lv ${currentLevel}`}
          </div>
        </div>

        {/* ── Floating gems scene ─────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <FloatingGems active={isMiningActive} />
        </div>

        {/* ── Live gem counter + session ring ─────────────────────────────── */}
        <div
          className="flex items-center gap-4 px-5 pt-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/22 font-semibold mb-2">
              Session Gems
            </p>
            <motion.p
              animate={claimFlash ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.24 }}
              className="text-[2.6rem] font-black font-mono tabular-nums leading-none tracking-tight"
              style={{
                background: isMiningActive
                  ? "linear-gradient(135deg, #fff 40%, rgba(249,115,22,0.7) 100%)"
                  : "rgba(255,255,255,0.25)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formatGems(liveGems)}
            </motion.p>
            <div className="mt-2 flex items-center gap-2">
              {isMiningActive && perSecond > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#f97316", boxShadow: "0 0 5px rgba(249,115,22,0.8)" }} />
                  <span className="text-[11px] font-mono text-white/30">
                    +{perSecond < 1 ? perSecond.toFixed(2) : formatGems(Math.round(perSecond))}
                    <span className="text-white/15"> gems/sec</span>
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-white/18">
                  {hasPending ? "Session ended — claim to restart" : "Deposit USDT to start mining"}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <SessionRing
              pct={progressPct}
              h={h} m={m} s={s}
              active={isMiningActive}
              endTimeStr={endTimeStr}
            />
          </div>
        </div>

        {/* ── Stats 2-col grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 px-4 py-4 gap-3">
          <StatPill
            icon={<GemIcon size={14} />}
            label="Total Balance"
            value={formatGems(status.gemsBalance)}
            sub="gems"
            accent
          />
          <StatPill
            icon={<BarChart3 size={14} />}
            label="Mining Rate"
            value={formatGems(dailyRate)}
            sub="gems / day"
          />
        </div>

        {/* ── Progress strip ───────────────────────────────────────────────── */}
        <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2 pt-4">
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/20 font-semibold flex items-center gap-1.5">
              <Clock size={9} /> Session Progress
            </span>
            <span
              className="text-[10px] font-bold font-mono"
              style={{ color: isMiningActive ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.15)" }}
            >
              {progressPct.toFixed(0)}%
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 999 }}>
            <motion.div
              className="h-full"
              style={{
                background: isMiningActive
                  ? "linear-gradient(90deg, rgba(249,115,22,0.6) 0%, #f97316 60%, #fb923c 100%)"
                  : "rgba(255,255,255,0.08)",
                borderRadius: 999,
                boxShadow: isMiningActive ? "0 0 8px rgba(249,115,22,0.5)" : "none",
              }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Claim Button ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <motion.button
          onClick={handleClaim}
          disabled={isPending || stoppedAndEmpty}
          whileTap={{ scale: 0.98 }}
          animate={claimFlash ? { scale: [1, 1.04, 1] } : {}}
          transition={{ duration: 0.22 }}
          className="w-full relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] tracking-wide overflow-hidden transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={
            !stoppedAndEmpty
              ? {
                  background: "linear-gradient(135deg, #ea6c10 0%, #f97316 50%, #fb923c 100%)",
                  boxShadow: "0 6px 24px rgba(249,115,22,0.4), 0 1px 0 rgba(255,255,255,0.2) inset",
                  color: "#fff",
                }
              : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.18)",
                }
          }
        >
          {!stoppedAndEmpty && !isPending && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 2 }}
              style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                width: "50%",
              }}
            />
          )}
          {isPending ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
              />
              Processing…
            </>
          ) : !isMiningActive && hasPending ? (
            <><GemIcon size={16} /> Claim &amp; Restart Mining</>
          ) : hasPending ? (
            <><GemIcon size={16} /> Claim {formatGems(liveGems)} Gems</>
          ) : (
            <><Pickaxe size={16} /> Mining in Progress</>
          )}
        </motion.button>
      </motion.div>

      {/* ── Extra Stats ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatPill icon={<TrendingUp size={14} />} label="Total Deposited"
          value={`$${(status.totalDepositUsdt ?? 0).toLocaleString()}`} sub="USDT" />
        <StatPill icon={<Clock size={14} />} label="Days Remaining"
          value={status.daysRemaining != null ? String(status.daysRemaining) : "—"}
          sub="of 180-day cycle" />
      </motion.div>

      {/* ── Upgrade / Level Card ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        {isFreeUser ? (
          <button
            onClick={() => setLocation("/levels")}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-white/[0.03] transition-colors text-left group"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <TrendingUp size={16} style={{ color: "#f97316" }} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Upgrade Mining Power</p>
                <p className="text-[11px] text-white/30 mt-0.5">Invest USDT to unlock faster gem rates</p>
              </div>
            </div>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg group-hover:translate-x-0.5 transition-transform"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <ChevronRight size={14} style={{ color: "rgba(249,115,22,0.6)" }} />
            </div>
          </button>
        ) : (
          <div className="w-full flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)", border: "1px solid rgba(249,115,22,0.18)" }}>
                <GemIcon size={18} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{LEVEL_NAMES[currentLevel]}</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  ${(status.totalDepositUsdt ?? 0).toLocaleString()} USDT · Level {currentLevel}
                </p>
              </div>
            </div>
            <button onClick={() => setLocation("/levels")}
              className="flex items-center gap-1 text-[12px] font-bold hover:opacity-70 transition-opacity"
              style={{ color: "#f97316" }}>
              Boost <ChevronRight size={12} />
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
}
