import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { notify } from "@/lib/notify";
import { useGetMiningStatus, useClaimGems, useStartMining } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import { ChevronRight, TrendingUp, Clock, BarChart3, Pickaxe, Sparkles } from "lucide-react";
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

// ─── Generic ms-until countdown ────────────────────────────────────────────────
function useMsUntil(targetIso: string | null) {
  const [ms, setMs] = useState(() =>
    targetIso ? Math.max(0, new Date(targetIso).getTime() - Date.now()) : 0,
  );
  useEffect(() => {
    if (!targetIso) { setMs(0); return; }
    const target = new Date(targetIso).getTime();
    const id = setInterval(() => setMs(Math.max(0, target - Date.now())), 500);
    return () => clearInterval(id);
  }, [targetIso]);
  return ms;
}

// ─── Session expiry countdown ───────────────────────────────────────────────────
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

// ─── Gem Particle System ───────────────────────────────────────────────────────
interface GemParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  floatY: number;
  dur: number;
  lifetime: number;
  wobble: number;
}

let _pid = 0;

function mkParticle(): GemParticle {
  const size = 14 + Math.floor(Math.random() * 36);
  return {
    id: ++_pid,
    x:  4  + Math.random() * 84,
    y:  8  + Math.random() * 60,
    size,
    floatY:  -(24 + Math.random() * 44),
    dur:      2.2 + Math.random() * 2.2,
    lifetime: 2800 + Math.random() * 2200,
    wobble:   (Math.random() - 0.5) * 20,
  };
}

const IDLE_GEMS = [
  { x: 3,  y: 5,  size: 11 }, { x: 14, y: 2,  size: 9  }, { x: 24, y: 8,  size: 13 },
  { x: 35, y: 3,  size: 10 }, { x: 47, y: 7,  size: 12 }, { x: 58, y: 2,  size: 9  },
  { x: 68, y: 6,  size: 11 }, { x: 79, y: 3,  size: 10 }, { x: 89, y: 8,  size: 13 },
  { x: 5,  y: 22, size: 12 }, { x: 18, y: 18, size: 10 }, { x: 30, y: 25, size: 9  },
  { x: 42, y: 20, size: 13 }, { x: 53, y: 24, size: 11 }, { x: 64, y: 19, size: 10 },
  { x: 75, y: 26, size: 12 }, { x: 85, y: 21, size: 9  }, { x: 92, y: 18, size: 11 },
  { x: 2,  y: 42, size: 10 }, { x: 12, y: 38, size: 12 }, { x: 23, y: 45, size: 9  },
  { x: 36, y: 40, size: 11 }, { x: 48, y: 44, size: 13 }, { x: 60, y: 38, size: 10 },
  { x: 71, y: 43, size: 12 }, { x: 82, y: 39, size: 9  }, { x: 91, y: 45, size: 11 },
  { x: 7,  y: 60, size: 11 }, { x: 20, y: 58, size: 9  }, { x: 33, y: 63, size: 12 },
  { x: 44, y: 57, size: 10 }, { x: 55, y: 62, size: 13 }, { x: 67, y: 58, size: 9  },
  { x: 78, y: 64, size: 11 }, { x: 88, y: 59, size: 10 }, { x: 95, y: 62, size: 12 },
  { x: 9,  y: 76, size: 10 }, { x: 22, y: 80, size: 12 }, { x: 38, y: 77, size: 9  },
  { x: 51, y: 82, size: 11 }, { x: 63, y: 75, size: 13 }, { x: 74, y: 80, size: 10 },
  { x: 84, y: 76, size: 9  }, { x: 94, y: 82, size: 11 },
];

