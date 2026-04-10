import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { format } from "date-fns";
import {
  useGetWallet, useGetDepositsFull, useGetMyWithdrawals, useCreateWithdrawal,
} from "@workspace/api-client-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight, ChevronRight,
  Lock, ShieldCheck, Clock, AlertCircle, Check, X,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

const USDT_LOGO = "/images/usdt-logo.png";
const ETR_LOGO  = "/images/etr-logo.png";
const WITHDRAWAL_ETR_FEE = 0.1;

// ── Inline modal shell ────────────────────────────────────────────────────────
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

// ── Withdraw Sheet ────────────────────────────────────────────────────────────
function WithdrawSheet({ usdtBalance, etrBalance, isVerified, miningStartedAt, onClose }: {
  usdtBalance: number; etrBalance: number; isVerified: boolean;
  miningStartedAt: string | null; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const { mutate: withdraw, isPending } = useCreateWithdrawal();
  const [, navigate] = useLocation();

  const hoursActive = miningStartedAt
    ? (Date.now() - new Date(miningStartedAt).getTime()) / (1000 * 60 * 60) : 0;
  const has24h = hoursActive >= 24;
  const hoursLeft = Math.ceil(Math.max(0, 24 - hoursActive));
  const hasFee = etrBalance >= WITHDRAWAL_ETR_FEE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 1) { notify.error("Minimum Withdrawal", "The minimum USDT withdrawal amount is $1.00."); return; }
    if (n > usdtBalance) { notify.error("Insufficient Balance", "You don't have enough USDT to cover this withdrawal."); return; }
    if (!address.trim()) { notify.error("Address Required", "Please enter your BSC destination wallet address."); return; }
    withdraw({ data: { currency: "usdt", amount: n, walletAddress: address.trim() } }, {
      onSuccess: () => {
        notify.withdrawalSubmitted();
        queryClient.invalidateQueries();
        onClose();
      },
      onError: (err: any) => notify.error("Withdrawal Failed", err?.data?.error || err?.message || "Could not submit your withdrawal. Please try again."),
    });
  };

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
              USDT withdrawals are only available to verified miners. Mint your Verification Badge to unlock.
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

  if (!has24h) {
    return (
      <div className="p-6 space-y-5">
        <div className="py-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto">
            <Clock size={24} className="text-white/40" />
          </div>
          <div>
            <p className="font-bold text-white">24h Mining Required</p>
            <p className="text-sm text-white/45 mt-1 leading-relaxed">
              Withdrawals unlock after 24 hours of active mining. {hoursLeft} hour{hoursLeft !== 1 ? "s" : ""} remaining.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Fee notice */}
      <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
        <AlertCircle size={13} className="text-white/40 shrink-0" />
        <p className="text-xs text-white/50">
          Processing fee: <span className="text-white font-semibold">0.1 PTC</span>
          {" "}· Balance: {etrBalance.toFixed(4)} PTC
          {!hasFee && <span className="text-primary"> (insufficient)</span>}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-white/45 font-medium">Amount (USDT)</label>
          <button type="button" onClick={() => setAmount(String(usdtBalance))}
            className="text-xs text-primary font-semibold hover:underline">
            MAX: {formatCurrency(usdtBalance)}
          </button>
        </div>
        <input
          type="number" step="0.01" min="1" value={amount}
          onChange={e => setAmount(e.target.value)} required placeholder="0.00"
          className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <div>
        <label className="text-xs text-white/45 font-medium mb-2 block">Destination Address</label>
        <input
          value={address} onChange={e => setAddress(e.target.value)} required placeholder="0x..."
          className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <p className="text-xs text-white/30 leading-relaxed">
        Withdrawals are irreversible once approved. Double-check your address before submitting.
      </p>

      <button type="submit" disabled={isPending || !hasFee}
        className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-105">
        {isPending ? "Submitting…" : "Withdraw USDT"}
      </button>
    </form>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxRow({ type, amount, status, date, isDeposit }: {
  type: string; amount: string; status: string; date: string; isDeposit: boolean;
}) {
  const statusColors: Record<string, string> = {
    approved: "text-white/60 bg-white/[0.06]",
    rejected: "text-white/40 bg-white/[0.04]",
    pending:  "text-primary/70 bg-primary/[0.08]",
  };
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
        {isDeposit
          ? <ArrowDownLeft size={14} className="text-white/50" />
          : <ArrowUpRight size={14} className="text-white/50" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{type}</p>
        <p className="text-xs text-white/30">{date}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-white font-mono">{isDeposit ? "+" : "-"}{amount}</p>
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide", statusColors[status] ?? "text-white/30 bg-white/[0.04]")}>
          {status}
        </span>
      </div>
    </div>
  );
}

// ── Main USDT Page ────────────────────────────────────────────────────────────
export default function UsdtPage() {
  const [, navigate] = useLocation();
  const [sheet, setSheet] = useState<"withdraw" | null>(null);
  const { data: wallet } = useGetWallet();
  const { data: deposits } = useGetDepositsFull();
  const { data: withdrawals } = useGetMyWithdrawals();

  const usdtBalance  = wallet?.usdtBalance ?? 0;
  const etrBalance   = wallet?.etrBalance ?? 0;
  const isVerified   = (wallet as any)?.isVerified ?? false;
  const miningStart  = (wallet as any)?.miningStartedAt ?? null;

  const usdtWithdrawals = (withdrawals ?? []).filter((w: any) => w.currency === "usdt");
  const allTx = [
    ...(deposits ?? []).map((d: any) => ({ ...d, _type: "deposit" })),
    ...usdtWithdrawals.map((w: any) => ({ ...w, _type: "withdrawal" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

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
          <img src={USDT_LOGO} alt="USDT" className="w-7 h-7 rounded-full" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">Tether USD</p>
            <p className="text-[10px] text-white/35">USDT</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-white/35 uppercase tracking-widest mb-2 font-semibold">Balance</p>
          <p className="text-4xl font-black text-white tracking-tight">{formatCurrency(usdtBalance)}</p>
          <p className="text-xs text-white/30 mt-1">{usdtBalance.toFixed(2)} USDT</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-2.5"
        >
          <button
            onClick={() => navigate("/wallet/usdt/deposit")}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl bg-primary text-black font-bold text-sm hover:brightness-105 transition-all active:scale-[0.98]"
          >
            <ArrowDownLeft size={20} />
            Deposit
          </button>

          <button
            onClick={() => setSheet("withdraw")}
            className="flex flex-col items-center gap-2 py-5 rounded-2xl bg-white/[0.07] border border-white/[0.09] text-white font-bold text-sm hover:bg-white/[0.09] transition-all active:scale-[0.98]"
          >
            {isVerified
              ? <ArrowUpRight size={20} />
              : <Lock size={20} className="text-white/50" />
            }
            <span className={cn(!isVerified && "text-white/50")}>Withdraw</span>
          </button>
        </motion.div>

        {/* Verified unlock notice */}
        {!isVerified && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/verify")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
          >
            <ShieldCheck size={15} className="text-primary shrink-0" />
            <p className="text-xs text-white/50 text-left flex-1">
              Mint Verification Badge to unlock USDT withdrawals
            </p>
            <ChevronRight size={13} className="text-white/25 shrink-0" />
          </motion.button>
        )}

        {/* Transaction history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="px-5 pt-4 pb-2 text-[10px] text-white/30 uppercase tracking-widest font-semibold">History</p>
          {!allTx.length ? (
            <div className="py-10 text-center">
              <p className="text-sm text-white/25">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {allTx.map((tx: any) => (
                <TxRow
                  key={`${tx._type}-${tx.id}`}
                  type={tx._type === "deposit" ? "Deposit" : "Withdrawal"}
                  amount={tx._type === "deposit"
                    ? `${formatCurrency(tx.amountUsdt)}`
                    : `${formatCurrency(tx.amount)}`
                  }
                  status={tx.status}
                  date={format(new Date(tx.createdAt), "MMM d · HH:mm")}
                  isDeposit={tx._type === "deposit"}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Sheet open={sheet === "withdraw"} onClose={() => setSheet(null)} title="Withdraw USDT">
        <WithdrawSheet
          usdtBalance={usdtBalance} etrBalance={etrBalance}
          isVerified={isVerified} miningStartedAt={miningStart}
          onClose={() => setSheet(null)}
        />
      </Sheet>
    </div>
  );
}
