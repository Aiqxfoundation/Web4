import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useGetLevels, useGetReferrals, useGetWallet, useApplyReferral } from "@workspace/api-client-react";
import {
  Copy, CheckCheck, Calendar, ShieldCheck, Users, TrendingUp,
  Crown, Share2, Lock, ChevronRight, Activity, Award, Pickaxe, UserPlus,
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { formatGems } from "@/lib/utils";

const LEVEL_THEMES = [
  { accent: "#94a3b8", label: "Shadow"  },
  { accent: "#f97316", label: "Fire"    },
  { accent: "#22c55e", label: "Nature"  },
  { accent: "#38bdf8", label: "Storm"   },
  { accent: "#a855f7", label: "Void"    },
  { accent: "#67e8f9", label: "Ice"     },
  { accent: "#fbbf24", label: "Gold"    },
  { accent: "#f43f5e", label: "Rainbow" },
];

const LEVEL_NAMES = [
  "Shadow Initiate", "Fire Starter", "Nature Walker", "Storm Chaser",
  "Shadow Raider", "Ice Breaker", "Gold Sovereign", "Rainbow Emperor",
];

function fmtUSDT(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }); }}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} className="text-white/35" />}
    </button>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {children}
    </motion.div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
        <span style={{ color: "rgba(249,115,22,0.7)" }}>{icon}</span>
      </div>
      <div>
        <p className="text-[13px] font-bold text-white leading-none">{title}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Profile() {
  const [, navigate]            = useLocation();
  const queryClient             = useQueryClient();
  const { data: user }          = useGetMe();
  const { data: levelsData }    = useGetLevels();
  const { data: referralData }  = useGetReferrals();
  const { data: wallet }        = useGetWallet();
  const { mutate: applyReferral, isPending: isApplying } = useApplyReferral();
  const [refCodeInput, setRefCodeInput] = useState("");

  if (!user) return null;

  const hasReferrer = !!(user as any).referredByUserId;

  const handleApplyReferral = () => {
    const code = refCodeInput.trim();
    if (!code) { toast.error("Please enter a referral code"); return; }
    applyReferral({ referralCode: code }, {
      onSuccess: (res: any) => {
        toast.success(res.message);
        setRefCodeInput("");
        queryClient.invalidateQueries();
      },
      onError: (err: any) => toast.error(err?.data?.error || err?.message || "Failed to apply referral code"),
    });
  };

  const isVerified     = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt     = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;
  const currentLevel   = levelsData?.currentLevel ?? 0;
  const theme          = LEVEL_THEMES[currentLevel] ?? LEVEL_THEMES[0];
  const currentDef     = levelsData?.levelDefinitions?.[currentLevel];
  const nextDef        = levelsData?.levelDefinitions?.[currentLevel + 1] ?? null;
  const totalPower     = levelsData?.totalMiningPower ?? 0;
  const isFree         = currentLevel === 0;
  const initials       = user.username.slice(0, 2).toUpperCase();
  const annualEarnings = currentDef?.returnMultiplier && totalPower > 0 ? totalPower * currentDef.returnMultiplier : null;
  const referralLink   = referralData ? `${window.location.origin}/signup?ref=${referralData.referralCode}` : "";

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 md:pb-8 space-y-3">

      {/* ── Identity Hero ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: `1px solid ${theme.accent}28`,
          boxShadow: `0 0 60px ${theme.accent}0d, 0 20px 40px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${theme.accent}0c` }} />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${theme.accent}08` }} />

        <div className="relative z-10 p-5">
          {/* Avatar row */}
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[1.8rem] font-black select-none"
                style={{ background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}0a)`, border: `1.5px solid ${theme.accent}35`, color: theme.accent, textShadow: `0 0 24px ${theme.accent}50` }}>
                {initials}
              </div>
              {/* Level pip */}
              <div className="absolute -bottom-2 -right-2 px-2 h-6 rounded-lg flex items-center text-[10px] font-black text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)` }}>
                {isFree ? "FREE" : `LV ${currentLevel}`}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-black text-white tracking-tight">{user.username}</h2>
                {user.isAdmin && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase tracking-wider">Admin</span>
                )}
              </div>
              <p className="text-[11px] text-white/25 font-mono mb-2">ID #{user.id}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}28`, color: theme.accent }}>
                  {isFree ? null : <Crown size={9} />}
                  {LEVEL_NAMES[currentLevel]}
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isActive ? "text-emerald-400" : "text-amber-400"}`}
                  style={{ background: user.isActive ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)", border: user.isActive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(251,191,36,0.2)" }}>
                  <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ boxShadow: user.isActive ? "0 0 5px #4ade80" : "0 0 5px #fbbf24" }} />
                  {user.isActive ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 16 }}>
            {[
              { label: "Power", value: isFree ? "Free" : `$${totalPower.toLocaleString()}`, icon: <Activity size={10} />, accent: theme.accent },
              { label: "Gems",  value: formatGems(wallet?.gemsBalance ?? 0), icon: <GemIcon size={10} />, accent: "#f97316" },
              { label: "Annual", value: annualEarnings ? fmtUSDT(annualEarnings) : "—", icon: <TrendingUp size={10} />, accent: "#22c55e" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-3 flex flex-col gap-1.5"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1.5" style={{ color: s.accent }}>
                  {s.icon}
                  <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">{s.label}</span>
                </div>
                <span className="text-sm font-black text-white leading-none font-mono">{s.value}</span>
              </div>
            ))}
          </div>

          {/* Current level / next upgrade */}
          {currentDef && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `radial-gradient(circle, ${theme.accent}18, transparent 70%)`, border: `1px solid ${theme.accent}20` }}>
                {isFree ? <Pickaxe size={18} style={{ color: theme.accent, opacity: 0.6 }} />
                  : <img src={currentDef.pickaxeImage} alt={currentDef.name} className="w-9 h-9 object-contain" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest text-white/22 mb-0.5">Active Tier</p>
                <p className="text-sm font-bold text-white">{currentDef.name}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {isFree ? "Free · invest to unlock mining power" : `${currentDef.returnMultiplier}× annual return`}
                </p>
              </div>
              {nextDef && (
                <button onClick={() => navigate("/levels")} className="shrink-0 flex items-center gap-1 text-[11px] font-bold hover:opacity-70 transition-opacity"
                  style={{ color: "#f97316" }}>
                  Upgrade <ChevronRight size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Verification ──────────────────────────────────────────────────── */}
      <Section delay={0.06}>
        {isVerified ? (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[13px] font-bold text-white">Verified Account</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-400"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>✓ Verified</span>
              </div>
              <p className="text-[11px] text-white/30">
                {verifiedAt ? `Minted ${format(new Date(verifiedAt), "MMM d, yyyy")}` : "USDT withdrawals & ETR transfers unlocked"}
              </p>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ShieldCheck size={20} className="text-white/25" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Mint Verification Badge</p>
              <p className="text-[11px] text-white/30 mt-0.5">Unlock USDT withdrawals & ETR transfers · 20 ETR</p>
            </div>
            <ChevronRight size={14} className="text-white/20 shrink-0" />
          </button>
        )}
      </Section>

      {/* ── Apply Referral Code (only if not yet referred) ─────────────── */}
      {!hasReferrer && (
        <Section delay={0.09}>
          <SectionHeader icon={<UserPlus size={14} />} title="Apply Referral Code" sub="Link your account to a referrer" />
          <div className="p-5 space-y-3">
            <p className="text-[11px] text-white/35 leading-relaxed">
              You signed up without a referral code. You can still apply one now to become part of someone's network.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter referral code"
                value={refCodeInput}
                onChange={e => setRefCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleApplyReferral()}
                maxLength={16}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 uppercase tracking-widest"
              />
              <button
                onClick={handleApplyReferral}
                disabled={isApplying || !refCodeInput.trim()}
                className="px-4 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #ea6c10 0%, #f97316 100%)" }}
              >
                {isApplying ? "..." : "Apply"}
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ── Referrals ─────────────────────────────────────────────────────── */}
      {referralData && (
        <Section delay={0.09}>
          <SectionHeader icon={<Share2 size={14} />} title="Referral Program" sub="Earn rewards for every friend you invite" />
          <div className="p-5 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Users size={15} className="text-orange-400" />, label: "Total Referrals", value: String(referralData.totalReferrals), bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.15)" },
                { icon: <Award size={15} className="text-amber-400" />, label: "Gems Earned", value: formatGems(referralData.totalRewardGems), bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.15)" },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.06)" }}>{s.icon}</div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-white/30">{s.label}</p>
                    <p className="text-xl font-black text-white leading-none font-mono">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Commission rates */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Direct", rate: "15%", sub: "Level 1", color: "#22c55e" },
                { label: "Indirect", rate: "5%", sub: "Level 2", color: "#38bdf8" },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl p-3 text-center"
                  style={{ background: `${c.color}0c`, border: `1px solid ${c.color}25` }}>
                  <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: `${c.color}80` }}>{c.label}</p>
                  <p className="text-2xl font-black" style={{ color: c.color }}>{c.rate}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">{c.sub} commission</p>
                </div>
              ))}
            </div>

            {/* Code & link */}
            {[
              { label: "Referral Code", content: referralData.referralCode, mono: true, large: true },
              { label: "Share Link",    content: referralLink,              mono: true, large: false },
            ].map((r, i) => (
              <div key={i}>
                <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 font-semibold mb-2">{r.label}</p>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className={`flex-1 font-mono text-white truncate ${r.large ? "text-sm font-black tracking-[0.15em]" : "text-xs text-white/40"}`}>
                    {r.content}
                  </span>
                  <CopyBtn text={r.content} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Account Details ─────────────────────────────────────────────── */}
      <Section delay={0.12}>
        <SectionHeader icon={<Activity size={14} />} title="Account Details" />
        <div className="px-5 py-3 space-y-0">
          {[
            { label: "Username",     value: user.username,                             mono: false },
            { label: "User ID",      value: `#${user.id}`,                             mono: true  },
            { label: "Member Since", value: format(new Date(user.createdAt), "MMMM d, yyyy"), mono: false, icon: <Calendar size={11} className="text-white/25" /> },
          ].map((row, i, arr) => (
            <div key={i} className="flex items-center justify-between py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div className="flex items-center gap-2">
                {row.icon}
                <span className="text-xs text-white/35">{row.label}</span>
              </div>
              <span className={`text-xs font-bold ${row.mono ? "font-mono text-white/50" : "text-white"}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <Section delay={0.15}>
        <SectionHeader icon={<Lock size={14} />} title="Security" />
        <div className="p-5">
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Lock size={13} className="text-white/25" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/22 mb-1">Recovery Question</p>
              <p className="text-sm text-white/60 font-medium leading-relaxed">{user.recoveryQuestion}</p>
            </div>
          </div>
          <p className="text-[10px] text-white/18 leading-relaxed px-1 mt-3">
            Your recovery answer is securely hashed. Use it if you forget your password.
          </p>
        </div>
      </Section>

    </div>
  );
}
