import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useGetWallet, useGetReferrals, useApplyReferral, useLogout } from "@workspace/api-client-react";
import { Copy, CheckCheck, Calendar, ShieldCheck, Users, Share2, Lock, ChevronRight, Layers, LogOut, UserPlus } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { formatGems } from "@/lib/utils";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }); }}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/35" />}
    </button>
  );
}

function Row({ label, value, mono = false, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <span className={`text-xs font-bold ${mono ? "font-mono text-white/60" : "text-white"}`}>{value}</span>
    </div>
  );
}

export default function Profile() {
  const [, navigate]           = useLocation();
  const queryClient            = useQueryClient();
  const { data: user }         = useGetMe();
  const { data: wallet }       = useGetWallet();
  const { data: referralData } = useGetReferrals();
  const { mutate: applyReferral, isPending: isApplying } = useApplyReferral();
  const { mutate: logout }     = useLogout();
  const [refCodeInput, setRefCodeInput] = useState("");

  if (!user) return null;

  const isVerified   = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt   = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;
  const gemBalance   = wallet?.gemsBalance ?? 0;
  const ptcBalance   = wallet?.etrBalance ?? 0;
  const usdtBalance  = wallet?.usdtBalance ?? 0;
  const hasReferrer  = !!(user as any).referredByUserId;
  const referralCode = referralData?.referralCode;
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";
  const initials     = user.username.slice(0, 2).toUpperCase();

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

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        localStorage.removeItem("etr_token");
        navigate("/login");
      },
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 space-y-3">

      {/* ── Avatar & Name ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-5"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(249,115,22,0.07)" }} />

        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[1.6rem] font-black select-none shrink-0"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">{user.username}</h2>
              {user.isAdmin && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/30 font-mono">ID #{user.id}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {isVerified ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <ShieldCheck size={9} /> Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-white/25 px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Unverified
                </span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.isActive ? "text-emerald-400" : "text-amber-400"}`}
                style={{ background: user.isActive ? "rgba(34,197,94,0.1)" : "rgba(251,191,36,0.1)", border: user.isActive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(251,191,36,0.2)" }}>
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Balance row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { label: "Gems", value: formatGems(gemBalance), icon: <GemIcon size={12} />, color: "#f97316" },
            { label: "PTC", value: ptcBalance.toFixed(2), icon: <img src="/images/etr-logo.png" alt="PTC" className="w-3 h-3 rounded-full" />, color: "white" },
            { label: "USDT", value: `$${usdtBalance.toFixed(2)}`, icon: <img src="/images/usdt-logo.png" alt="USDT" className="w-3 h-3 rounded-full" />, color: "white" },
          ].map((b, i) => (
            <div key={i} className="rounded-2xl p-3 flex flex-col gap-1.5"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1.5">{b.icon}<span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">{b.label}</span></div>
              <span className="text-sm font-black font-mono leading-none" style={{ color: b.color }}>{b.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="grid grid-cols-2 gap-2">
        {!isVerified && (
          <button onClick={() => navigate("/verify")}
            className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-left transition-all hover:bg-white/[0.03]"
            style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}>
            <ShieldCheck size={15} style={{ color: "#f97316", flexShrink: 0 }} />
            <div>
              <p className="text-xs font-bold text-white">Get Verified</p>
              <p className="text-[10px] text-white/35">Unlock withdrawals</p>
            </div>
          </button>
        )}
        <button onClick={() => navigate("/levels")}
          className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-left transition-all hover:bg-white/[0.03]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Layers size={15} className="text-white/40 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">Mining Levels</p>
            <p className="text-[10px] text-white/35">Upgrade your tier</p>
          </div>
        </button>
        <button onClick={() => navigate("/referral")}
          className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-left transition-all hover:bg-white/[0.03] ${!isVerified ? "" : "col-span-1"}`}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Users size={15} className="text-white/40 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">Referrals</p>
            <p className="text-[10px] text-white/35">View network</p>
          </div>
        </button>
      </motion.div>

      {/* ── Verification Status ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {isVerified ? (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Verified Account</p>
              <p className="text-[11px] text-white/30 mt-0.5">
                {verifiedAt ? `Verified ${format(new Date(verifiedAt), "MMM d, yyyy")}` : "Withdrawals & PTC transfers unlocked"}
              </p>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ShieldCheck size={18} className="text-white/25" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white">Mint Verification Badge</p>
              <p className="text-[11px] text-white/30 mt-0.5">Unlock withdrawals & PTC transfers · 20 PTC</p>
            </div>
            <ChevronRight size={14} className="text-white/20 shrink-0" />
          </button>
        )}
      </motion.div>

      {/* ── Referral Code ────────────────────────────────────────────── */}
      {referralData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <Share2 size={14} style={{ color: "rgba(249,115,22,0.7)" }} />
              <p className="text-[12px] font-bold text-white">Referral Program</p>
              <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                {referralData.totalReferrals} members
              </span>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {/* Code */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Your Code</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <span className="flex-1 font-mono text-sm font-black tracking-[0.15em]" style={{ color: "#f97316" }}>
                  {referralData.referralCode}
                </span>
                <CopyBtn text={referralData.referralCode} />
              </div>
            </div>
            {/* Link */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">Share Link</p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="flex-1 font-mono text-xs text-white/35 truncate">{referralLink}</span>
                <CopyBtn text={referralLink} />
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "L1 · Direct", rate: "15% USDT", color: "#22c55e" },
                { label: "L2 · Network", rate: "5% USDT", color: "#38bdf8" },
              ].map((c, i) => (
                <div key={i} className="rounded-xl p-2.5 text-center"
                  style={{ background: `${c.color}0a`, border: `1px solid ${c.color}22` }}>
                  <p className="text-[9px] text-white/30 mb-0.5">{c.label}</p>
                  <p className="text-sm font-black" style={{ color: c.color }}>{c.rate}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Apply Referral Code ──────────────────────────────────────── */}
      {!hasReferrer && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <UserPlus size={14} style={{ color: "rgba(249,115,22,0.7)" }} />
              <p className="text-[12px] font-bold text-white">Have a Referral Code?</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter code"
                value={refCodeInput}
                onChange={e => setRefCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleApplyReferral()}
                maxLength={16}
                className="flex-1 rounded-xl px-4 py-2.5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none uppercase tracking-widest"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              />
              <button
                onClick={handleApplyReferral}
                disabled={isApplying || !refCodeInput.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #ea6c10 0%, #f97316 100%)" }}
              >
                {isApplying ? "…" : "Apply"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Account Info ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <p className="px-5 pt-4 text-[10px] uppercase tracking-widest text-white/25 font-semibold">Account Details</p>
        <div className="px-5 pb-2">
          <Row label="Username" value={user.username} />
          <Row label="User ID" value={`#${user.id}`} mono />
          <Row label="Member Since" value={format(new Date(user.createdAt), "MMM d, yyyy")}
            icon={<Calendar size={11} className="text-white/25" />} />
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2">
              <Lock size={11} className="text-white/25" />
              <span className="text-xs text-white/40">Recovery Question</span>
            </div>
            <span className="text-xs text-white/50 text-right max-w-[180px] truncate font-medium">{user.recoveryQuestion}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Sign Out ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-400/70 hover:text-red-400 transition-all"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </motion.div>

    </div>
  );
}
