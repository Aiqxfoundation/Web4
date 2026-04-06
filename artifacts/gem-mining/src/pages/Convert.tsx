import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGetMyConversions, useCreateConversion, useGetSystemStats, useGetWallet } from "@workspace/api-client-react";
import { formatCurrency, formatGems, cn } from "@/lib/utils";
import { ArrowDown, History, ChevronDown, ArrowRight, Zap, BarChart3 } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";

const ETR_LOGO  = "/images/etr-logo.png";
const USDT_LOGO = "/images/usdt-logo.png";

export default function Convert() {
  const [amount, setAmount]           = useState("");
  const [outputType, setOutputType]   = useState<"etr" | "usdt">("etr");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient                   = useQueryClient();

  const { data: conversions, isLoading: isLoadingHistory } = useGetMyConversions();
  const { data: stats }    = useGetSystemStats();
  const { data: wallet }   = useGetWallet();
  const { mutate: convert, isPending } = useCreateConversion();

  const ETR_PRICE_USD      = 3.5;
  const USDT_PRICE_PER_ETR = 2.5;
  const currentRate        = stats?.conversionRateGemsPerEtr || 100000;
  const gemBalance         = wallet?.gemsBalance ?? 0;
  const numAmount          = Number(amount);
  const expectedEtr        = numAmount > 0 ? numAmount / currentRate : 0;
  const expectedUsdt       = expectedEtr * USDT_PRICE_PER_ETR;
  const expectedEtrUsd     = expectedEtr * ETR_PRICE_USD;
  const outputValue        = outputType === "etr" ? expectedEtr : expectedUsdt;
  const outputLabel        = outputType === "etr" ? "ETR" : "USDT";
  const outputUsd          = outputType === "etr" ? expectedEtrUsd : expectedUsdt;
  const isETR              = outputType === "etr";

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

  return (
    <div className="max-w-md mx-auto px-4 py-5 pb-28 md:pb-8 space-y-3">

      {/* ── Hero: Gem Balance ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 60%, #0c0d14 100%)",
          border: "1px solid rgba(249,115,22,0.18)",
          boxShadow: "0 0 50px rgba(249,115,22,0.07), 0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(249,115,22,0.07)" }} />

        <div className="px-5 pt-5 pb-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-white/25 font-semibold mb-3">Available to Convert</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.18)" }}>
              <GemIcon size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[2.4rem] font-black font-mono tabular-nums leading-none tracking-tight"
                style={{ background: "linear-gradient(135deg, #fff 40%, rgba(249,115,22,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {formatGems(gemBalance)}
              </p>
              <p className="text-[11px] text-white/25 mt-1 font-mono">
                {formatGems(currentRate)} gems = 1 ETR
                {stats?.isDynamicRateActive && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <Zap size={8} style={{ display: "inline", marginRight: 2 }} />Halving
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Output selector ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3">
        {([
          { type: "etr" as const,  logo: ETR_LOGO,  label: "ETR Token",  sub: "3.5× · Best value", accent: "#f97316", border: "rgba(249,115,22,0.28)" },
          { type: "usdt" as const, logo: USDT_LOGO, label: "USDT",       sub: "2.5× · Stable",     accent: "#26a17b", border: "rgba(38,161,123,0.28)" },
        ]).map(opt => (
          <button key={opt.type} onClick={() => setOutputType(opt.type)}
            className="relative flex flex-col gap-3 p-4 rounded-2xl text-left transition-all"
            style={{
              background: outputType === opt.type
                ? `linear-gradient(135deg, ${opt.accent}12 0%, ${opt.accent}06 100%)`
                : "rgba(255,255,255,0.025)",
              border: `1px solid ${outputType === opt.type ? opt.border : "rgba(255,255,255,0.06)"}`,
              opacity: outputType === opt.type ? 1 : 0.55,
            }}
          >
            <img src={opt.logo} alt={opt.type} className="w-9 h-9 rounded-full" />
            <div>
              <p className="text-sm font-bold text-white">{opt.label}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
            </div>
            {outputType === opt.type && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full"
                style={{ background: opt.accent, boxShadow: `0 0 6px ${opt.accent}` }} />
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Conversion form ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Gems input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold flex items-center gap-1.5">
                <GemIcon size={11} /> Gems to Convert
              </label>
              <button type="button" onClick={() => setAmount(String(Math.floor(gemBalance)))}
                className="text-[11px] font-bold hover:opacity-70 transition-opacity"
                style={{ color: "#f97316" }}>
                MAX {formatGems(Math.floor(gemBalance))}
              </button>
            </div>
            <div className="relative">
              <input
                type="number" min="1" step="1" value={amount}
                onChange={e => setAmount(e.target.value)} required
                placeholder="0"
                className="w-full rounded-2xl px-4 py-4 text-white text-2xl font-black font-mono placeholder:text-white/12 focus:outline-none transition-colors pr-24"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${numAmount > 0 ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.08)"}` }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <GemIcon size={12} />
                <span className="text-[11px] font-bold text-white/35">GEM</span>
              </div>
            </div>
            {numAmount > gemBalance && (
              <p className="text-[11px] text-red-400 mt-1.5">⚠ Exceeds balance by {formatGems(numAmount - gemBalance)}</p>
            )}
          </div>

          {/* Arrow divider */}
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ArrowDown size={14} className="text-white/30" />
            </div>
          </div>

          {/* Output preview */}
          <div className="rounded-2xl p-4 transition-all"
            style={{
              background: isETR ? "rgba(249,115,22,0.06)" : "rgba(38,161,123,0.06)",
              border: `1px solid ${isETR ? "rgba(249,115,22,0.18)" : "rgba(38,161,123,0.18)"}`,
            }}>
            <div className="flex items-center gap-3">
              <img src={isETR ? ETR_LOGO : USDT_LOGO} alt={outputLabel} className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">You Receive</p>
                <p className="text-2xl font-black font-mono tabular-nums leading-tight"
                  style={{ color: isETR ? "#f97316" : "#26a17b" }}>
                  {numAmount > 0
                    ? isETR ? `${outputValue.toFixed(4)} ETR` : formatCurrency(outputValue)
                    : `— ${outputLabel}`}
                </p>
              </div>
              {numAmount > 0 && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-white/25">≈ USD</p>
                  <p className="text-sm font-bold text-white/50 font-mono">{formatCurrency(outputUsd)}</p>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block"
                    style={{ background: isETR ? "rgba(249,115,22,0.15)" : "rgba(38,161,123,0.15)", color: isETR ? "#f97316" : "#26a17b" }}>
                    {isETR ? "3.5×" : "2.5×"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isPending || numAmount <= 0 || numAmount > gemBalance}
            className="w-full relative py-4 rounded-2xl font-bold text-[15px] text-white overflow-hidden transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: numAmount > 0 && numAmount <= gemBalance
                ? "linear-gradient(135deg, #ea6c10 0%, #f97316 50%, #fb923c 100%)"
                : "rgba(255,255,255,0.04)",
              border: numAmount > 0 && numAmount <= gemBalance ? "none" : "1px solid rgba(255,255,255,0.07)",
              boxShadow: numAmount > 0 && numAmount <= gemBalance ? "0 6px 24px rgba(249,115,22,0.35)" : "none",
            }}>
            {isPending ? "Converting…" : `Convert ${numAmount > 0 ? formatGems(numAmount) : ""} Gems → ${outputLabel}`}
          </button>
        </form>
      </motion.div>

      {/* ── Market Rates ─────────────────────────────────────────────────────── */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
          className="rounded-3xl p-5"
          style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={13} style={{ color: "#f97316" }} />
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold">Market Rates</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: <GemIcon size={14} />, label: "Gems per ETR", value: formatGems(stats.conversionRateGemsPerEtr), mono: true },
              { icon: <img src={ETR_LOGO} alt="ETR" className="w-4 h-4 rounded-full" />, label: "ETR → USD", value: "$3.50", accent: "#f97316" },
              { icon: <img src={USDT_LOGO} alt="USDT" className="w-4 h-4 rounded-full" />, label: "Direct USDT rate", value: "2.5×", accent: "#26a17b" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  {row.icon}
                  <span className="text-xs text-white/40">{row.label}</span>
                </div>
                <span className="text-sm font-black font-mono" style={{ color: row.accent ?? "white" }}>{row.value}</span>
              </div>
            ))}
          </div>
          {stats.isDynamicRateActive && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl"
              style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <Zap size={11} style={{ color: "#f97316", flexShrink: 0 }} />
              <p className="text-[11px] font-semibold" style={{ color: "rgba(249,115,22,0.8)" }}>
                Dynamic Halving Active — rate changes with volume
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── History ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-2.5">
            <History size={13} className="text-white/30" />
            <span className="text-[13px] font-bold text-white">Conversion History</span>
            {conversions?.length ? (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                {conversions.length}
              </span>
            ) : null}
          </div>
          <ChevronDown size={15} className={cn("text-white/25 transition-transform duration-200", showHistory && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {isLoadingHistory ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-t-orange-500 animate-spin"
                      style={{ borderColor: "rgba(249,115,22,0.2)", borderTopColor: "#f97316" }} />
                  </div>
                ) : !conversions?.length ? (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                      <GemIcon size={22} />
                    </div>
                    <p className="text-sm font-semibold text-white/25">No conversions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    {conversions.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.15)" }}>
                          <GemIcon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-red-400">−{formatGems(c.gemsSpent)}</span>
                            <ArrowRight size={9} className="text-white/25" />
                            <span className={cn("text-xs font-bold", c.outputType === "usdt" ? "text-emerald-400" : "text-orange-400")}>
                              +{c.outputType === "usdt" ? formatCurrency(c.outputAmount) : `${c.outputAmount} ETR`}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                            {format(new Date(c.createdAt), "MMM d · HH:mm")}
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