function FloatingGems({ active }: { active: boolean }) {
  const [gems, setGems] = useState<GemParticle[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addGem = useCallback(() => {
    const g = mkParticle();
    setGems(prev => [...prev, g]);
    const t = setTimeout(() => {
      setGems(prev => prev.filter(p => p.id !== g.id));
      timersRef.current.delete(g.id);
    }, g.lifetime);
    timersRef.current.set(g.id, t);
  }, []);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current.clear();
      setGems([]);
      return;
    }
    const INITIAL = 6;
    for (let i = 0; i < INITIAL; i++) { setTimeout(addGem, i * 120); }
    intervalRef.current = setInterval(addGem, 620);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height: 160, borderRadius: 12 }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #0a0b12 0%, #0f1020 100%)", borderRadius: 12 }} />
      <AnimatePresence>
        {active && (
          <motion.div key="bloom" className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: [0.35, 0.7, 0.35] }} exit={{ opacity: 0 }}
            transition={{ duration: 3.5, repeat: active ? Infinity : 0, ease: "easeInOut" }}
            style={{ borderRadius: 12, background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(249,115,22,0.10) 0%, transparent 80%)" }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gems.map(g => (
          <motion.div key={g.id} className="absolute pointer-events-none"
            style={{ left: `${g.x}%`, top: `${g.y}%` }}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.3 }}
            animate={{ opacity: 1, y: g.floatY, x: g.wobble, scale: 1 }}
            exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.35 } }}
            transition={{ duration: g.dur, ease: "easeOut" }}>
            <GemIcon size={g.size} />
          </motion.div>
        ))}
      </AnimatePresence>
      {!active && IDLE_GEMS.map((g, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ left: `${g.x}%`, top: `${g.y}%`, opacity: 0.22 }}>
          <GemIcon size={g.size} />
        </div>
      ))}
    </div>
  );
}

