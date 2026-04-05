import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGetMiningStatus, useClaimGems } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import { ChevronRight, TrendingUp, Zap, Gem, Clock, BarChart3, Pickaxe } from "lucide-react";
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

// ─── Particle system ───────────────────────────────────────────────────────────
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string;
}

// ─── Canvas Mining Scene ───────────────────────────────────────────────────────
function MiningCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const angleRef  = useRef(0);
  const dirRef    = useRef(1);
  const strikeRef = useRef(0);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const GEM_COLORS = ["#a78bfa", "#8b5cf6", "#7c3aed", "#c4b5fd", "#f97316", "#fb923c"];

    function spawnParticles(cx: number, cy: number, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particles.current.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          life: 1, maxLife: 0.6 + Math.random() * 0.8,
          size: 2.5 + Math.random() * 4,
          color: GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
        });
      }
    }

    function drawGem(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, alpha = 1) {
      const sc = s / 40;
      const tx = cx - s / 2, ty = cy - s / 2;
      function pt(x: number, y: number): [number, number] { return [tx + x * sc, ty + y * sc]; }
      function poly(pts: [number, number][], fill: string, op = 1) {
        ctx.save(); ctx.globalAlpha = alpha * op;
        ctx.beginPath();
        ctx.moveTo(...pt(...pts[0]));
        for (let i = 1; i < pts.length; i++) ctx.lineTo(...pt(...pts[i]));
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
      }
      poly([[20,4],[30,14],[20,10]], "#c4b5fd");
      poly([[20,4],[10,14],[20,10]], "#a78bfa", 0.88);
      poly([[30,14],[20,10],[10,14]], "#8b5cf6", 0.7);
      poly([[10,14],[20,10],[20,34],[6,22]], "#6d28d9");
      poly([[30,14],[20,10],[20,34],[34,22]], "#7c3aed");
      poly([[20,34],[6,22],[34,22]], "#4c1d95");
      poly([[20,5],[26,12],[22,11]], "#f97316", 0.9);
    }

    function drawPickaxe(
      ctx: CanvasRenderingContext2D,
      px: number, py: number,
      angle: number,
    ) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);

      // Handle
      const hg = ctx.createLinearGradient(0, -4, 0, 4);
      hg.addColorStop(0, "#c08040"); hg.addColorStop(1, "#7a4a18");
      ctx.strokeStyle = hg; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(62, 0); ctx.stroke();

      // Shaft wrap rings
      for (const rx of [20, 35, 50]) {
        ctx.strokeStyle = "rgba(120,70,20,0.6)"; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx, -4); ctx.lineTo(rx, 4); ctx.stroke();
      }

      // Pick head
      const hd = ctx.createLinearGradient(60, -16, 60, 14);
      hd.addColorStop(0, "#e0e0e0"); hd.addColorStop(0.5, "#aaa"); hd.addColorStop(1, "#666");
      ctx.fillStyle = hd;
      ctx.beginPath();
      ctx.moveTo(60, -16); ctx.lineTo(92, -6); ctx.lineTo(88, 13); ctx.lineTo(60, 7);
      ctx.closePath(); ctx.fill();

      // Tip spike
      const tip = ctx.createLinearGradient(88, -8, 88, 8);
      tip.addColorStop(0, "#d0d0d0"); tip.addColorStop(1, "#888");
      ctx.fillStyle = tip;
      ctx.beginPath(); ctx.moveTo(88, -8); ctx.lineTo(108, 0); ctx.lineTo(88, 8);
      ctx.closePath(); ctx.fill();

      // Back butt
      ctx.fillStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(60, -16); ctx.lineTo(52, -10); ctx.lineTo(52, 10); ctx.lineTo(60, 7);
      ctx.closePath(); ctx.fill();

      // Edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(60, -16); ctx.lineTo(92, -6); ctx.stroke();

      ctx.restore();
    }

    function drawRock(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
      // Glow when active
      if (active) {
        const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 55);
        glow.addColorStop(0, "rgba(167,139,250,0.35)");
        glow.addColorStop(0.5, "rgba(124,58,237,0.12)");
        glow.addColorStop(1, "rgba(76,29,149,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fill();
      }

      // Rock body
      const rg = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, 38);
      rg.addColorStop(0, "#3a3a4a"); rg.addColorStop(1, "#1a1a22");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy + 20);
      ctx.bezierCurveTo(cx - 40, cy + 5, cx - 38, cy - 18, cx - 18, cy - 28);
      ctx.bezierCurveTo(cx - 5, cy - 38, cx + 15, cy - 35, cx + 28, cy - 18);
      ctx.bezierCurveTo(cx + 40, cy - 4, cx + 38, cy + 14, cx + 28, cy + 24);
      ctx.bezierCurveTo(cx + 10, cy + 35, cx - 12, cy + 34, cx - 30, cy + 20);
      ctx.closePath(); ctx.fill();

      // Crystal veins
      ctx.strokeStyle = "rgba(139,92,246,0.4)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy - 20); ctx.lineTo(cx + 5, cy); ctx.lineTo(cx - 5, cy + 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 12, cy - 15); ctx.lineTo(cx + 2, cy + 5); ctx.stroke();

      // Embedded gems
      const gemPositions = [
        { ox: -8, oy: -6, s: 14 },
        { ox: 10, oy: 4, s: 10 },
        { ox: -2, oy: 12, s: 8 },
      ];
      for (const gp of gemPositions) {
        drawGem(ctx, cx + gp.ox, cy + gp.oy, gp.s, 0.75);
      }

      // Rock facets highlight
      ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 28); ctx.lineTo(cx + 28, cy - 18); ctx.lineTo(cx + 28, cy + 24);
      ctx.stroke();
    }

    function draw() {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // ── Background ─────────────────────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0b10");
      bg.addColorStop(1, "#0d0f18");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Ambient top-left glow (active)
      if (active) {
        const al = ctx.createRadialGradient(W * 0.5, H * 0.2, 0, W * 0.5, H * 0.2, H * 0.8);
        al.addColorStop(0, "rgba(124,58,237,0.08)");
        al.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = al; ctx.fillRect(0, 0, W, H);
      }

      // ── Ground ─────────────────────────────────────────────────────────
      const groundY = H * 0.76;
      const gr = ctx.createLinearGradient(0, groundY, 0, H);
      gr.addColorStop(0, "#16171f"); gr.addColorStop(1, "#0e0f14");
      ctx.fillStyle = gr; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.strokeStyle = "rgba(139,92,246,0.12)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

      // ── Rock position ─────────────────────────────────────────────────
      const rockX = W * 0.55, rockY = H * 0.48;
      frameRef.current++;

      // ── Pickaxe swing ─────────────────────────────────────────────────
      const MAX_ANGLE = 0.62;
      if (active) {
        angleRef.current += 0.065 * dirRef.current;
        if (angleRef.current >= MAX_ANGLE) {
          dirRef.current = -1;
          // On strike — spawn particles
          if (strikeRef.current === 0) spawnParticles(rockX - 12, rockY - 5, 14);
          strikeRef.current = 3;
        }
        if (angleRef.current <= -MAX_ANGLE * 0.35) dirRef.current = 1;
        if (strikeRef.current > 0) strikeRef.current--;
      } else {
        angleRef.current += ((-0.2) - angleRef.current) * 0.08;
      }

      // ── Particles ─────────────────────────────────────────────────────
      particles.current = particles.current.filter(p => p.life > 0);
      for (const p of particles.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025;
        const a = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = a * 0.9;

        // Diamond particle shape
        const s = p.size * a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.6, p.y);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.6, p.y);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // ── Draw rock ──────────────────────────────────────────────────────
      drawRock(ctx, rockX, rockY, frameRef.current);

      // ── Strike flash ──────────────────────────────────────────────────
      if (strikeRef.current > 0) {
        const fl = ctx.createRadialGradient(rockX, rockY, 0, rockX, rockY, 48);
        fl.addColorStop(0, `rgba(249,115,22,${0.5 * (strikeRef.current / 3)})`);
        fl.addColorStop(1, "rgba(249,115,22,0)");
        ctx.fillStyle = fl;
        ctx.beginPath(); ctx.arc(rockX, rockY, 48, 0, Math.PI * 2); ctx.fill();
      }

      // ── Draw pickaxe ──────────────────────────────────────────────────
      const pivotX = W * 0.3, pivotY = H * 0.38;
      drawPickaxe(ctx, pivotX, pivotY, angleRef.current);

      // ── Miner silhouette ──────────────────────────────────────────────
      const mx = W * 0.22, my = groundY;
      ctx.fillStyle = "#1e1f28";
      // Body
      ctx.beginPath();
      ctx.ellipse(mx, my - 22, 13, 22, 0, 0, Math.PI * 2); ctx.fill();
      // Head
      ctx.beginPath();
      ctx.arc(mx, my - 50, 11, 0, Math.PI * 2); ctx.fill();
      // Helmet
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(mx, my - 52, 12, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#cc6010";
      ctx.fillRect(mx - 13, my - 52, 26, 4);
      // Lamp
      ctx.fillStyle = "#ffdd00";
      ctx.beginPath(); ctx.arc(mx + 8, my - 58, 4, 0, Math.PI * 2); ctx.fill();
      if (active) {
        const lamp = ctx.createRadialGradient(mx + 8, my - 58, 0, mx + 18, my - 48, 28);
        lamp.addColorStop(0, "rgba(255,220,0,0.3)"); lamp.addColorStop(1, "rgba(255,220,0,0)");
        ctx.fillStyle = lamp;
        ctx.beginPath(); ctx.arc(mx + 18, my - 48, 28, 0, Math.PI * 2); ctx.fill();
      }

      // ── Idle overlay ──────────────────────────────────────────────────
      if (!active) {
        ctx.fillStyle = "rgba(6,7,12,0.45)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.letterSpacing = "3px";
        ctx.fillText("⏸  PAUSED", W / 2, H / 2 + 4);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={200}
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 12 }}
    />
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
          {/* Track */}
          <circle cx="68" cy="68" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Progress */}
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

        {/* Center content */}
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

  // ── Loading ─────────────────────────────────────────────────────────────────
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
          HERO CARD — Canvas scene + gem counter
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
            <div
              className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(249,115,22,0.1)" }}
            />
            <div
              className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(124,58,237,0.08)" }}
            />
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
            {isMiningActive ? (
              <><Zap size={10} /> Mining</>
            ) : (
              "⏸ Paused"
            )}
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <Gem size={9} style={{ color: "rgba(249,115,22,0.6)" }} />
            {isFreeUser ? "Free Node" : LEVEL_NAMES[currentLevel]}
            {!isFreeUser && ` · Lv ${currentLevel}`}
          </div>
        </div>

        {/* ── Mining canvas ───────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <MiningCanvas active={isMiningActive} />
        </div>

        {/* ── Live gem counter + session ring ─────────────────────────────── */}
        <div
          className="flex items-center gap-4 px-5 pt-5 pb-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* Counter */}
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
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#f97316", boxShadow: "0 0 5px rgba(249,115,22,0.8)" }}
                  />
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

          {/* Session ring */}
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
            icon={<Gem size={14} />}
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

        {/* ── Bottom progress strip ────────────────────────────────────────── */}
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
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
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 999 }}
          >
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

      {/* ════════════════════════════════════════════════════════════════════════
          CLAIM BUTTON
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
      >
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
          {/* Shine sweep */}
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
                style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                }}
              />
              Processing…
            </>
          ) : !isMiningActive && hasPending ? (
            <>
              <Gem size={16} />
              Claim &amp; Restart Mining
            </>
          ) : hasPending ? (
            <>
              <Gem size={16} />
              Claim {formatGems(liveGems)} Gems
            </>
          ) : (
            <>
              <Pickaxe size={16} />
              Mining in Progress
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════
          EXTRA STATS ROW
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatPill
          icon={<TrendingUp size={14} />}
          label="Total Deposited"
          value={`$${(status.totalDepositUsdt ?? 0).toLocaleString()}`}
          sub="USDT"
        />
        <StatPill
          icon={<Clock size={14} />}
          label="Days Remaining"
          value={status.daysRemaining != null ? String(status.daysRemaining) : "—"}
          sub="of 180-day cycle"
        />
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════
          UPGRADE / LEVEL CARD
      ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
      >
        {isFreeUser ? (
          <button
            onClick={() => setLocation("/levels")}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-white/[0.03] transition-colors text-left group"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}
              >
                <TrendingUp size={16} style={{ color: "#f97316" }} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Upgrade Mining Power</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  Invest USDT to unlock faster gem rates
                </p>
              </div>
            </div>
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg group-hover:translate-x-0.5 transition-transform"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
            >
              <ChevronRight size={14} style={{ color: "rgba(249,115,22,0.6)" }} />
            </div>
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
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)",
                  border: "1px solid rgba(249,115,22,0.18)",
                }}
              >
                <Pickaxe size={16} style={{ color: "#f97316" }} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{LEVEL_NAMES[currentLevel]}</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  ${(status.totalDepositUsdt ?? 0).toLocaleString()} USDT · Level {currentLevel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/levels")}
              className="flex items-center gap-1 text-[12px] font-bold hover:opacity-70 transition-opacity"
              style={{ color: "#f97316" }}
            >
              Boost <ChevronRight size={12} />
            </button>
          </div>
        )}
      </motion.div>

    </div>
  );
}
