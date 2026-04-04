import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGetMyConversions, useCreateConversion, useGetSystemStats, useGetWallet } from "@workspace/api-client-react";
import { formatCurrency, formatGems, cn } from "@/lib/utils";
import {
  ArrowDownUp, Info, TrendingUp, Zap, History, ChevronDown,
  Flame, Star, BarChart3, ArrowRight,
} from "lucide-react";

const ETR_LOGO  = "/images/etr-logo.png";
const USDT_LOGO = "/images/usdt-logo.png";

function GemIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="cg-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="cg-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="cg-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="cg-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#2e1065" />
        </linearGradient>
      </defs>
      <polygon points="20,4 30,14 20,10" fill="url(#cg-top)" />
      <polygon points="20,4 10,14 20,10" fill="url(#cg-top)" opacity="0.85" />
      <polygon points="30,14 20,10 10,14" fill="url(#cg-right)" opacity="0.7" />
      <polygon points="10,14 20,10 20,34 6,22" fill="url(#cg-left)" />
      <polygon points="30,14 20,10 20,34 34,22" fill="url(#cg-right)" />
      <polygon points="20,34 6,22 34,22" fill="url(#cg-bottom)" />
      <polygon points="20,5 26,12 22,11" fill="white" opacity="0.35" />
    </svg>
  );
}

