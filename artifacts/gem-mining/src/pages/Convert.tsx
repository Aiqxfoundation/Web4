import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGetMyConversions, useCreateConversion, useGetSystemStats, useGetWallet } from "@workspace/api-client-react";
import { formatGems, cn } from "@/lib/utils";
import { ArrowDown, History, X, BarChart3, Zap, ArrowRight } from "lucide-react";
import { GemIcon } from "@/components/GemIcon";

const PTC_LOGO = "/images/etr-logo.png";

export default function Convert() {
  const [amount, setAmount]           = useState("");
  const [sheet, setSheet]             = useState<"history" | "rate" | null>(null);
  const queryClient                   = useQueryClient();

  const { data: conversions, isLoading: isLoadingHistory } = useGetMyConversions();
  const { data: stats }    = useGetSystemStats();
  const { data: wallet }   = useGetWallet();
  const { mutate: convert, isPending } = useCreateConversion();

  const currentRate   = stats?.conversionRateGemsPerEtr || 100000;
  const gemBalance    = wallet?.gemsBalance ?? 0;
  const numAmount     = Number(amount);
  const expectedPtc   = numAmount > 0 ? numAmount / currentRate : 0;

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
    <>
      <div className="max-w-sm mx-auto px-4 pt-6 pb-28 flex flex-col gap-4">

        {/* ── Top action pills ─────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/25">Convert Gems</p>
            <p className="text-[11px] text-white/20 mt-0.5">Exchange gems for PTC tokens</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSheet(sheet === "rate" ? null : "rate")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                sheet === "rate"
                  ? "text-orange-400"
                  : "text-white/40 hover:text-white/70",
              )}
              style={{
                background: sheet === "rate" ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sheet === "rate" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <BarChart3 size={12} /> Rate
            </button>
            <button
              onClick={() => setSheet(sheet === "history" ? null : "history")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                sheet === "history"
                  ? "text-orange-400"
                  : "text-white/40 hover:text-white/70",
              )}
              style={{
                background: sheet === "history" ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${sheet === "history" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <History size={12} />
              History
              {conversions?.length ? (
                <span className="ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.2)", color: "#f97316" }}>
                  {conversions.length}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* ── Expandable panels ──────────────────────────────────────── */}
        <AnimatePresence>
          {sheet === "rate" && (
            <motion.div
              key="rate-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl p-4 space-y-2"
                style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Conversion Rate</p>
                  <button onClick={() => setSheet(null)} className="text-white/25 hover:text-white/60 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono" style={{ color: "#f97316" }}>
                    {formatGems(currentRate)}
                  </span>
                  <span className="text-sm text-white/40">gems = 1 PTC</span>
                </div>
                {stats?.isDynamicRateActive && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid rgba(249,115,22,0.15)" }}>
                    <Zap size={10} style={{ color: "#f97316" }} />
                    <p className="text-[10px]" style={{ color: "rgba(249,115,22,0.7)" }}>
                      Dynamic Halving active — rate increases with volume
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {sheet === "history" && (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-xs font-bold text-white/60">Conversion History</p>
                  <button onClick={() => setSheet(null)} className="text-white/25 hover:text-white/60 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                {isLoadingHistory ? (
                  <div className="py-6 flex justify-center">
                    <div className="w-5 h-5 rounded-full animate-spin"
                      style={{ border: "2px solid rgba(249,115,22,0.2)", borderTopColor: "#f97316" }} />
                  </div>
                ) : !conversions?.length ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-white/25">No conversions yet</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-56 overflow-y-auto custom-scrollbar"
                    style={{ divideColor: "rgba(255,255,255,0.04)" }}>
                    {conversions.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-4 py-3"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-red-400/80 font-mono">−{formatGems(c.gemsSpent)}</span>
                            <ArrowRight size={9} className="text-white/20" />
                            <span className="text-xs font-bold text-orange-400 font-mono">+{c.outputAmount.toFixed(4)} PTC</span>
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

        {/* ── Balance pill ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <div className="flex items-center gap-2">
            <GemIcon size={14} />
            <span className="text-xs text-white/50">Available</span>
          </div>
          <span className="font-mono text-sm font-black" style={{ color: "#f97316" }}>
            {formatGems(gemBalance)} gems
          </span>
        </div>

        {/* ── Converter card ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Gem input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-semibold">
                  Gems
                </label>
                <button type="button"
                  onClick={() => setAmount(String(Math.floor(gemBalance)))}
                  className="text-[11px] font-bold hover:opacity-70 transition-opacity"
                  style={{ color: "#f97316" }}>
                  Max
                </button>
              </div>
              <div className="relative">
                <input
                  type="number" min="1" step="1" value={amount}
                  onChange={e => setAmount(e.target.value)} required
                  placeholder="0"
                  className="w-full rounded-2xl px-4 py-4 text-white text-3xl font-black font-mono placeholder:text-white/10 focus:outline-none pr-16"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${numAmount > 0 && numAmount <= gemBalance ? "rgba(249,115,22,0.25)" : numAmount > gemBalance ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <GemIcon size={18} />
                </div>
              </div>
              {numAmount > gemBalance && numAmount > 0 && (
                <p className="text-[11px] text-red-400/80 mt-1.5 px-1">Exceeds your balance</p>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <ArrowDown size={14} style={{ color: "#f97316" }} />
              </div>
            </div>

            {/* PTC output */}
            <div className="rounded-2xl p-4"
              style={{
                background: numAmount > 0 && numAmount <= gemBalance
                  ? "rgba(249,115,22,0.07)"
                  : "rgba(255,255,255,0.025)",
                border: `1px solid ${numAmount > 0 && numAmount <= gemBalance ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}>
              <p className="text-[10px] uppercase tracking-widest text-white/25 font-semibold mb-2">You Receive</p>
              <div className="flex items-center gap-3">
                <img src={PTC_LOGO} alt="PTC" className="w-9 h-9 rounded-full shrink-0" />
                <span className="text-2xl font-black font-mono tabular-nums" style={{ color: numAmount > 0 && numAmount <= gemBalance ? "#f97316" : "rgba(255,255,255,0.2)" }}>
                  {numAmount > 0 && numAmount <= gemBalance
                    ? `${expectedPtc.toFixed(4)} PTC`
                    : "— PTC"}
                </span>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isPending || numAmount <= 0 || numAmount > gemBalance}
              whileTap={{ scale: 0.98 }}
              className="w-full relative py-4 rounded-2xl font-bold text-[15px] text-white overflow-hidden transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: numAmount > 0 && numAmount <= gemBalance
                  ? "linear-gradient(135deg, #ea6c10 0%, #f97316 100%)"
                  : "rgba(255,255,255,0.04)",
                border: numAmount > 0 && numAmount <= gemBalance ? "none" : "1px solid rgba(255,255,255,0.07)",
                boxShadow: numAmount > 0 && numAmount <= gemBalance ? "0 6px 24px rgba(249,115,22,0.35)" : "none",
              }}
            >
              {numAmount > 0 && numAmount <= gemBalance && !isPending && (
                <motion.div className="absolute inset-0 pointer-events-none"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 2 }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", width: "50%" }}
                />
              )}
              {isPending ? "Converting…"
                : numAmount > 0 && numAmount <= gemBalance
                  ? `Convert → ${expectedPtc.toFixed(4)} PTC`
                  : "Enter Amount"}
            </motion.button>

            <p className="text-center text-[10px] text-white/20">
              {formatGems(currentRate)} gems = 1 PTC
              {stats?.isDynamicRateActive && " · Halving active"}
            </p>
          </form>
        </motion.div>

      </div>
    </>
  );
}