// ─── Circular Session Ring ─────────────────────────────────────────────────────
function SessionRing({ pct, h, m, s, active, endTimeStr }: {
  pct: number; h: number; m: number; s: number; active: boolean; endTimeStr: string | null;
}) {
  const R = 54, C = 2 * Math.PI * R;
  const filled = C * (pct / 100);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative" style={{ width: 136, height: 136 }}>
        <svg width="136" height="136" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="68" cy="68" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle cx="68" cy="68" r={R} fill="none" stroke="url(#ring-grad)" strokeWidth="6"
            strokeLinecap="round" strokeDasharray={C}
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
          <span className="text-lg font-black font-mono tabular-nums leading-none tracking-tight"
            style={{ color: active ? "#f97316" : "rgba(255,255,255,0.25)" }}>
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
function StatPill({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col gap-2 rounded-2xl px-4 py-4"
      style={{
        background: accent
          ? "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)"
          : "rgba(255,255,255,0.025)",
        border: accent ? "1px solid rgba(249,115,22,0.2)" : "1px solid rgba(255,255,255,0.06)",
      }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{
          background: accent ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
          border: accent ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.06)",
        }}>
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

// ─── Session Complete Banner ────────────────────────────────────────────────────
function SessionCompleteBanner({ liveGems, isPending, onClaim }: {
  liveGems: number; isPending: boolean; onClaim: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f1a0a 0%, #0a140a 100%)",
        border: "1px solid rgba(74,222,128,0.25)",
        boxShadow: "0 0 40px rgba(74,222,128,0.08), 0 20px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(74,222,128,0.08)" }} />

      <div className="relative px-5 py-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)" }}
          >
            <Sparkles size={20} style={{ color: "#4ade80" }} />
          </motion.div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "rgba(74,222,128,0.6)" }}>Session Complete</p>
            <p className="text-base font-black text-white leading-tight">Gems Ready to Claim!</p>
          </div>
        </div>

        {/* Gem count */}
        <div className="flex items-baseline gap-2 mb-5">
          <motion.span
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="text-4xl font-black font-mono tabular-nums"
            style={{ color: "#4ade80" }}
          >
            {formatGems(liveGems)}
          </motion.span>
          <span className="text-sm font-bold text-white/40">gems waiting</span>
        </div>

        {/* Claim button */}
        <motion.button
          onClick={onClaim}
          disabled={isPending}
          whileTap={{ scale: 0.97 }}
          className="w-full relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)",
            boxShadow: "0 6px 28px rgba(74,222,128,0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
            color: "#fff",
          }}
        >
          {!isPending && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1.5 }}
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width: "50%" }}
            />
          )}
          {isPending ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              Processing Claim…
            </>
          ) : (
            <><GemIcon size={18} /> Claim {formatGems(liveGems)} Gems &amp; Restart Mining</>
          )}
        </motion.button>
        <p className="text-[10px] text-white/25 text-center mt-3">Mining restarts automatically after claiming</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Mining() {
  const queryClient                      = useQueryClient();
  const [, setLocation]                  = useLocation();
  const { data, isLoading }              = useGetMiningStatus();
  const { mutate: claim, isPending }     = useClaimGems();
  const { mutate: startMine, isPending: isStarting } = useStartMining();
  const [claimFlash, setClaimFlash]      = useState(false);

  const status           = data as unknown as ExtendedMiningStatus | undefined;
  const miningNotStarted = (status as any)?.miningNotStarted === true;
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
  const sessionEnded = !isMiningActive && hasPending;
  const stoppedAndEmpty = !isMiningActive && liveGems <= 0;
  const progressPct = totalSessionMs > 0
    ? Math.max(0, Math.min(100, (1 - remainingMs / totalSessionMs) * 100))
    : 0;

  const endTimeStr = isMiningActive
    ? new Date(sessionExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const handleStartMining = useCallback(() => {
    startMine(undefined, {
      onSuccess: () => {
        notify.miningStarted();
        queryClient.invalidateQueries();
      },
      onError: (err: any) => notify.miningError(err.error),
    });
  }, [startMine, queryClient]);

  const handleClaim = useCallback(() => {
    if (!status?.pendingGems && liveGems <= 0) {
      notify.noGemsYet();
      return;
    }
    claim(undefined, {
      onSuccess: (res: any) => {
        setClaimFlash(true);
        setTimeout(() => setClaimFlash(false), 600);
        notify.gemsClaimed(formatGems(res.claimedGems));
        queryClient.invalidateQueries();
      },
      onError: (err: any) => notify.claimError(err.error || err.message),
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

  // ── Mining not started yet ──────────────────────────────────────────────────
  if (miningNotStarted) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 pb-28 md:pb-8 flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative w-full overflow-hidden rounded-3xl"
          style={{ height: 180, background: "linear-gradient(160deg, #0a0b12 0%, #0f1020 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {IDLE_GEMS.map((g, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ left: `${g.x}%`, top: `${g.y}%`, opacity: 0.18 }}>
              <GemIcon size={g.size} />
            </div>
          ))}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <Pickaxe size={28} style={{ color: "rgba(249,115,22,0.5)" }} />
            </div>
          </div>
        </div>

        <div className="text-center px-2">
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Ready to Mine?</h2>
          <p className="text-sm text-white/35 leading-relaxed">
            Start your first Peridot Mining session to begin accumulating gems. Free users earn gems every 3-hour cycle.
          </p>
        </div>

        <motion.button
          onClick={handleStartMining}
          disabled={isStarting}
          whileTap={{ scale: 0.97 }}
          className="w-full relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] tracking-wide overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #ea6c10 0%, #f97316 50%, #fb923c 100%)",
            boxShadow: "0 6px 28px rgba(249,115,22,0.4)",
            color: "#fff",
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1.5 }}
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }}
          />
          {isStarting ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              Starting…
            </>
          ) : (
            <><Pickaxe size={16} /> Start Mining</>
          )}
        </motion.button>

        <p className="text-[10px] text-white/20 text-center">
          Free users earn gems in 3-hour sessions · Peridot Mining
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 md:pb-8 space-y-3">

      {/* ════════ HERO CARD ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: `1px solid ${isMiningActive ? "rgba(249,115,22,0.2)" : sessionEnded ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: isMiningActive
            ? "0 0 60px rgba(249,115,22,0.08), 0 20px 40px rgba(0,0,0,0.4)"
            : "0 20px 40px rgba(0,0,0,0.35)",
          transition: "border-color 0.5s, box-shadow 0.5s",
        }}
      >
        {isMiningActive && (
          <>
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(249,115,22,0.09)" }} />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(124,58,237,0.08)" }} />
          </>
        )}

        {/* Floating gems scene */}
        <div className="px-4 pt-4 pb-2">
          <FloatingGems active={isMiningActive} />
        </div>

        {/* Live gem counter + session ring */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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
                  : sessionEnded
                    ? "linear-gradient(135deg, #fff 40%, rgba(74,222,128,0.8) 100%)"
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
              ) : sessionEnded ? (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-[11px] font-semibold"
                  style={{ color: "rgba(74,222,128,0.8)" }}
                >
                  Session complete — claim below to restart
                </motion.span>
              ) : (
                <span className="text-[11px] text-white/18">
                  {hasPending ? "Session ended — claim to restart" : "Deposit USDT to start mining"}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <SessionRing pct={progressPct} h={h} m={m} s={s} active={isMiningActive} endTimeStr={endTimeStr} />
          </div>
        </div>

        {/* Stats 2-col grid */}
        <div className="grid grid-cols-2 px-4 py-4 gap-3">
          <StatPill icon={<GemIcon size={14} />} label="Total Balance" value={formatGems(status.gemsBalance)} sub="gems" accent />
          <StatPill icon={<BarChart3 size={14} />} label="Mining Rate" value={formatGems(dailyRate)} sub="gems / day" />
        </div>

        {/* Progress strip */}
        <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2 pt-4">
            <span className="text-[9px] uppercase tracking-[0.14em] text-white/20 font-semibold flex items-center gap-1.5">
              <Clock size={9} /> Session Progress
            </span>
            <span className="text-[10px] font-bold font-mono"
              style={{ color: isMiningActive ? "rgba(249,115,22,0.6)" : sessionEnded ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.15)" }}>
              {sessionEnded ? "100%" : `${progressPct.toFixed(0)}%`}
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 999 }}>
            <motion.div
              className="h-full"
              style={{
                background: isMiningActive
                  ? "linear-gradient(90deg, rgba(249,115,22,0.6) 0%, #f97316 60%, #fb923c 100%)"
                  : sessionEnded
                    ? "linear-gradient(90deg, rgba(74,222,128,0.6) 0%, #4ade80 100%)"
                    : "rgba(255,255,255,0.08)",
                borderRadius: 999,
                boxShadow: isMiningActive ? "0 0 8px rgba(249,115,22,0.5)" : sessionEnded ? "0 0 8px rgba(74,222,128,0.4)" : "none",
              }}
              animate={{ width: sessionEnded ? "100%" : `${progressPct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* ══ SESSION COMPLETE BANNER — shown below the hero card ══ */}
      <AnimatePresence>
        {sessionEnded && (
          <SessionCompleteBanner
            liveGems={liveGems}
            isPending={isPending}
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>

      {/* ── Active mining status card ── */}
      <AnimatePresence>
        {isMiningActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ delay: 0.07 }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0.03) 100%)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            <div className="flex items-center gap-3.5 px-4 py-3.5">
              {/* Pulsing dot */}
              <div className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)" }}>
                <motion.div
                  className="absolute rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ width: 10, height: 10, background: "rgba(249,115,22,0.4)" }}
                />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f97316" }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-tight">Mining in Progress</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(249,115,22,0.55)" }}>
                  Claim unlocks automatically when session ends
                </p>
              </div>

              {/* Countdown pill */}
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                <Clock size={10} style={{ color: "rgba(249,115,22,0.6)" }} />
                <span className="text-[11px] font-bold font-mono tabular-nums" style={{ color: "rgba(249,115,22,0.8)" }}>
                  {pad(h)}:{pad(m)}:{pad(s)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade / Level Card ─────────────────────────────────────────────── */}
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
