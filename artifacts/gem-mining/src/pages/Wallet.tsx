import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetWallet } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { formatCurrency, formatGems, cn } from "@/lib/utils";
import { ChevronRight, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";

const PTC_LOGO  = "/images/etr-logo.png";
const USDT_LOGO = "/images/usdt-logo.png";

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors text-left"
    >
      {children}
    </button>
  );
}

export default function Wallet() {
  const [, navigate] = useLocation();
  const { data: wallet, isLoading } = useGetWallet();
  const { data: user } = useGetMe();

  const gemsBalance = wallet?.gemsBalance ?? 0;
  const usdtBalance = wallet?.usdtBalance ?? 0;
  const etrBalance  = wallet?.etrBalance ?? 0;
  const isVerified  = (wallet as any)?.isVerified ?? false;
  const totalUsd    = usdtBalance;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-3">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-white/35 uppercase tracking-widest font-semibold">Wallet</p>
          {isVerified && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck size={11} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Verified</span>
            </div>
          )}
          {!isVerified && (
            <button
              onClick={() => navigate("/verify")}
              className="text-[10px] text-white/35 hover:text-white/60 transition-colors font-medium"
            >
              Get Verified →
            </button>
          )}
        </div>
        <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(totalUsd)}</p>
        <p className="text-xs text-white/30 mt-1">USDT Balance</p>
      </motion.div>

      {/* ── Assets ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="px-5 pt-4 pb-2 text-[10px] text-white/30 uppercase tracking-widest font-semibold">Assets</p>

        {/* USDT */}
        <Row onClick={() => navigate("/wallet/usdt")}>
          <img src={USDT_LOGO} alt="USDT" className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Tether USD</p>
            <p className="text-xs text-white/35">USDT</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-white font-mono">{formatCurrency(usdtBalance)}</p>
            <p className="text-xs text-white/30 font-mono">{usdtBalance.toFixed(2)} USDT</p>
          </div>
          <ChevronRight size={15} className="text-white/20 shrink-0" />
        </Row>

        <div className="mx-5 h-px bg-white/[0.05]" />

        {/* PTC */}
        <Row onClick={() => navigate("/wallet/etr")}>
          <img src={PTC_LOGO} alt="PTC" className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">PTC Token</p>
            <p className="text-xs text-white/35">Peridot Token</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-white font-mono">{etrBalance.toFixed(4)} PTC</p>
          </div>
          <ChevronRight size={15} className="text-white/20 shrink-0" />
        </Row>

        <div className="mx-5 h-px bg-white/[0.05]" />

        {/* Gems */}
        <Row onClick={() => navigate("/convert")}>
          <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
            <GemIcon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Gems</p>
            <p className="text-xs text-white/35">Mineable · Convertible</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-white font-mono">{formatGems(gemsBalance)}</p>
            <p className="text-xs text-white/30">Convert anytime</p>
          </div>
          <ChevronRight size={15} className="text-white/20 shrink-0" />
        </Row>
      </motion.div>

      {/* ── Convert shortcut ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => navigate("/convert")}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.06] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ArrowRightLeft size={15} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Convert Gems</p>
              <p className="text-xs text-white/35">Gems → PTC · Open to all</p>
            </div>
          </div>
          <ChevronRight size={15} className="text-white/25" />
        </button>
      </motion.div>

      {/* ── Verification nudge ── */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <button
            onClick={() => navigate("/verify")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <ShieldCheck size={15} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Mint Verification Badge</p>
                <p className="text-xs text-white/35">Unlock USDT withdrawals & PTC transfers</p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary shrink-0">20 PTC</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
