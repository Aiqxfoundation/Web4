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
    // 50ms = 20 updates/sec. At 13 gems/sec the display ticks +1 every ~77ms.
    // This creates the smooth 1,2,3... effect the user wants.
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

// ─── App-authentic Gem — exact Lucide `Gem` icon geometry ──────────────────────
// Lucide Gem vertices in its 24×24 viewBox (centered at x=12, y=12.5):
//   Outline  : (6,3) → (18,3) → (22,9) → (12,22) → (2,9) → close
//   Girdle   : (2,9) → (22,9)
//   Facets   : crown-left(8,9), crown-right(16,9)
// We scale by k and translate to (cx, cy).
function SceneGem({
  cx, cy, k, opacity = 1,
}: {
  cx: number; cy: number; k: number; opacity?: number;
}) {
  // Map a vertex from Lucide's 24×24 space to scene space
  const X = (x: number) => cx + (x - 12) * k;
  const Y = (y: number) => cy + (y - 12.5) * k;

  // Named vertices
  const tl = [X(6),  Y(3) ] as const; // top-left crown
  const tr = [X(18), Y(3) ] as const; // top-right crown
  const gr = [X(22), Y(9) ] as const; // girdle right
  const bp = [X(12), Y(22)] as const; // bottom pavilion tip
  const gl = [X(2),  Y(9) ] as const; // girdle left
  const cl = [X(8),  Y(9) ] as const; // inner girdle left
  const cr = [X(16), Y(9) ] as const; // inner girdle right

  const pts = (...vs: readonly (readonly [number, number])[]) =>
    vs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <g opacity={opacity}>
      {/* Drop shadow */}
      <ellipse cx={cx} cy={Y(24)} rx={8 * k} ry={2 * k} fill="rgba(0,0,0,0.22)" />

      {/* Main body */}
      <polygon points={pts(tl, tr, gr, bp, gl)} fill="#F97316" />

      {/* Crown top face — lit */}
      <polygon points={pts(tl, tr, cr, cl)} fill="rgba(255,255,255,0.26)" />

      {/* Crown left facet — shadow */}
      <polygon points={pts(tl, gl, cl)} fill="rgba(0,0,0,0.18)" />

      {/* Crown right facet — catch-light */}
      <polygon points={pts(tr, gr, cr)} fill="rgba(255,255,255,0.14)" />

      {/* Pavilion left — darker */}
      <polygon points={pts(gl, bp, cl)} fill="rgba(0,0,0,0.12)" />

      {/* Pavilion right — slight sheen */}
      <polygon points={pts(gr, bp, cr)} fill="rgba(255,255,255,0.08)" />

      {/* Girdle line */}
      <line
        x1={gl[0]} y1={gl[1]} x2={gr[0]} y2={gr[1]}
        stroke="rgba(255,255,255,0.55)" strokeWidth={0.85 * k}
      />

      {/* Centre pavilion line */}
      <line
        x1={(cl[0] + cr[0]) / 2} y1={(cl[1] + cr[1]) / 2}
        x2={bp[0]} y2={bp[1]}
        stroke="rgba(255,255,255,0.28)" strokeWidth={0.65 * k}
      />

      {/* Crown glint */}
      <circle
        cx={tl[0] + (cl[0] - tl[0]) * 0.35}
        cy={tl[1] + (cl[1] - tl[1]) * 0.45}
        r={1.3 * k}
        fill="rgba(255,255,255,0.72)"
      />
    </g>
  );
}

