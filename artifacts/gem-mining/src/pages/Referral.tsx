import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notify";
import { useGetReferrals, useClaimReferralGems } from "@workspace/api-client-react";
import type { ReferralUser } from "@workspace/api-client-react";
import { formatGems } from "@/lib/utils";
import {
  Users, Copy, Share2, Lock, Unlock, CheckCircle2,
  XCircle, ChevronDown, Gem, Shield, TrendingUp, Network,
  AlertTriangle, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { GemIcon } from "@/components/GemIcon";
import { cn } from "@/lib/utils";

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, locked }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode;
  accent?: "orange" | "green" | "blue" | "red"; locked?: boolean;
}) {
  const colors = {
    orange: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.18)", icon: "rgba(249,115,22,0.8)", text: "#f97316" },
    green:  { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)",  icon: "rgba(74,222,128,0.8)", text: "#4ade80" },
    blue:   { bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)",  icon: "rgba(96,165,250,0.8)", text: "#60a5fa" },
    red:    { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", icon: "rgba(248,113,113,0.8)", text: "#f87171" },
  };
  const c = colors[accent ?? "orange"];

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${c.border}` }}>
        <span style={{ color: c.icon }}>{icon}</span>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.16em] text-white/25 font-semibold">{label}</p>
        <p className="text-xl font-black font-mono tabular-nums mt-0.5" style={{ color: c.text }}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
      {locked && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <Lock size={10} style={{ color: "rgba(248,113,113,0.7)" }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(248,113,113,0.7)" }}>Locked</span>
        </div>
      )}
    </div>
  );
}

// ─── Referral User Row ─────────────────────────────────────────────────────────
function ReferralRow({ user, level }: { user: ReferralUser; level: 1 | 2 }) {
  const isFullyUnlocked = user.isKycVerified;
  const hasClaimable = user.claimableGems > 0;
  const hasLocked = user.lockedGems > 0;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl transition-all"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>

      {/* KYC status indicator */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: isFullyUnlocked ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.08)",
          border: `1px solid ${isFullyUnlocked ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.15)"}`,
        }}>
        {isFullyUnlocked
          ? <CheckCircle2 size={16} style={{ color: "#4ade80" }} />
          : <XCircle size={16} style={{ color: "rgba(248,113,113,0.7)" }} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{user.username}</p>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: level === 1 ? "rgba(249,115,22,0.12)" : "rgba(96,165,250,0.12)",
              color: level === 1 ? "#f97316" : "#60a5fa",
              border: `1px solid ${level === 1 ? "rgba(249,115,22,0.2)" : "rgba(96,165,250,0.2)"}`,
            }}>
            L{level}
          </span>
          {user.isActive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.15)" }}>
              Mining
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/30 mt-0.5">
          {isFullyUnlocked ? "KYC Verified" : "Not Verified"} · Joined {format(new Date(user.joinedAt), "MMM d, yyyy")}
        </p>
      </div>

      {/* Gem rewards */}
      <div className="shrink-0 text-right space-y-1">
        {hasClaimable && (
          <div className="flex items-center gap-1 justify-end">
            <GemIcon size={10} />
            <span className="text-[11px] font-black font-mono" style={{ color: "#4ade80" }}>
              +{formatGems(user.claimableGems)}
            </span>
            <Unlock size={9} style={{ color: "rgba(74,222,128,0.6)" }} />
          </div>
        )}
        {hasLocked && (
          <div className="flex items-center gap-1 justify-end">
            <GemIcon size={10} />
            <span className="text-[11px] font-black font-mono" style={{ color: "rgba(248,113,113,0.7)" }}>
              {formatGems(user.lockedGems)}
            </span>
            <Lock size={9} style={{ color: "rgba(248,113,113,0.5)" }} />
          </div>
        )}
        {!hasClaimable && !hasLocked && (
          <span className="text-[10px] text-white/20">No rewards yet</span>
        )}
      </div>
    </div>
  );
}

