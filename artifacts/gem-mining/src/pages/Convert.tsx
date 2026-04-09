import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGetMyConversions, useCreateConversion, useGetSystemStats, useGetWallet } from "@workspace/api-client-react";
import { formatGems, cn } from "@/lib/utils";
import { ArrowDown, History, ChevronDown, ArrowRight, Zap, BarChart3, TrendingUp, Gem } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";

const PTC_LOGO = "/images/etr-logo.png";

export default function Convert() {
  const [amount, setAmount]           = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const queryClient                   = useQueryClient();

  const { data: conversions, isLoading: isLoadingHistory } = useGetMyConversions();
  const { data: stats }    = useGetSystemStats();
  const { data: wallet }   = useGetWallet();
  const { mutate: convert, isPending } = useCreateConversion();

  const PTC_PRICE_USD = 3.5;
  const currentRate   = stats?.conversionRateGemsPerEtr || 100000;
  const gemBalance    = wallet?.gemsBalance ?? 0;
  const numAmount     = Number(amount);
  const expectedPtc   = numAmount > 0 ? numAmount / currentRate : 0;
  const expectedUsd   = expectedPtc * PTC_PRICE_USD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) { toast.error("Enter a valid amount"); return; }
    if (numAmount > gemBalance) { toast.error("Insufficient gem balance"); return; }
    convert({ data: { gemsAmount: numAmount, outputType: "etr" } }, {
      onSuccess: () => {
        toast.success("Gems converted to PTC successfully!");
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
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(124,58,237,0.05)" }} />

        <div className="px-5 pt-5 pb-4 relative">
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
                {formatGems(currentRate)} gems = 1 PTC
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

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", divideColor: "rgba(255,255,255,0.04)" }}>
          {[
            { label: "PTC Price", value: "$3.50" },
            { label: "Your PTC", value: wallet ? (wallet.etrBalance ?? 0).toFixed(4) : "—" },
            { label: "Rate", value: `${formatGems(currentRate)}:1` },
          ].map((stat, i) => (
            <div key={i} className="px-4 py-3 text-center" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <p className="text-[9px] uppercase tracking-widest text-white/20 font-semibold">{stat.label}</p>
              <p className="text-xs font-black font-mono text-white/70 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Output type — PTC only ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <div
          className="flex items-center gap-4 p-4 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.04) 100%)",
            border: "1px solid rgba(249,115,22,0.25)",
          }}
        >
          <img src={PTC_LOGO} alt="PTC" className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-white">PTC Token</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.18)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>BEP-20</span>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">Peridot Token · $3.50/PTC · Max Value</p>
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#f97316", boxShadow: "0 0 10px rgba(249,115,22,0.6)" }}>
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>
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
              <p className="text-[11px] text-red-400 mt-1.5">Exceeds balance by {formatGems(numAmount - gemBalance)}</p>
            )}
          </div>

          {/* Arrow divider */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <ArrowDown size={14} style={{ color: "#f97316" }} />
            </div>
            {numAmount > 0 && numAmount <= gemBalance && (
              <span className="text-[10px] font-semibold" style={{ color: "rgba(249,115,22,0.5)" }}>
                {expectedPtc.toFixed(6)} PTC
              </span>
            )}
          </div>

          {/* Output preview */}
          <div className="rounded-2xl p-4 transition-all"
            style={{
              background: "rgba(249,115,22,0.06)",
              border: `1px solid ${numAmount > 0 && numAmount <= gemBalance ? "rgba(249,115,22,0.22)" : "rgba(255,255,255,0.06)"}`,
            }}>
            <div className="flex items-center gap-3">
              <img src={PTC_LOGO} alt="PTC" className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">You Receive</p>
                <p className="text-2xl font-black font-mono tabular-nums leading-tight" style={{ color: "#f97316" }}>
                  {numAmount > 0 && numAmount <= gemBalance
                    ? `${expectedPtc.toFixed(4)} PTC`
                    : "— PTC"}
                </p>
              </div>
              {numAmount > 0 && numAmount <= gemBalance && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-white/25">≈ USD</p>
                  <p className="text-sm font-bold text-white/50 font-mono">${expectedUsd.toFixed(2)}</p>
                  <div className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>
                    3.5×
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isPending || numAmount <= 0 || numAmount > gemBalance}
            whileTap={{ scale: 0.98 }}
            className="w-full relative py-4 rounded-2xl font-bold text-[15px] text-white overflow-hidden transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: numAmount > 0 && numAmount <= gemBalance
                ? "linear-gradient(135deg, #ea6c10 0%, #f97316 50%, #fb923c 100%)"
                : "rgba(255,255,255,0.04)",
              border: numAmount > 0 && numAmount <= gemBalance ? "none" : "1px solid rgba(255,255,255,0.07)",
              boxShadow: numAmount > 0 && numAmount <= gemBalance ? "0 6px 24px rgba(249,115,22,0.35)" : "none",
            }}>
            {numAmount > 0 && numAmount <= gemBalance && !isPending && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 2 }}
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", width: "50%" }}
              />
            )}
            {isPending ? "Converting…" : numAmount > 0 ? `Convert ${formatGems(numAmount)} Gems → PTC` : "Enter Gem Amount"}
          </motion.button>
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
              { icon: <GemIcon size={14} />, label: "Gems per PTC", value: formatGems(stats.conversionRateGemsPerEtr), mono: true },
              { icon: <img src={PTC_LOGO} alt="PTC" className="w-4 h-4 rounded-full" />, label: "PTC → USD", value: "$3.50", accent: "#f97316" },
              { icon: <TrendingUp size={14} style={{ color: "#f97316" }} />, label: "Conversion Multiplier", value: "3.5×", accent: "#f97316" },
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
                Dynamic Halving Active — rate increases with volume
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
                    <div className="w-5 h-5 rounded-full animate-spin"
                      style={{ border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "#f97316" }} />
                  </div>
                ) : !conversions?.length ? (
                  <div className="py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                      <GemIcon size={22} />
                    </div>
                    <p className="text-sm font-semibold text-white/25">No conversions yet</p>
                    <p className="text-xs text-white/15 mt-1">Convert your gems to PTC above</p>
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
                            <span className="text-xs font-bold text-orange-400">
                              +{c.outputAmount.toFixed(4)} PTC
                            </span>
                          </div>
                          <p className="text-[10px] text-white/25 mt-0.5 font-mono">
                            {format(new Date(c.createdAt), "MMM d · HH:mm")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-white/25">≈ USD</p>
                          <p className="text-xs font-bold font-mono text-white/40">${(c.outputAmount * 3.5).toFixed(2)}</p>
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