// ─── Full mining scene — 1:1 reference composition ─────────────────────────────
// Layout (310×270 viewBox):
//   Mountain     : lower-left / centre  (peak ≈ 106,82)
//   Pickaxe      : upper-right, pivot at (264,18), head swings toward peak
//   Large gem    : right side, hero element  (replaces big BTC coin)
//   2 float gems : above mountain  (replace smaller BTC coins)
//   1 small gem  : near left rock face
function MiningScene({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ height: 200, width: "100%" }}
    >
      <svg viewBox="0 0 310 270" width="100%" style={{ maxWidth: 310, overflow: "visible" }}>
        <defs>
          {/* Wood handle */}
          <linearGradient id="sc-hg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#D4923A" />
            <stop offset="55%"  stopColor="#A56828" />
            <stop offset="100%" stopColor="#7B4A18" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="148" cy="264" rx="120" ry="8" fill="rgba(0,0,0,0.2)" />

        {/* ══════════════════════════════════════════════════
            MOUNTAIN  — flat-design jagged rocks
            Carefully traced from reference image:
            main peak, secondary left peak, multiple rock faces
            ════════════════════════════════════════════════ */}

        {/* Main body */}
        <path
          d="M 10 268 L 40 192 L 56 210 L 40 185 L 60 128
             L 83 148 L 106 82 L 130 106 L 158 112 L 186 150
             L 218 202 L 252 268 Z"
          fill="#4B5568"
        />
        {/* Left lit face (light from upper-left) */}
        <path d="M 106 82  L 60 128  L 78 138  L 120 100 Z" fill="#64748B" />
        {/* Dark crevice right of peak */}
        <path d="M 106 82  L 130 106 L 136 100 L 114 78  Z" fill="#1E293B" />
        {/* Right shoulder visible face */}
        <path d="M 158 112 L 186 150 L 192 144 L 164 108 Z" fill="#5A6478" />
        {/* Front-left rocky slab */}
        <path d="M 10 268  L 40 192  L 58 210  L 68 268  Z" fill="#374151" />
        {/* Under-peak shadow */}
        <path d="M 83 148  L 106 82  L 113 92  L 90 153  Z" fill="#2D3748" />
        {/* Secondary left peak bump */}
        <path d="M 40 185  L 28 174  L 40 192  L 52 198  Z" fill="#4B5568" />
        {/* Peak highlight sliver */}
        <path d="M 104 84  L 110 90  L 107 80  Z" fill="rgba(255,255,255,0.22)" />

        {/* Strike glow at peak */}
        {active && (
          <motion.circle cx="106" cy="88"
            animate={{ r: [4, 22, 4], opacity: [0.78, 0, 0.78] }}
            transition={{ repeat: Infinity, duration: 0.78, ease: "easeOut" }}
            fill="rgba(249,115,22,0.58)"
          />
        )}

        {/* ══════════════════════════════════════════════════
            LARGE HERO GEM — right side
            Same position/size as the big BTC coin in reference.
            Uses app-authentic Lucide Gem shape.
            ════════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "256px 185px" }}
          animate={active ? { scale: [1, 1.04, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <SceneGem cx={256} cy={182} k={4.8} />
        </motion.g>

        {/* ══════════════════════════════════════════════════
            FLOATING GEMS — above mountain
            Same positions as smaller BTC coins in reference.
            All use app-authentic Lucide Gem shape.
            ════════════════════════════════════════════════ */}

        {/* Upper-left gem */}
        <motion.g
          animate={active ? { y: [0, -8, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
        >
          <SceneGem cx={104} cy={44} k={2.1} opacity={active ? 1 : 0.4} />
        </motion.g>

        {/* Upper-right gem (slightly larger, higher) */}
        <motion.g
          animate={active ? { y: [0, -10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.42, ease: "easeInOut" }}
        >
          <SceneGem cx={172} cy={30} k={2.5} opacity={active ? 1 : 0.4} />
        </motion.g>

        {/* Small gem — left rock face */}
        <motion.g
          animate={active ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.7, delay: 0.88, ease: "easeInOut" }}
        >
          <SceneGem cx={58} cy={118} k={1.5} opacity={active ? 0.85 : 0.28} />
        </motion.g>

        {/* ══════════════════════════════════════════════════
            PICKAXE
            Pivot: handle-top at (264,18) — upper-right.
            Head junction (where handle meets head body): ~(112,74).
            Head body axis: poll(120,52) → pick-base(104,96),
              perpendicular to handle, 14px wide.
            Pick blade extends from pick-base to tip (88,118).
            ════════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "264px 18px" }}
          animate={active
            ? { rotate: [0, 32, 5, 28, 0] }
            : { rotate: 0 }}
          transition={active
            ? {
                repeat: Infinity,
                duration: 0.86,
                ease: [0.2, 1.1, 0.35, 1],
                times: [0, 0.28, 0.52, 0.76, 1],
                repeatDelay: 0.18,
              }
            : { duration: 0.5, ease: "easeOut" }}
        >
          {/* ── Handle — thick brown wood from pivot to head ── */}
          <line
            x1="264" y1="18" x2="114" y2="74"
            stroke="url(#sc-hg)" strokeWidth="12" strokeLinecap="round"
          />
          {/* Handle highlight seam (left edge, catching light) */}
          <line
            x1="260" y1="20" x2="116" y2="71"
            stroke="rgba(255,255,255,0.24)" strokeWidth="3.5" strokeLinecap="round"
          />
          {/* Handle shadow edge (right side) */}
          <line
            x1="267" y1="22" x2="118" y2="78"
            stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round"
          />

          {/* ── Ferrule / collar ring at handle-head junction ── */}
          {/* Dark band where wood meets metal */}
          <path d="M 106 68 L 122 82 L 126 76 L 110 62 Z" fill="#1E293B" />
          <path d="M 108 66 L 124 80 L 126 76 L 110 62 Z" fill="#374151" />

          {/* ── Head body ──
              Head axis runs poll(120,52) → pick-base(104,96).
              Axis direction: (-16,44), normalized (-0.341, 0.940).
              "Front" perp (CW): (0.940, 0.341) → upper-right side (lit)
              "Back"  perp (CCW): (-0.940,-0.341) → lower-left side (shadow)
              7px each side:
                Poll-front : (120+6.6, 52+2.4) = (127,54)
                Poll-back  : (120-6.6, 52-2.4) = (113,50)
                Pick-front : (104+6.6, 96+2.4) = (111,98)
                Pick-back  : (104-6.6, 96-2.4) = (97,94)           ── */}

          {/* Head main face (facing viewer — front side) */}
          <path d="M 127 54 L 113 50 L 97 94 L 111 98 Z" fill="#C8CDD6" />

          {/* Head top edge (lit from above) */}
          <path d="M 113 50 L 127 54 L 122 48 L 108 44 Z" fill="#E2E5EA" />

          {/* Head right/back face (shadow) */}
          <path d="M 127 54 L 111 98 L 116 104 L 132 60 Z" fill="#6B7280" />

          {/* ── Poll face — blunt upper end ── */}
          {/* Shows the flat striking face of the poll */}
          <path d="M 113 50 L 108 44 L 102 48 L 97 54 L 97 94 L 113 50 Z"
            fill="#9CA3AF" opacity="0.7" />
          <path d="M 108 44 L 113 50 L 108 52 L 103 46 Z" fill="#D1D5DB" />

          {/* ── Pick blade — extends from pick-base, curves to tip ── */}
          {/* The pick blade starts wide from the pick-base end of the head,
              then tapers to a sharp point aimed at the mountain peak below. */}
          {/* Blade body */}
          <path d="M 111 98 L 97 94 L 80 124 L 92 128 Z" fill="#6B7280" />
          {/* Blade top (lit face of blade) */}
          <path d="M 111 98 L 92 128 L 96 132 L 116 104 Z" fill="#9CA3AF" />
          {/* Sharp tip (orange accent — the working edge) */}
          <path d="M 80 124 L 92 128 L 84 132 Z" fill="#F97316" opacity="0.88" />
          {/* Tip glint */}
          <circle cx="87" cy="124" r="2" fill="rgba(249,115,22,0.5)" />
        </motion.g>
      </svg>
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
          Everything inside one surface — sections separated by dividers,
          matching the Profile hero card's architecture.
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

        {/* ── Section 2: Pickaxe visual ──────────────────────────────────── */}
        <div
          className="flex flex-col items-center pt-5 pb-2"
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
