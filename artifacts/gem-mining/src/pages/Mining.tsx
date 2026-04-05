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

// ─── App-authentic Gem — exact Lucide `Gem` icon path geometry ────────────────
// Lucide Gem vertices in 24×24 viewBox, centroid at (12, 12.5):
//   Outline: (6,3)→(18,3)→(22,9)→(12,22)→(2,9)→close
//   Girdle:  (2,9)→(22,9)      Crown inner: cl=(8,9), cr=(16,9)
// Scale by k, translate to scene (cx, cy).
function SceneGem({
  cx, cy, k, opacity = 1,
}: { cx: number; cy: number; k: number; opacity?: number }) {
  const X = (x: number) => cx + (x - 12) * k;
  const Y = (y: number) => cy + (y - 12.5) * k;
  const tl = [X(6),  Y(3) ] as const;
  const tr = [X(18), Y(3) ] as const;
  const gr = [X(22), Y(9) ] as const;
  const bp = [X(12), Y(22)] as const;
  const gl = [X(2),  Y(9) ] as const;
  const cl = [X(8),  Y(9) ] as const;
  const cr = [X(16), Y(9) ] as const;
  const p  = (...vs: readonly (readonly [number, number])[]) =>
    vs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <g opacity={opacity}>
      <ellipse cx={cx} cy={Y(24)} rx={8 * k} ry={2 * k} fill="rgba(0,0,0,0.22)" />
      <polygon points={p(tl, tr, gr, bp, gl)} fill="#F97316" />
      <polygon points={p(tl, tr, cr, cl)}     fill="rgba(255,255,255,0.26)" />
      <polygon points={p(tl, gl, cl)}          fill="rgba(0,0,0,0.18)" />
      <polygon points={p(tr, gr, cr)}          fill="rgba(255,255,255,0.14)" />
      <polygon points={p(gl, bp, cl)}          fill="rgba(0,0,0,0.12)" />
      <polygon points={p(gr, bp, cr)}          fill="rgba(255,255,255,0.08)" />
      <line x1={gl[0]} y1={gl[1]} x2={gr[0]} y2={gr[1]}
        stroke="rgba(255,255,255,0.55)" strokeWidth={0.85 * k} />
      <line x1={(cl[0]+cr[0])/2} y1={(cl[1]+cr[1])/2} x2={bp[0]} y2={bp[1]}
        stroke="rgba(255,255,255,0.28)" strokeWidth={0.65 * k} />
      <circle cx={tl[0]+(cl[0]-tl[0])*0.35} cy={tl[1]+(cl[1]-tl[1])*0.45}
        r={1.3*k} fill="rgba(255,255,255,0.72)" />
    </g>
  );
}

// ─── Gem particle ejected on each pick strike ─────────────────────────────────
// A mini Lucide Gem shape that arcs upward from the mountain peak and fades out.
function GemParticle({
  sx, sy, dx, dy, peakY, delay, k, dur,
}: {
  sx: number; sy: number; dx: number; dy: number;
  peakY: number; delay: number; k: number; dur: number;
}) {
  const V = (x: number, y: number) =>
    `${((x - 12) * k).toFixed(1)},${((y - 12.5) * k).toFixed(1)}`;
  const body  = `M${V(6,3)} L${V(18,3)} L${V(22,9)} L${V(12,22)} L${V(2,9)} Z`;
  const crown = `M${V(6,3)} L${V(18,3)} L${V(16,9)} L${V(8,9)} Z`;
  return (
    <motion.g
      initial={{ x: sx, y: sy, opacity: 0, scale: 0.1 }}
      animate={{
        x:       [sx, sx + dx * 0.45, sx + dx],
        y:       [sy, peakY,           sy + dy],
        opacity: [0,  1,               0],
        scale:   [0.1, 1,              0.5],
      }}
      transition={{
        repeat: Infinity, duration: dur, delay,
        ease: "easeOut", times: [0, 0.4, 1], repeatDelay: 0.04,
      }}
    >
      <path d={body}  fill="#F97316" />
      <path d={crown} fill="rgba(255,255,255,0.32)" />
    </motion.g>
  );
}

