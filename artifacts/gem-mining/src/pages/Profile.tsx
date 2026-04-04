import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  useGetMe,
  useGetLevels,
  useGetReferrals,
  useGetWallet,
} from "@workspace/api-client-react";
import {
  Copy,
  CheckCheck,
  Calendar,
  Shield,
  ShieldCheck,
  Users,
  TrendingUp,
  Zap,
  Crown,
  Share2,
  Lock,
  Star,
  ChevronRight,
  Activity,
  Award,
} from "lucide-react";

// ── Level theme map ───────────────────────────────────────────────────────────
const LEVEL_THEMES = [
  { accent: "#94a3b8", bg: "#0f1117", ring: "rgba(148,163,184,0.25)", label: "Shadow"  },
  { accent: "#f97316", bg: "#1a0900", ring: "rgba(249,115,22,0.3)",   label: "Fire"    },
  { accent: "#22c55e", bg: "#001408", ring: "rgba(34,197,94,0.25)",   label: "Nature"  },
  { accent: "#38bdf8", bg: "#00101a", ring: "rgba(56,189,248,0.25)",  label: "Storm"   },
  { accent: "#a855f7", bg: "#0d001a", ring: "rgba(168,85,247,0.3)",   label: "Void"    },
  { accent: "#67e8f9", bg: "#001a1f", ring: "rgba(103,232,249,0.3)",  label: "Ice"     },
  { accent: "#fbbf24", bg: "#1a1000", ring: "rgba(251,191,36,0.3)",   label: "Gold"    },
  { accent: "#f43f5e", bg: "#0d0010", ring: "rgba(244,63,94,0.35)",   label: "Rainbow" },
];

const TIER_LABELS = ["FREE","STARTER","GROWTH","ADVANCED","ELITE","EXPERT","SOVEREIGN","EMPEROR"];

