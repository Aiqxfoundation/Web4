import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useGetWallet, useGetMyWithdrawals, useTransferEtr,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowUpRight, Send, X, Lock, ShieldCheck, ChevronRight,
} from "lucide-react";

const PTC_LOGO = "/images/etr-logo.png";

function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full md:max-w-sm mx-auto rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.09)", maxHeight: "90vh" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
                <h3 className="font-bold text-white text-base">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Transfer Sheet ────────────────────────────────────────────────────────────
function TransferSheet({ etrBalance, isVerified, onClose }: {
  etrBalance: number; isVerified: boolean; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const { mutate: transfer, isPending } = useTransferEtr();

  if (!isVerified) {
    return (
      <div className="p-6 space-y-5">
        <div className="py-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-white">Verification Required</p>
            <p className="text-sm text-white/45 mt-1 leading-relaxed">
              PTC transfers are only available to verified miners. Mint your Verification Badge to unlock.
            </p>
          </div>
        </div>
        <button onClick={() => { onClose(); navigate("/verify"); }}
          className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm">
          Mint Verification Badge
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim()) { toast.error("Enter recipient username"); return; }
    const n = Number(amount);
    if (!n || n <= 0) { toast.error("Enter valid amount"); return; }
    if (n > etrBalance) { toast.error("Insufficient PTC balance"); return; }
    transfer({ data: { toUsername: to.trim(), amount: n } }, {
      onSuccess: () => {
        toast.success(`Sent ${amount} PTC to ${to}`);
        queryClient.invalidateQueries();
        onClose();
      },
      onError: (err: any) => toast.error(err?.data?.error || err?.error || "Transfer failed"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="text-xs text-white/45 font-medium mb-2 block">Recipient Username</label>
        <input
          value={to} onChange={e => setTo(e.target.value)} required placeholder="@username"
          className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/45 font-medium">Amount (PTC)</label>
          <button type="button" onClick={() => setAmount(String(etrBalance))}
            className="text-xs text-primary font-semibold hover:underline">
            MAX: {etrBalance.toFixed(4)}
          </button>
        </div>
        <input
          type="number" step="0.0001" min="0.0001" value={amount}
          onChange={e => setAmount(e.target.value)} required placeholder="0.0000"
          className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>
      <p className="text-xs text-white/30 leading-relaxed">
        Transfers are instant and irreversible. Recipient must be an active Peridot Mining user.
      </p>
      <button type="submit" disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-40 transition-all hover:brightness-105">
        {isPending ? "Sending…" : "Send PTC"}
      </button>
    </form>
  );
}

// ── Tx row ────────────────────────────────────────────────────────────────────
function TxRow({ type, amount, status, date, isOut }: {
  type: string; amount: string; status: string; date: string; isOut: boolean;
}) {
  const statusColors: Record<string, string> = {
    approved: "text-white/60 bg-white/[0.06]",
    rejected: "text-white/40 bg-white/[0.04]",
    pending:  "text-primary/70 bg-primary/[0.08]",
  };
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
        {isOut
          ? <ArrowUpRight size={14} className="text-white/50" />
          : <Send size={13} className="text-white/50" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{type}</p>
        <p className="text-xs text-white/30">{date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-white font-mono">{amount}</p>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", statusColors[status] ?? "text-white/30 bg-white/[0.04]")}>
          {status}
        </span>
      </div>
    </div>
  );
}

// ── Main ETR Page ─────────────────────────────────────────────────────────────
export default function EtrPage() {
  const [, navigate] = useLocation();
  const [sheet, setSheet] = useState<"transfer" | null>(null);
  const { data: wallet } = useGetWallet();
  const { data: withdrawals } = useGetMyWithdrawals();

  const etrBalance  = wallet?.etrBalance ?? 0;
  const isVerified  = (wallet as any)?.isVerified ?? false;

  const etrWithdrawals = (withdrawals ?? []).filter((w: any) => w.currency === "etr");

  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
        style={{ background: "hsl(220 14% 6%)" }}>
        <button onClick={() => navigate("/wallet")}
          className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <img src={PTC_LOGO} alt="PTC" className="w-7 h-7 rounded-full" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">PTC Token</p>
            <p className="text-[10px] text-white/35">PTC · BEP-20</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-2 font-semibold">Balance</p>
          <p className="text-4xl font-black text-white tracking-tight">{etrBalance.toFixed(4)}</p>
          <p className="text-xs text-white/30 mt-1">PTC Token · ≈ ${(etrBalance * 3.5).toFixed(2)} USD</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-2.5"
        >
          {/* Transfer */}
          <button
            onClick={() => setSheet("transfer")}
            className={cn(
              "flex flex-col items-center gap-2 py-5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]",
              isVerified
                ? "bg-primary text-black hover:brightness-105"
                : "bg-white/[0.07] border border-white/[0.09] text-white/50"
            )}
          >
            {isVerified ? <Send size={20} /> : <Lock size={20} />}
            Transfer
          </button>

          {/* Withdraw — always locked until mainnet */}
          <button
            onClick={() => toast.info("PTC withdrawals will be enabled after mainnet launch.")}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl bg-white/[0.05] border border-white/[0.07] text-white/40 font-bold text-sm cursor-default"
          >
            <Lock size={20} />
            Withdraw
          </button>
        </motion.div>

        {/* Mainnet notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
        >
          <Lock size={13} className="text-white/30 shrink-0" />
          <p className="text-xs text-white/35">PTC withdrawals are enabled after the token mainnet launch.</p>
        </motion.div>

        {/* Transfer lock notice */}
        {!isVerified && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
          >
            <ShieldCheck size={15} className="text-primary shrink-0" />
            <p className="text-xs text-white/50 text-left flex-1">
              Mint Verification Badge to unlock PTC transfers
            </p>
            <ChevronRight size={13} className="text-white/25 shrink-0" />
          </motion.button>
        )}

        {/* ETR Withdrawal history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="px-5 pt-4 pb-2 text-[10px] text-white/30 uppercase tracking-widest font-semibold">History</p>
          {!etrWithdrawals.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-white/25">No PTC transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {etrWithdrawals.map((w: any) => (
                <TxRow
                  key={w.id}
                  type="PTC Withdrawal"
                  amount={`${w.amount} PTC`}
                  status={w.status}
                  date={format(new Date(w.createdAt), "MMM d · HH:mm")}
                  isOut
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Sheet open={sheet === "transfer"} onClose={() => setSheet(null)} title="Transfer PTC">
        <TransferSheet etrBalance={etrBalance} isVerified={isVerified} onClose={() => setSheet(null)} />
      </Sheet>
    </div>
  );
}
