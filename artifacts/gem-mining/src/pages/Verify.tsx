import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useGetWallet, useGetMe } from "@workspace/api-client-react";
import { ArrowLeft, ShieldCheck, Check, ArrowRight, AlertCircle } from "lucide-react";

const ETR_LOGO = "/images/etr-logo.png";
const COST = 20;

const BENEFITS = [
  "USDT withdrawals unlocked",
  "PTC transfers to other users",
  "Verified badge on your profile",
  "Priority withdrawal processing",
];

export default function Verify() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: wallet } = useGetWallet();
  const { data: user } = useGetMe();

  const etrBalance = wallet?.etrBalance ?? 0;
  const isVerified = (wallet as any)?.isVerified ?? (user as any)?.isKycVerified ?? false;

  const [confirming, setConfirming] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const canAfford = etrBalance >= COST;

  const handleMint = async () => {
    setIsPaying(true);
    try {
      const token = localStorage.getItem("etr_token");
      const res = await fetch("/api/verify/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess(true);
      await queryClient.invalidateQueries();
    } catch (err: any) {
      notify.badgeMintError(err.message);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
        style={{ background: "hsl(220 14% 6%)" }}>
        <button onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-sm font-bold text-white">Verification Badge</p>
          <p className="text-[10px] text-white/35">Miner authentication</p>
        </div>
      </div>

      <div className="px-4 py-8 space-y-5">

        {/* Success state */}
        {(isVerified || success) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5"
          >
            <div className="rounded-2xl p-8 text-center space-y-4"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
                <ShieldCheck size={36} className="text-primary" />
              </div>
              <div>
                <p className="text-xl font-black text-white">Verification Badge</p>
                <p className="text-sm text-white/45 mt-1">Your account is fully verified</p>
              </div>
              <div className="space-y-2 text-left">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
                    <Check size={14} className="text-primary shrink-0" />
                    <span className="text-sm text-white/70">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate("/profile")}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-white font-bold text-sm hover:bg-white/[0.09] transition-colors">
              Back to Profile <ArrowRight size={15} />
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Badge preview */}
            <div className="rounded-2xl p-7 text-center space-y-4"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto relative">
                <ShieldCheck size={36} className="text-white/20" />
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin" style={{ animationDuration: "8s" }} />
              </div>
              <div>
                <p className="text-xl font-black text-white">Mint Verification Badge</p>
                <p className="text-sm text-white/45 mt-1 leading-relaxed max-w-56 mx-auto">
                  A one-time badge that unlocks full platform access for verified miners.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="px-5 pt-4 pb-3 text-[10px] text-white/30 uppercase tracking-widest font-semibold border-b border-white/[0.05]">
                What you unlock
              </p>
              <div className="px-5 divide-y divide-white/[0.04]">
                {BENEFITS.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 py-3.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-primary" />
                    </div>
                    <span className="text-sm text-white/70">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost & balance */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">One-time fee</span>
                <div className="flex items-center gap-2">
                  <img src={ETR_LOGO} alt="PTC" className="w-5 h-5 rounded-full" />
                  <span className="text-lg font-black text-white">{COST} PTC</span>
                </div>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Your balance</span>
                <span className={`text-sm font-bold ${canAfford ? "text-white" : "text-white/40"}`}>
                  {etrBalance.toFixed(4)} PTC
                  {canAfford && <span className="text-primary ml-2">✓</span>}
                </span>
              </div>

              {!canAfford && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mt-1">
                  <AlertCircle size={13} className="text-white/30 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">
                    You need {(COST - etrBalance).toFixed(4)} more PTC.
                    Convert your Gems on the <button onClick={() => navigate("/convert")} className="text-primary underline">Convert page</button> to earn PTC.
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                disabled={!canAfford}
                className="w-full py-4 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-105 transition-all"
              >
                Mint Verification Badge — {COST} PTC
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl p-4 bg-white/[0.04] border border-white/[0.08] text-center">
                  <p className="text-sm text-white/70 leading-relaxed">
                    Confirm deduction of <strong className="text-white">{COST} PTC</strong> from your balance to mint the Verification Badge?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => setConfirming(false)}
                    className="py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.09] text-white font-bold text-sm hover:bg-white/[0.09] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleMint} disabled={isPaying}
                    className="py-3.5 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-50 hover:brightness-105 transition-all">
                    {isPaying ? "Minting…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