function fmtUSDT(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle}
      className={`flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all active:scale-95 ${small ? "w-7 h-7" : "w-8 h-8"}`}>
      {copied
        ? <CheckCheck size={small ? 12 : 14} className="text-emerald-400" />
        : <Copy size={small ? 12 : 14} className="text-white/40" />}
    </button>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent, icon: Icon }: {
  label: string; value: string; accent: string; icon?: React.ElementType;
}) {
  return (
    <div className="bg-black/30 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={10} style={{ color: accent }} />}
        <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-bold text-white text-sm leading-none" style={{ color: value !== "—" ? "white" : "rgba(255,255,255,0.3)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Main Profile page ─────────────────────────────────────────────────────────
export default function Profile() {
  const [, navigate] = useLocation();
  const { data: user } = useGetMe();
  const { data: levelsData } = useGetLevels();
  const { data: referralData } = useGetReferrals();
  const { data: wallet } = useGetWallet();

  if (!user) return null;

  const isVerified = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;

  const currentLevel = levelsData?.currentLevel ?? 0;
  const theme = LEVEL_THEMES[currentLevel] ?? LEVEL_THEMES[0];
  const currentDef = levelsData?.levelDefinitions?.[currentLevel];
  const nextDef = levelsData?.levelDefinitions?.[currentLevel + 1] ?? null;
  const totalMiningPower = levelsData?.totalMiningPower ?? 0;
  const isFree = currentLevel === 0;

  const monthlyEarnings = currentDef?.returnMultiplier && totalMiningPower > 0
    ? (totalMiningPower * currentDef.returnMultiplier) / 12 : null;
  const annualEarnings = currentDef?.returnMultiplier && totalMiningPower > 0
    ? totalMiningPower * currentDef.returnMultiplier : null;

  const referralLink = referralData
    ? `${window.location.origin}/signup?ref=${referralData.referralCode}`
    : "";

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28 md:pb-8 space-y-4">

      {/* ── Identity hero ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${theme.accent}35`, boxShadow: `0 0 48px ${theme.ring}` }}
      >
        {/* Multi-layer background */}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(145deg, #0a0b10 0%, #111218 60%, ${theme.bg} 100%)` }} />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40"
          style={{ background: theme.ring }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
          style={{ background: theme.ring }} />

        <div className="relative z-10 p-5">
          {/* Top row: avatar + info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0 relative">
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black tracking-tight select-none"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}28, ${theme.accent}08)`,
                  border: `1.5px solid ${theme.accent}40`,
                  color: theme.accent,
                  textShadow: `0 0 20px ${theme.accent}60`,
                }}
              >
                {initials}
              </div>
              {/* Level badge */}
              <div
                className="absolute -bottom-2 -right-2 min-w-[26px] h-[22px] px-1.5 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)` }}
              >
                {currentLevel === 0 ? "FREE" : `L${currentLevel}`}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-black text-white text-xl leading-tight tracking-tight">{user.username}</h2>
                {user.isAdmin && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/25 text-primary uppercase tracking-wider">Admin</span>
                )}
              </div>
              <p className="text-[11px] text-white/30 font-mono">ID #{user.id}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}30`, color: theme.accent }}
                >
                  {currentLevel === 0 ? <Zap size={9} /> : <Crown size={9} />}
                  {TIER_LABELS[currentLevel]} MINER
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                  user.isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ boxShadow: user.isActive ? "0 0 4px #4ade80" : "0 0 4px #fbbf24" }} />
                  {user.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          {/* Mining stats — paid users */}
          {!isFree && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatPill label="Power" value={`$${totalMiningPower.toLocaleString()}`} accent={theme.accent} icon={Activity} />
              <StatPill label="Monthly" value={monthlyEarnings !== null ? fmtUSDT(monthlyEarnings) : "—"} accent="#22c55e" icon={TrendingUp} />
              <StatPill label="Yearly" value={annualEarnings !== null ? fmtUSDT(annualEarnings) : "—"} accent={theme.accent} icon={Star} />
            </div>
          )}

          {/* Free user CTA */}
          {isFree && (
            <div className="mt-4 flex items-start gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300 mb-0.5">Start Earning Today</p>
                <p className="text-[11px] text-amber-300/60 leading-relaxed">
                  Invest $100+ USDT to unlock mining. Earn up to <span className="font-bold text-amber-300">2.5× annually</span> on your investment.
                </p>
              </div>
            </div>
          )}

          {/* Current pickaxe + next level */}
          {currentDef && (
            <div className="mt-4 flex items-center gap-3 bg-black/25 rounded-xl p-3">
              <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: `radial-gradient(circle, ${theme.ring}, transparent 70%)` }}>
                {currentLevel === 0
                  ? <span className="text-xl">⛏️</span>
                  : <img src={currentDef.pickaxeImage} alt={currentDef.name} className="w-9 h-9 object-contain" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Active Pickaxe</p>
                <p className="font-bold text-white text-xs leading-tight">{currentDef.name}</p>
                <p className="text-[10px] text-white/35 mt-0.5">
                  {isFree ? "Free tier — invest to upgrade" : `${currentDef.returnMultiplier}× annual multiplier`}
                </p>
              </div>
              {nextDef && (
                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-white/25 mb-0.5">Next unlock</p>
                  <p className="text-xs font-bold" style={{ color: LEVEL_THEMES[nextDef.level]?.accent }}>
                    ${nextDef.investmentThreshold?.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-white/25">{nextDef.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Verification Badge ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0e0f16", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {isVerified ? (
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm">Verification Badge</p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold uppercase tracking-wider border border-primary/20">
                  Verified
                </span>
              </div>
              <p className="text-[10px] text-white/35 mt-0.5">
                {verifiedAt ? `Minted ${format(new Date(verifiedAt), "MMM d, yyyy")}` : "Active"}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white/25" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Mint Verification Badge</p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Unlock USDT withdrawals & ETR transfers · 20 ETR
              </p>
            </div>
            <ChevronRight size={15} className="text-white/20 shrink-0" />
          </button>
        )}
      </motion.div>

      {/* ── Referral section ──────────────────────────────────────────────── */}
      {referralData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0e0f16", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Share2 size={13} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Referral Program</h3>
                <p className="text-[9px] text-white/30">Earn rewards for every friend you refer</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 uppercase">Referrals</p>
                  <p className="font-black text-white text-xl leading-none">{referralData.totalReferrals}</p>
                </div>
              </div>
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Award size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 uppercase">Gems Earned</p>
                  <p className="font-black text-amber-400 text-xl leading-none">{fmtNum(referralData.totalRewardGems)}</p>
                </div>
              </div>
            </div>

            {/* Referral code */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Your Code</p>
              <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-3 border border-white/5">
                <span className="flex-1 font-mono font-black text-white text-sm tracking-[0.2em]">
                  {referralData.referralCode}
                </span>
                <CopyButton text={referralData.referralCode} small />
              </div>
            </div>

            {/* Referral link */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Share Link</p>
              <div className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2.5 border border-white/5">
                <span className="flex-1 text-[11px] text-white/40 truncate font-mono">{referralLink}</span>
                <CopyButton text={referralLink} small />
              </div>
            </div>

            {/* Commission tiers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative overflow-hidden rounded-xl p-3 text-center"
                style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="text-[8px] text-emerald-400/60 uppercase tracking-widest mb-1">Direct Referral</p>
                <p className="font-black text-emerald-400 text-2xl leading-none">15%</p>
                <p className="text-[9px] text-white/25 mt-1">Level 1 commission</p>
              </div>
              <div className="relative overflow-hidden rounded-xl p-3 text-center"
                style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.04))", border: "1px solid rgba(56,189,248,0.2)" }}>
                <p className="text-[8px] text-sky-400/60 uppercase tracking-widest mb-1">Indirect Referral</p>
                <p className="font-black text-sky-400 text-2xl leading-none">5%</p>
                <p className="text-[9px] text-white/25 mt-1">Level 2 commission</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Account details ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0e0f16", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Shield size={13} className="text-white/40" />
          </div>
          <h3 className="font-bold text-white text-sm">Account Details</h3>
        </div>

        <div className="p-4 space-y-0.5">
          {[
            { label: "Username", value: user.username, mono: false },
            { label: "User ID", value: `#${user.id}`, mono: true },
            {
              label: "Member Since",
              value: format(new Date(user.createdAt), "MMMM d, yyyy"),
              mono: false,
              icon: Calendar,
            },
          ].map((row, i) => (
            <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? "border-b border-white/5" : ""}`}>
              <div className="flex items-center gap-2">
                {row.icon && <row.icon size={11} className="text-white/25" />}
                <span className="text-xs text-white/40">{row.label}</span>
              </div>
              <span className={`text-xs font-bold text-white ${row.mono ? "font-mono text-white/60" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-white/40">Account Status</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              user.isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-amber-400"}`} />
              {user.isActive ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Security ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0e0f16", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
            <Lock size={13} className="text-white/40" />
          </div>
          <h3 className="font-bold text-white text-sm">Security</h3>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={13} className="text-white/25" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Recovery Question</p>
              <p className="text-xs text-white/70 font-medium leading-relaxed">{user.recoveryQuestion}</p>
            </div>
          </div>
          <p className="text-[10px] text-white/20 leading-relaxed px-1">
            Your recovery answer is securely hashed. Use it to regain access if you forget your password.
          </p>
        </div>
      </motion.div>

    </div>
  );
}