// ─── Mining scene ─────────────────────────────────────────────────────────────
//
// Reference composition (310×270 viewBox):
//
//   MOUNTAIN  lower-left / centre
//             Main silhouette + 6 coloured rock faces.
//             Peak: (108, 88)
//
//   PICKAXE   Pivot (grip) at (260, 14) upper-right.
//             Handle → collar at (136, 66).
//             HEAD anatomy — all perpendicular to handle:
//               handle dir (260→136, 14→66): (−124, 52), angle ≈ 157°
//               perp CCW (upper-left, 247°): pick-base direction
//               perp CW  (lower-right, 67°): poll direction
//               pick-base = (136 + 24·cos247°, 66 + 24·sin247°) = (127, 44)
//               poll-end  = (136 + 22·cos67°,  66 + 22·sin67°)  = (145, 86)
//               pick TIP  ≈ (105, 100) — just inside the mountain
//
//             PICK BLADE: large C-crescent from pick-base (127,44)
//               curving LEFT then DOWN, tip at ≈(103,100) near mountain peak.
//               Drawn FIRST (behind handle+head) so it appears natural.
//
//             POLL: short flat stub at poll-end (145,86).
//
//             ANIMATION:
//               Positive angle (CW in SVG, pivot upper-right):
//                 → head moves UPPER-LEFT → pick LIFTS off mountain = back-swing
//               Negative angle (CCW in SVG):
//                 → head moves LOWER-RIGHT → pick STRIKES deeper = downswing
//               Sequence: 0 → +14 (raise) → −3 (strike) → +12 (raise) → 0
//
//   LARGE GEM right side, replaces hero BTC coin. k=4.8
//   2 float gems above mountain. Replace smaller BTC coins.
//   GEM PARTICLES ejected on each strike when active.
//
function MiningScene({ active }: { active: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ height: 210, width: "100%" }}
    >
      <svg viewBox="0 0 310 275" width="100%" style={{ maxWidth: 310, overflow: "visible" }}>
        <defs>
          {/* Wood handle — warm amber to dark brown */}
          <linearGradient id="sc-hg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#D9953A" />
            <stop offset="50%"  stopColor="#B07228" />
            <stop offset="100%" stopColor="#7B4A18" />
          </linearGradient>
          {/* Metal head — bright to dark steel */}
          <linearGradient id="sc-mg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E2E5EA" />
            <stop offset="55%"  stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#6B7280" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="148" cy="271" rx="118" ry="7" fill="rgba(0,0,0,0.22)" />

        {/* ═══════════════════════════════════════════════════
            MOUNTAIN — blue-grey jagged rocky formation
            Traced 1:1 from reference image proportions.
            6 coloured face polygons give flat-design depth.
            Peak: (108, 88)
            ═══════════════════════════════════════════════ */}

        {/* Main body silhouette */}
        <path
          d="M 12 270
             L 38 198 L 46 184 L 58 206
             L 68 138 L 88 154 L 108 88
             L 134 112 L 160 118 L 188 158
             L 220 208 L 252 270 Z"
          fill="#4B5568"
        />
        {/* Left main lit face — light from upper-left */}
        <path d="M 108 88  L 68 138  L 86 146  L 120 106 Z" fill="#64748B" />
        {/* Dark crevice at right of peak */}
        <path d="M 108 88  L 134 112 L 140 106 L 116 84  Z" fill="#1E293B" />
        {/* Right shoulder face */}
        <path d="M 160 118 L 188 158 L 195 150 L 167 112 Z" fill="#5A6478" />
        {/* Front-left rocky slab */}
        <path d="M 12 270  L 38 198  L 56 214  L 66 270  Z" fill="#374151" />
        {/* Secondary left peak */}
        <path d="M 46 184  L 34 172  L 38 198  L 50 204  Z" fill="#4B5568" />
        {/* Under-peak deep shadow */}
        <path d="M 88 154  L 108 88  L 116 100 L 97 158  Z" fill="#2D3748" />
        {/* Right-centre block */}
        <path d="M 134 112 L 160 118 L 162 126 L 138 120 Z" fill="#374151" />
        {/* Peak highlight sliver */}
        <path d="M 106 90  L 112 96  L 109 86  Z" fill="rgba(255,255,255,0.22)" />

        {/* Strike glow — pulses at mountain peak when active */}
        {active && (
          <motion.circle cx="108" cy="96"
            animate={{ r: [4, 28, 4], opacity: [0.68, 0, 0.68] }}
            transition={{
              repeat: Infinity, duration: 0.90,
              ease: "easeOut", repeatDelay: 0.22,
            }}
            fill="rgba(249,115,22,0.52)"
          />
        )}

        {/* ═══════════════════════════════════════════════════
            GEM PARTICLES — eject from mountain on each strike
            Mini Lucide Gem arcs, timed with pickaxe swing
            ═══════════════════════════════════════════════ */}
        {active && (
          <>
            <GemParticle sx={108} sy={92} dx={-60} dy={-72} peakY={6}  delay={0}    k={0.74} dur={1.10} />
            <GemParticle sx={108} sy={92} dx={24}  dy={-84} peakY={4}  delay={0.19} k={0.58} dur={1.00} />
            <GemParticle sx={108} sy={92} dx={-42} dy={-92} peakY={2}  delay={0.36} k={0.90} dur={1.20} />
            <GemParticle sx={108} sy={92} dx={46}  dy={-66} peakY={10} delay={0.54} k={0.50} dur={0.95} />
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            LARGE HERO GEM — right side
            Same size/position as the big BTC coin in reference.
            Lucide Gem pentagon shape, k=4.8.
            ═══════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "256px 182px" }}
          animate={active ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          <SceneGem cx={256} cy={178} k={4.8} />
        </motion.g>

        {/* ═══════════════════════════════════════════════════
            FLOATING GEMS — above mountain
            Match the 2 smaller BTC coin positions in reference.
            Lucide Gem pentagon shape.
            ═══════════════════════════════════════════════ */}

        {/* Upper-left gem */}
        <motion.g
          animate={active ? { y: [0, -8, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.9, ease: "easeInOut" }}
        >
          <SceneGem cx={100} cy={44} k={2.1} opacity={active ? 1 : 0.38} />
        </motion.g>

        {/* Upper-right gem */}
        <motion.g
          animate={active ? { y: [0, -10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.2, delay: 0.42, ease: "easeInOut" }}
        >
          <SceneGem cx={168} cy={28} k={2.5} opacity={active ? 1 : 0.38} />
        </motion.g>

        {/* Small gem near left rock face */}
        <motion.g
          animate={active ? { y: [0, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.7, delay: 0.88, ease: "easeInOut" }}
        >
          <SceneGem cx={56} cy={120} k={1.5} opacity={active ? 0.85 : 0.25} />
        </motion.g>

        {/* ═══════════════════════════════════════════════════
            PICKAXE
            ───────────────────────────────────────────────
            Pivot (grip): (260, 14)  upper-right
            Collar (handle→head): (136, 66)
            ───────────────────────────────────────────────
            HEAD computed geometry:
              Handle vec: (136−260, 66−14) = (−124, 52)
              Length ≈ 134 px   angle ≈ 157°
              Perp-CCW (247°, upper-left): pick-base direction
              Perp-CW  (67°,  lower-right): poll direction

              pick-base (247°, 26px from collar):
                (136 + 26·cos247°, 66 + 26·sin247°)
                = (136 − 10.2, 66 − 23.9) = (126, 42)
              poll-end (67°, 22px from collar):
                (136 + 22·cos67°, 66 + 22·sin67°)
                = (136 + 8.6, 66 + 20.3) = (145, 86)

              Head-body 7px each side (perp to axis 247°→67°):
                axis direction (pick→poll): (19,44) norm (0.396,0.918)
                side CW: (0.918, −0.396) — upper-right face (lit)
              Corner A (pick front): (126+6.4, 42−2.8) = (132, 39)
              Corner B (pick back):  (126−6.4, 42+2.8) = (120, 45)
              Corner C (poll front): (145+6.4, 86−2.8) = (151, 83)
              Corner D (poll back):  (145−6.4, 86+2.8) = (139, 89)

            PICK BLADE: C-crescent.
              Outer arc: M(126,42) C(100,40)(82,68)(102,100)  tip→(108,106)
              Inner arc: C(90,96)(90,50)(132,46)  close
              Tip (102−108, 100−106) ≈ mountain peak (108,88+12body)

            ANIMATION (see header comment for direction explanation):
              rotate: [0, +14, −3, +12, 0]  times: [0, .22, .52, .74, 1]
              +14° = raise (pick lifts clear of mountain)
              −3°  = deep strike (pick tip presses into mountain)
            ═══════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: "260px 14px" }}
          animate={active
            ? { rotate: [0, 14, -3, 12, 0] }
            : { rotate: 0 }}
          transition={active
            ? {
                repeat: Infinity,
                duration: 0.92,
                ease: [0.18, 1.05, 0.38, 1],
                times: [0, 0.22, 0.52, 0.74, 1],
                repeatDelay: 0.22,
              }
            : { duration: 0.5 }}
        >
          {/* ── PICK BLADE (drawn first, behind handle + head) ────────────
              Large C-crescent. Outer arc from pick-base (126,42) sweeps
              LEFT then DOWN to tip ≈ (102,100), near the mountain peak.
              Inner arc returns from tip to near pick-base, forming the
              crescent. Two layers: dark outer, lighter inner.          ── */}

          {/* Outer/shadow layer */}
          <path
            d="M 126 42
               C 100 40, 80 68, 100 100
               L 108 108
               C 90 98, 90 52, 132 46
               Z"
            fill="#6B7280"
          />
          {/* Lit inner face */}
          <path
            d="M 124 44
               C 102 43, 84 68, 103 99
               L 108 106
               C 93 97, 93 55, 130 48
               Z"
            fill="#9CA3AF"
          />

          {/* ── HANDLE ───────────────────────────────────────────────────
              From pivot (260,14) to collar (136,66).
              Three strokes: main wood, highlight seam, shadow edge.  ── */}
          <line x1="260" y1="14" x2="138" y2="66"
            stroke="url(#sc-hg)" strokeWidth="13" strokeLinecap="round" />
          <line x1="256" y1="17" x2="140" y2="63"
            stroke="rgba(255,255,255,0.30)" strokeWidth="4" strokeLinecap="round" />
          <line x1="264" y1="18" x2="142" y2="70"
            stroke="rgba(0,0,0,0.26)" strokeWidth="2.5" strokeLinecap="round" />

          {/* ── COLLAR / FERRULE ─────────────────────────────────────────
              Dark metal ring where wood meets head.                   ── */}
          <path d="M 128 60 L 148 74 L 152 68 L 132 54 Z" fill="#1F2937" />
          <path d="M 130 58 L 150 72 L 152 68 L 132 54 Z" fill="#374151" />

          {/* ── HEAD BODY ─────────────────────────────────────────────────
              Parallelogram from pick-base (126,42) to poll-end (145,86).
              Viewer-facing front, lit top edge, side shadow, underside.── */}

          {/* Main face (viewer-facing) */}
          <path d="M 132 39 L 120 45 L 139 89 L 151 83 Z" fill="url(#sc-mg)" />

          {/* Top edge — lit from above */}
          <path d="M 120 45 L 132 39 L 126 33 L 114 39 Z" fill="#E2E5EA" />

          {/* Right side shadow */}
          <path d="M 132 39 L 151 83 L 157 79 L 138 35 Z" fill="#9CA3AF" opacity="0.65" />

          {/* Underside shadow */}
          <path d="M 120 45 L 139 89 L 144 94 L 125 50 Z" fill="#6B7280" opacity="0.50" />

          {/* ── POLL (blunt flat end) ─────────────────────────────────────
              Extends 12px further from poll-end (145,86) in CW direction.
              CW direction (67°): cos67°=0.391, sin67°=0.921 → (+4.7,+11.1)
              poll-tip ≈ (150, 97)
              Width same as head body (7px each side).                ── */}

          {/* Poll block face */}
          <path d="M 151 83 L 139 89 L 144 100 L 156 94 Z" fill="#9CA3AF" />

          {/* Poll end visible face (the flat striking butt) */}
          <path d="M 156 94 L 144 100 L 148 108 L 160 102 Z" fill="#6B7280" />

          {/* Poll top-edge highlight */}
          <path d="M 151 83 L 156 94 L 160 91 L 155 80 Z" fill="#D1D5DB" />

          {/* ── PICK TIP — orange working edge ────────────────────────────
              The contact point where pick meets rock.               ── */}
          <path d="M 100 100 L 108 108 L 103 113 L 95 103 Z" fill="#F97316" />
          <circle cx="103" cy="105" r="4" fill="rgba(249,115,22,0.42)" />
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