export default function Convert() {
  const [amount, setAmount] = useState("");
  const [outputType, setOutputType] = useState<"etr" | "usdt">("etr");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  const { data: conversions, isLoading: isLoadingHistory } = useGetMyConversions();
  const { data: stats } = useGetSystemStats();
  const { data: wallet } = useGetWallet();
  const { mutate: convert, isPending } = useCreateConversion();

  const ETR_PRICE_USD = 3.5;
  const USDT_PRICE_PER_ETR = 2.5;

  const currentRate = stats?.conversionRateGemsPerEtr || 100000;
  const gemBalance = wallet?.gemsBalance ?? 0;
  const numAmount = Number(amount);
  const expectedEtr = numAmount > 0 ? numAmount / currentRate : 0;
  const expectedUsdt = expectedEtr * USDT_PRICE_PER_ETR;
  const expectedEtrUsd = expectedEtr * ETR_PRICE_USD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (numAmount > gemBalance) { toast.error("Insufficient gem balance"); return; }

    convert({ data: { gemsAmount: numAmount, outputType } }, {
      onSuccess: () => {
        toast.success("Gems converted successfully!");
        setAmount("");
        queryClient.invalidateQueries();
      },
      onError: (err: any) => toast.error(err.error || "Conversion failed"),
    });
  };

  const outputValue = outputType === "etr" ? expectedEtr : expectedUsdt;
  const outputLabel = outputType === "etr" ? "ETR" : "USDT";
  const multiplier = outputType === "etr" ? "3.5x" : "2.5x";
  const outputUsd = outputType === "etr" ? expectedEtrUsd : expectedUsdt;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <GemIcon size={28} />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Forge</h1>
            <p className="text-xs text-white/40">Convert gems into tradable assets</p>
          </div>
        </div>
      </motion.div>

      {/* Gem balance card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #2d1060 50%, #1e0945 100%)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 8px 40px rgba(109,40,217,0.2)",
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-400/25 flex items-center justify-center shrink-0">
          <GemIcon size={32} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-violet-300/60 uppercase tracking-widest font-bold mb-1">Available Gems</p>
          <p className="text-3xl font-black text-white tracking-tight">{formatGems(gemBalance)}</p>
          <p className="text-xs text-violet-300/50 mt-0.5">Rate: {formatGems(currentRate)} gems = 1 ETR</p>
        </div>
        {stats?.isDynamicRateActive && (
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 rounded-full px-2.5 py-1.5 shrink-0">
            <Zap size={10} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wide">Halving</span>
          </div>
        )}
      </motion.div>

      {/* Output type selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 gap-3"
      >
        {([
          {
            type: "etr" as const,
            label: "ETR Token",
            sub: "3.5× return · Best value",
            logo: ETR_LOGO,
            accent: "amber",
            gradFrom: "rgba(245,158,11,0.12)",
            gradTo: "rgba(217,119,6,0.08)",
            border: "rgba(245,158,11,0.25)",
            textColor: "text-amber-300",
            borderActive: "rgba(245,158,11,0.5)",
          },
          {
            type: "usdt" as const,
            label: "USDT",
            sub: "2.5× return · Stable",
            logo: USDT_LOGO,
            accent: "emerald",
            gradFrom: "rgba(38,161,123,0.12)",
            gradTo: "rgba(16,185,129,0.08)",
            border: "rgba(38,161,123,0.2)",
            textColor: "text-emerald-300",
            borderActive: "rgba(38,161,123,0.5)",
          },
        ] as const).map((opt) => (
          <button
            key={opt.type}
            onClick={() => setOutputType(opt.type)}
            className={cn(
              "flex flex-col items-start gap-3 p-4 rounded-2xl transition-all text-left",
              outputType === opt.type ? "ring-2" : "opacity-60 hover:opacity-80"
            )}
            style={{
              background: `linear-gradient(135deg, ${opt.gradFrom} 0%, ${opt.gradTo} 100%)`,
              border: `1px solid ${outputType === opt.type ? opt.borderActive : opt.border}`,
              ringColor: opt.borderActive,
            }}
          >
            <img src={opt.logo} alt={opt.type} className="w-9 h-9 rounded-full" />
            <div>
              <p className={cn("text-sm font-bold", opt.textColor)}>{opt.label}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{opt.sub}</p>
            </div>
            {outputType === opt.type && (
              <div className="absolute top-3 right-3">
                <Star size={10} className={opt.textColor} fill="currentColor" />
              </div>
            )}
          </button>
        ))}
      </motion.div>

      {/* Conversion form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, #0f1117 0%, #131720 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gems input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                <GemIcon size={12} />
                Gems to Convert
              </label>
              <button type="button"
                onClick={() => setAmount(String(Math.floor(gemBalance)))}
                className="text-xs text-primary font-bold hover:underline">
                MAX: {formatGems(Math.floor(gemBalance))}
              </button>
            </div>
            <div className="relative">
              <input
                type="number" min="1" step="1" value={amount}
                onChange={e => setAmount(e.target.value)} required
                placeholder="0"
                className="w-full bg-white/5 border border-white/12 rounded-2xl px-4 py-4 text-white text-xl font-bold font-mono placeholder:text-white/15 focus:outline-none focus:border-violet-500/50 transition-colors pr-20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-400/70">
                💎 GEM
              </span>
            </div>
            {numAmount > gemBalance && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <span>⚠</span> Exceeds balance by {formatGems(numAmount - gemBalance)} gems
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/6 border border-white/10 flex items-center justify-center">
              <ArrowDownUp size={16} className="text-white/50" />
            </div>
          </div>

          {/* Output preview */}
          <div className={cn(
            "rounded-2xl p-5 transition-all",
            outputType === "etr"
              ? "bg-amber-500/8 border border-amber-500/20"
              : "bg-[#26a17b]/8 border border-[#26a17b]/20"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={outputType === "etr" ? ETR_LOGO : USDT_LOGO}
                alt={outputLabel}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-xs text-white/50 font-medium">You Receive</p>
                <p className={cn("text-2xl font-black font-mono", outputType === "etr" ? "text-amber-300" : "text-emerald-300")}>
                  {numAmount > 0
                    ? outputType === "etr"
                      ? `${outputValue.toFixed(4)} ETR`
                      : formatCurrency(outputValue)
                    : `— ${outputLabel}`}
                </p>
              </div>
            </div>
            {numAmount > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-white/8">
                <span className="text-xs text-white/40">USD Value</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60 font-semibold">{formatCurrency(outputUsd)}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    outputType === "etr" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                  )}>
                    {multiplier}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || numAmount <= 0 || numAmount > gemBalance}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              outputType === "etr"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110"
                : "bg-gradient-to-r from-[#26a17b] to-emerald-500 hover:brightness-110"
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Flame size={15} className="animate-bounce" />
                Forging...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Flame size={15} />
                Forge {numAmount > 0 ? formatGems(numAmount) : ""} Gems → {outputLabel}
              </span>
            )}
          </button>
        </form>
      </motion.div>

      {/* Market rate card */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-3xl p-5"
          style={{
            background: "linear-gradient(135deg, #0f1117 0%, #131720 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-primary" />
            <h3 className="text-sm font-bold text-white">Market Rates</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/4">
              <div className="flex items-center gap-2">
                <GemIcon size={16} />
                <span className="text-xs text-white/60">Gems per ETR</span>
              </div>
              <span className="text-sm font-bold text-white font-mono">
                {formatGems(stats.conversionRateGemsPerEtr)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/6 border border-amber-500/12">
              <div className="flex items-center gap-2">
                <img src={ETR_LOGO} alt="ETR" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-white/60">ETR → USD</span>
              </div>
              <span className="text-sm font-bold text-amber-300 font-mono">$3.50</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#26a17b]/6 border border-[#26a17b]/12">
              <div className="flex items-center gap-2">
                <img src={USDT_LOGO} alt="USDT" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-white/60">Direct USDT rate</span>
              </div>
              <span className="text-sm font-bold text-emerald-300 font-mono">2.5×</span>
            </div>
          </div>
          {stats.isDynamicRateActive && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
              <Zap size={12} className="text-amber-400" />
              <p className="text-xs text-amber-400 font-semibold">Dynamic Halving Active — Rate changes with volume</p>
            </div>
          )}
        </motion.div>
      )}

      {/* History toggle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f1117 0%, #131720 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/4 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History size={15} className="text-white/40" />
            <span className="text-sm font-bold text-white">Conversion History</span>
            {conversions?.length ? (
              <span className="text-[10px] font-bold bg-primary/20 text-primary rounded-full px-2 py-0.5">
                {conversions.length}
              </span>
            ) : null}
          </div>
          <ChevronDown
            size={16}
            className={cn("text-white/40 transition-transform duration-200", showHistory && "rotate-180")}
          />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-white/6 pt-4">
                {isLoadingHistory ? (
                  <div className="py-8 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-2" />
                    <p className="text-xs text-white/30">Loading...</p>
                  </div>
                ) : !conversions?.length ? (
                  <div className="py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-3">
                      <GemIcon size={28} />
                    </div>
                    <p className="text-sm font-semibold text-white/30">No conversions yet</p>
                    <p className="text-xs text-white/20 mt-1">Convert your gems to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversions.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                          <GemIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-red-400">−{formatGems(c.gemsSpent)}</span>
                            <ArrowRight size={10} className="text-white/30" />
                            <span className={cn(
                              "text-xs font-bold",
                              c.outputType === "usdt" ? "text-emerald-400" : "text-amber-400"
                            )}>
                              +{c.outputType === "usdt" ? formatCurrency(c.outputAmount) : `${c.outputAmount} ETR`}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {format(new Date(c.createdAt), "MMM d, yy · HH:mm")} · Rate: {formatGems(c.conversionRate)}/ETR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
