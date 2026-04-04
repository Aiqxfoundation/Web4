import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGenerateDepositAddress } from "@workspace/api-client-react";
import {
  ArrowLeft, Copy, Check, RefreshCw, X, Clock, AlertCircle,
  Wallet, ExternalLink, QrCode, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDRESS_KEY = "etr_deposit_address";
const ADDRESS_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface StoredAddress {
  address: string;
  label?: string;
  network?: string;
  issuedAt: number;
  expiresAt: number;
}

function loadStoredAddress(): StoredAddress | null {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    if (!raw) return null;
    const stored: StoredAddress = JSON.parse(raw);
    if (Date.now() > stored.expiresAt) {
      localStorage.removeItem(ADDRESS_KEY);
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

function saveAddress(address: string, label?: string, network?: string) {
  const now = Date.now();
  const stored: StoredAddress = {
    address,
    label,
    network,
    issuedAt: now,
    expiresAt: now + ADDRESS_TTL_MS,
  };
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(stored));
  return stored;
}

function clearAddress() {
  localStorage.removeItem(ADDRESS_KEY);
}

function useCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remaining % (1000 * 60)) / 1000);

  return { remaining, h, m, s };
}

export default function DepositAddress() {
  const [, navigate] = useLocation();
  const [stored, setStored] = useState<StoredAddress | null>(loadStoredAddress);
  const [copied, setCopied] = useState(false);
  const { refetch: generateAddress, isFetching } = useGenerateDepositAddress();
  const { h, m, s, remaining } = useCountdown(stored?.expiresAt ?? null);

  const handleGenerate = async () => {
    const r = await generateAddress();
    if (r.data) {
      const s = saveAddress(r.data.address, r.data.label ?? undefined, r.data.network ?? undefined);
      setStored(s);
      toast.success("Deposit address assigned!");
    } else {
      toast.error("No addresses available. Please contact support.");
    }
  };

  const handleCopy = () => {
    if (!stored?.address) return;
    navigator.clipboard.writeText(stored.address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDismiss = () => {
    clearAddress();
    setStored(null);
    toast.success("Address dismissed");
  };

  const pct = stored ? Math.max(0, Math.min(100, (remaining / ADDRESS_TTL_MS) * 100)) : 0;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/wallet")}
          className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Deposit Address</h1>
          <p className="text-xs text-white/40">Generate your BSC deposit address</p>
        </div>
      </div>

      {/* Network info */}
      <div className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: "rgba(38,161,123,0.1)", border: "1px solid rgba(38,161,123,0.2)" }}>
        <img src={USDT_LOGO} alt="USDT" className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">USDT — BNB Smart Chain</p>
          <p className="text-xs text-white/50">BEP-20 Network Only · Minimum $10 USDT</p>
        </div>
        <span className="text-[10px] font-bold text-[#26a17b] bg-[#26a17b]/15 border border-[#26a17b]/25 px-2.5 py-1 rounded-full">
          BSC
        </span>
      </div>

      {/* Address display or generator */}
      {!stored ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, #0f1117 0%, #131720 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="w-20 h-20 rounded-3xl bg-[#26a17b]/12 border border-[#26a17b]/20 flex items-center justify-center mx-auto mb-5">
            <QrCode size={36} className="text-[#26a17b]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Get Your Deposit Address</h3>
          <p className="text-sm text-white/45 mb-6 leading-relaxed max-w-64 mx-auto">
            Generate a unique BSC address to receive your USDT deposit. The address is valid for 2 hours.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#26a17b] to-emerald-500 text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isFetching ? (
              <><RefreshCw size={15} className="animate-spin" /> Generating...</>
            ) : (
              <><Wallet size={15} /> Generate Address</>
            )}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Address card */}
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0a1a12 0%, #0f2218 100%)",
              border: "1px solid rgba(38,161,123,0.3)",
              boxShadow: "0 8px 40px rgba(38,161,123,0.1)",
            }}
          >
            {/* Dismiss button */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#26a17b]" />
                <span className="text-xs font-bold text-[#26a17b]/80 uppercase tracking-wide">Active Address</span>
              </div>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/15 transition-all"
                title="Dismiss address"
              >
                <X size={13} />
              </button>
            </div>

            {/* Address */}
            <div className="px-5 pb-4">
              <div className="bg-black/30 rounded-2xl p-4 border border-[#26a17b]/15">
                <p className="text-xs text-white/40 mb-2 font-medium">Your BSC Deposit Address</p>
                <code className="text-sm font-mono text-[#26a17b] break-all leading-relaxed block">
                  {stored.address}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className={cn(
                  "w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all",
                  copied
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                    : "bg-[#26a17b] text-white hover:brightness-110"
                )}
              >
                {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Address</>}
              </button>
            </div>

            {/* Timer */}
            <div className="px-5 pb-5">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/6">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400/80">Expires in</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: pct > 50 ? "#26a17b" : pct > 20 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-1.5">
                  Address stays active until you close it or it expires. Must be closed manually.
                </p>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="flex gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-400/90 space-y-1">
              <p className="font-semibold">Important Instructions</p>
              <p>Send <strong>USDT BEP-20 only</strong>. Wrong network = permanent loss.</p>
              <p>Minimum deposit: <strong>$10 USDT</strong>. Admin approves within ~2 hours.</p>
            </div>
          </div>

          {/* After sending, submit proof */}
          <button
            onClick={() => navigate("/wallet/receive")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all hover:brightness-110 group"
            style={{
              background: "linear-gradient(135deg, rgba(38,161,123,0.1) 0%, rgba(16,185,129,0.08) 100%)",
              border: "1px solid rgba(38,161,123,0.2)",
            }}
          >
            <div className="text-left">
              <p className="text-sm font-bold text-white">Already sent? Submit proof →</p>
              <p className="text-xs text-white/45 mt-0.5">Upload TX hash or screenshot for verification</p>
            </div>
            <ExternalLink size={16} className="text-[#26a17b] group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Get new address */}
          <button
            onClick={handleGenerate}
            disabled={isFetching}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white/40 hover:text-white/60 text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? "Generating..." : "Get a different address"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