// ─── Level Section ─────────────────────────────────────────────────────────────
function LevelSection({ level, users, label, commissionRate }: {
  level: 1 | 2; users: ReferralUser[]; label: string; commissionRate: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!users.length) return (
    <div className="rounded-3xl p-5 text-center"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {level === 1 ? <Users size={16} className="text-white/25" /> : <Network size={16} className="text-white/25" />}
      </div>
      <p className="text-sm font-semibold text-white/30">{label}</p>
      <p className="text-xs text-white/20 mt-1">No referrals yet · Share your link to grow your network</p>
    </div>
  );

  return (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: level === 1 ? "rgba(249,115,22,0.1)" : "rgba(96,165,250,0.1)",
              border: `1px solid ${level === 1 ? "rgba(249,115,22,0.2)" : "rgba(96,165,250,0.2)"}`,
            }}>
            {level === 1
              ? <Users size={14} style={{ color: "#f97316" }} />
              : <Network size={14} style={{ color: "#60a5fa" }} />}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">{label}</p>
            <p className="text-[10px] text-white/30">{users.length} member{users.length !== 1 ? "s" : ""} · {commissionRate} USDT commission</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full"
            style={{
              background: level === 1 ? "rgba(249,115,22,0.12)" : "rgba(96,165,250,0.12)",
              color: level === 1 ? "#f97316" : "#60a5fa",
            }}>
            {users.length}
          </span>
          <ChevronDown size={14} className={cn("text-white/30 transition-transform duration-200", expanded && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-3 space-y-2">
                {users.map((u) => (
                  <ReferralRow key={u.username} user={u} level={level} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Referral() {
  const queryClient = useQueryClient();
  const { data: refData, isLoading } = useGetReferrals();
  const { mutate: claimGems, isPending: isClaiming } = useClaimReferralGems();

  const handleCopy = () => {
    if (!refData) return;
    const link = `${window.location.origin}/signup?ref=${refData.referralCode}`;
    navigator.clipboard.writeText(link);
    notify.referralCopied();
  };

  const handleClaimGems = () => {
    claimGems(undefined, {
      onSuccess: (res) => {
        notify.referralGemsClaimed(formatGems(res.claimedGems));
        queryClient.invalidateQueries();
      },
      onError: (err: any) => notify.error("Claim Failed", err.error || "Could not claim your referral gems. Please try again."),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 rounded-full"
            style={{ border: "2px solid rgba(249,115,22,0.15)", borderTopColor: "#f97316" }} />
          <p className="text-[11px] uppercase tracking-widest text-white/20 font-semibold">Loading Network…</p>
        </div>
      </div>
    );
  }

  if (!refData) return null;

  const hasClaimable = refData.totalClaimableGems > 0;
  const hasLocked = refData.totalLockedGems > 0;
  const uplineVerified = refData.uplineIsVerified;
  const referralLink = `${window.location.origin}/signup?ref=${refData.referralCode}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 pb-28 md:pb-8 space-y-3">

      {/* ── Hero / Claim Card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: `1px solid ${hasClaimable ? "rgba(74,222,128,0.22)" : "rgba(249,115,22,0.18)"}`,
          boxShadow: hasClaimable
            ? "0 0 50px rgba(74,222,128,0.07), 0 20px 40px rgba(0,0,0,0.4)"
            : "0 0 50px rgba(249,115,22,0.06), 0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: hasClaimable ? "rgba(74,222,128,0.06)" : "rgba(249,115,22,0.06)" }} />

        <div className="px-5 pt-5 pb-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <Share2 size={18} style={{ color: "#f97316" }} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-semibold">Referral Network</p>
              <p className="text-base font-black text-white">Peridot Commission Tree</p>
            </div>
            {uplineVerified && (
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                <Shield size={12} style={{ color: "#4ade80" }} />
                <span className="text-[10px] font-black" style={{ color: "#4ade80" }}>Verified</span>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <StatCard label="Direct Refs" value={refData.level1.length} sub="Level 1 · 15% USDT" icon={<Users size={16} />} accent="orange" />
            <StatCard label="Network Refs" value={refData.level2.length} sub="Level 2 · 5% USDT" icon={<Network size={16} />} accent="blue" />
            <StatCard
              label="Claimable Gems"
              value={formatGems(refData.totalClaimableGems)}
              sub={hasClaimable ? "Ready to claim now" : "Mine & verify to earn"}
              icon={<Unlock size={16} />}
              accent="green"
            />
            <StatCard
              label="Locked Gems"
              value={formatGems(refData.totalLockedGems)}
              sub="Requires KYC on both"
              icon={<Lock size={16} />}
              accent="red"
              locked={hasLocked}
            />
          </div>

          {/* Claim button — only shown if there are claimable gems */}
          {hasClaimable ? (
            <motion.button
              onClick={handleClaimGems}
              disabled={isClaiming}
              whileTap={{ scale: 0.97 }}
              className="w-full relative flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px] overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)",
                boxShadow: "0 6px 28px rgba(74,222,128,0.35)",
                color: "#fff",
              }}
            >
              {!isClaiming && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1.5 }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }}
                />
              )}
              {isClaiming ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                    style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  Claiming…
                </>
              ) : (
                <><Sparkles size={16} /> Claim {formatGems(refData.totalClaimableGems)} Referral Gems</>
              )}
            </motion.button>
          ) : !uplineVerified ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}>
              <AlertTriangle size={16} style={{ color: "rgba(248,113,113,0.8)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-bold text-white">Verify Your Account First</p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  You must mint your KYC Verification Badge (20 PTC) to claim referral gems and receive USDT commissions. Your referees' gem rewards are held safely until you verify.
                </p>
              </div>
            </div>
          ) : hasLocked ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <Lock size={15} style={{ color: "rgba(249,115,22,0.8)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-bold text-white">Gems Locked — Waiting on Referees</p>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  You are verified! Locked gems are held until each referee also completes KYC verification. Encourage your referrals to mint their verification badge.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <TrendingUp size={15} className="text-white/30 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Share your referral link below. When your referrals mine and claim gems, your commission accumulates here. Both parties must be KYC verified to unlock gem rewards.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Referral Link ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl p-5"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-3">Your Referral Link</p>

        {/* Code badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/40">Code:</span>
          <span className="font-black font-mono text-sm px-3 py-1 rounded-xl"
            style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
            {refData.referralCode}
          </span>
        </div>

        {/* Link input */}
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 rounded-2xl font-mono text-xs text-white/50 truncate"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {referralLink}
          </div>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #ea6c10 0%, #f97316 100%)",
              boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
              color: "#fff",
            }}
          >
            <Copy size={14} /> Copy
          </motion.button>
        </div>

        {/* Commission info */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { label: "Level 1 USDT", value: "15%", desc: "Direct referral deposits" },
            { label: "Level 2 USDT", value: "5%", desc: "Network referral deposits" },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5 rounded-xl text-center"
              style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">{item.label}</p>
              <p className="text-lg font-black" style={{ color: "#f97316" }}>{item.value}</p>
              <p className="text-[9px] text-white/25">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Commission Rules ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="rounded-3xl p-5"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-3">How Commissions Work</p>
        <div className="space-y-3">
          {[
            {
              icon: <Unlock size={14} style={{ color: "#4ade80" }} />,
              title: "USDT Commission (Instant)",
              desc: "When your referral deposits USDT, you receive 15% directly — only if you are KYC verified. If not, commission bubbles up to the next verified upline.",
              color: "rgba(74,222,128,0.12)",
              border: "rgba(74,222,128,0.18)",
            },
            {
              icon: <GemIcon size={14} />,
              title: "Gem Rewards (KYC-Gated)",
              desc: "You earn 10% of your referral's mined gems each session. These are locked until BOTH you and your referral have completed KYC verification.",
              color: "rgba(249,115,22,0.08)",
              border: "rgba(249,115,22,0.15)",
            },
            {
              icon: <Lock size={14} style={{ color: "rgba(248,113,113,0.7)" }} />,
              title: "Unverified Referral",
              desc: "If your referral is not KYC verified, their gem rewards accumulate locked in your account. Once they verify, gems unlock and become claimable.",
              color: "rgba(248,113,113,0.06)",
              border: "rgba(248,113,113,0.12)",
            },
          ].map((rule, i) => (
            <div key={i} className="flex gap-3 p-3.5 rounded-2xl"
              style={{ background: rule.color, border: `1px solid ${rule.border}` }}>
              <div className="shrink-0 mt-0.5">{rule.icon}</div>
              <div>
                <p className="text-xs font-bold text-white">{rule.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Level 1 Network ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <LevelSection
          level={1}
          users={refData.level1}
          label="Direct Referrals (L1)"
          commissionRate="15%"
        />
      </motion.div>

      {/* ── Level 2 Network ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <LevelSection
          level={2}
          users={refData.level2}
          label="Network Referrals (L2)"
          commissionRate="5%"
        />
      </motion.div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-3xl px-5 py-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-[9px] uppercase tracking-widest text-white/20 font-semibold mb-3">Legend</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <CheckCircle2 size={12} style={{ color: "#4ade80" }} />, label: "KYC Verified" },
            { icon: <XCircle size={12} style={{ color: "rgba(248,113,113,0.7)" }} />, label: "Not Verified" },
            { icon: <Unlock size={12} style={{ color: "#4ade80" }} />, label: "Claimable Gems" },
            { icon: <Lock size={12} style={{ color: "rgba(248,113,113,0.6)" }} />, label: "Locked Gems" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.icon}
              <span className="text-[11px] text-white/35">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
