import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useGetWallet, useGetReferrals, useLogout } from "@workspace/api-client-react";
import {
  Copy, CheckCheck, Calendar, ShieldCheck, Users,
  Lock, ChevronRight, Layers, LogOut, Hash, User,
  Wallet, Star, ArrowUpRight,
} from "lucide-react";
import { GemIcon } from "@/components/GemIcon";
import { formatGems } from "@/lib/utils";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          notify.copied();
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
      style={{
        background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
        border: copied ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.08)",
        color: copied ? "#4ade80" : "rgba(255,255,255,0.35)",
      }}
    >
      {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InfoRow({
  icon, label, value, mono = false, valueNode, noBorder = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  mono?: boolean;
  valueNode?: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3.5"
      style={noBorder ? {} : { borderBottom: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.12em] text-white/25 font-semibold">{label}</p>
        {valueNode ?? (
          <p className={`text-[13px] font-semibold mt-0.5 text-white leading-tight ${mono ? "font-mono tracking-wider" : ""}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const [, navigate]           = useLocation();
  const queryClient            = useQueryClient();
  const { data: user }         = useGetMe();
  const { data: wallet }       = useGetWallet();
  const { data: referralData } = useGetReferrals();
  const { mutate: logout }     = useLogout();

  if (!user) return null;

  const isVerified  = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;
  const verifiedAt  = (wallet as any)?.verifiedAt ?? (user as any)?.kycVerifiedAt ?? null;
  const gemBalance  = wallet?.gemsBalance ?? 0;
  const ptcBalance  = wallet?.etrBalance ?? 0;
  const usdtBalance = wallet?.usdtBalance ?? 0;
  const initials    = user.username.slice(0, 2).toUpperCase();
  const level       = (user as any).currentLevel ?? 0;

  const LEVEL_NAMES = [
    "Free Node", "Miner I", "Miner II", "Miner III",
    "Senior Miner", "Master Miner", "Elite Miner", "Sovereign",
  ];

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

      {/* ═══════════ HERO ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(249,115,22,0.07)" }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(124,58,237,0.05)" }} />

        <div className="relative p-5">
          {/* Avatar row */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-black select-none"
                style={{
                  background: "linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.08) 100%)",
                  border: "1px solid rgba(249,115,22,0.25)",
                  color: "#f97316",
                }}
              >
                {initials}
              </div>
              {isVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "#16a34a", border: "2px solid #0d0e15" }}>
                  <ShieldCheck size={12} color="#fff" strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight leading-none">{user.username}</h2>
                {user.isAdmin && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-white/25 mt-1">ID #{user.id}</p>

              {/* Status badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={
                    isVerified
                      ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  <ShieldCheck size={9} />
                  {isVerified ? "Verified" : "Unverified"}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={
                    user.isActive
                      ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                      : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }
                  }
                >
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{ background: user.isActive ? "#4ade80" : "#fbbf24" }} />
                  {user.isActive ? "Active" : "Inactive"}
                </span>
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.18)" }}>
                  <Star size={8} /> {LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]}
                </span>
              </div>
            </div>
          </div>

          {/* Balance strip */}
          <div
            className="grid grid-cols-3 gap-2 mt-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}
          >
            {[
              {
                label: "Gems",
                value: formatGems(gemBalance),
                icon: <GemIcon size={13} />,
                accent: true,
              },
              {
                label: "PTC",
                value: ptcBalance.toFixed(2),
                icon: <img src="/images/etr-logo.png" alt="PTC" className="w-3.5 h-3.5 rounded-full" />,
                accent: false,
              },
              {
                label: "USDT",
                value: `$${usdtBalance.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                icon: <img src="/images/usdt-logo.png" alt="USDT" className="w-3.5 h-3.5 rounded-full" />,
                accent: false,
              },
            ].map((b, i) => (
              <div
                key={i}
                className="rounded-2xl px-3 py-3 flex flex-col gap-1.5"
                style={
                  b.accent
                    ? {
                        background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.04) 100%)",
                        border: "1px solid rgba(249,115,22,0.18)",
                      }
                    : {
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }
                }
              >
                <div className="flex items-center gap-1.5">
                  {b.icon}
                  <span className="text-[9px] uppercase tracking-[0.15em] text-white/25 font-semibold">{b.label}</span>
                </div>
                <span
                  className="text-sm font-black font-mono leading-none"
                  style={{ color: b.accent ? "#f97316" : "#fff" }}
                >
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════ ACCOUNT DETAILS ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Section header */}
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Account Information</p>
        </div>

        <div className="px-5 pb-2">
          <InfoRow
            icon={<User size={13} />}
            label="Username"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-white">{user.username}</span>
                <CopyBtn text={user.username} />
              </div>
            }
          />
          <InfoRow
            icon={<Hash size={13} />}
            label="User ID"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold font-mono text-white/70">#{user.id}</span>
                <CopyBtn text={String(user.id)} />
              </div>
            }
          />
          <InfoRow
            icon={<Calendar size={13} />}
            label="Member Since"
            value={format(new Date(user.createdAt), "MMMM d, yyyy")}
          />
          <InfoRow
            icon={<Star size={13} />}
            label="Mining Level"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-white">
                  Level {level} — {LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)]}
                </span>
              </div>
            }
          />
          <InfoRow
            icon={<ShieldCheck size={13} />}
            label="Verification Status"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                {isVerified ? (
                  <>
                    <span className="text-[13px] font-semibold" style={{ color: "#4ade80" }}>Verified</span>
                    {verifiedAt && (
                      <span className="text-[10px] text-white/25">
                        · {format(new Date(verifiedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => navigate("/verify")}
                    className="flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: "#f97316" }}
                  >
                    Not verified — Mint badge <ArrowUpRight size={11} />
                  </button>
                )}
              </div>
            }
          />
          <InfoRow
            icon={<Users size={13} />}
            label="Referral Network"
            valueNode={
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[13px] font-semibold text-white">
                  {referralData?.totalReferrals ?? 0} member{(referralData?.totalReferrals ?? 0) !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => navigate("/referral")}
                  className="flex items-center gap-0.5 text-[10px] font-semibold"
                  style={{ color: "#f97316" }}
                >
                  View <ArrowUpRight size={9} />
                </button>
              </div>
            }
          />
          <InfoRow
            icon={<Wallet size={13} />}
            label="Total Deposited"
            value={`$${((user as any).totalDepositUsdt ?? 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
          />
          <InfoRow
            icon={<Lock size={13} />}
            label="Recovery Question"
            value={user.recoveryQuestion}
            noBorder
          />
        </div>
      </motion.div>

      {/* ═══════════ QUICK LINKS ═══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold">Quick Actions</p>
        </div>
        {[
          ...(!isVerified
            ? [{
                icon: <ShieldCheck size={15} style={{ color: "#f97316" }} />,
                title: "Mint Verification Badge",
                sub: "Unlock withdrawals · 20 PTC",
                accent: true,
                action: () => navigate("/verify"),
              }]
            : []
          ),
          {
            icon: <Layers size={15} className="text-white/40" />,
            title: "Mining Levels",
            sub: "Upgrade your mining tier",
            accent: false,
            action: () => navigate("/levels"),
          },
          {
            icon: <Users size={15} className="text-white/40" />,
            title: "Referral Program",
            sub: "View your team & commissions",
            accent: false,
            action: () => navigate("/referral"),
          },
        ].map((item, i, arr) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
            style={i < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : {}}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={
                item.accent
                  ? { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight">{item.title}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{item.sub}</p>
            </div>
            <ChevronRight size={14} className="text-white/20 shrink-0" />
          </button>
        ))}
      </motion.div>

      {/* ═══════════ SIGN OUT ══════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110"
          style={{
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.12)",
            color: "rgba(239,68,68,0.65)",
          }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </motion.div>

    </div>
  );
}
