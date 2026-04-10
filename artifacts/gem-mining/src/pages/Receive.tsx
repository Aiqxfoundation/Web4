import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { notify } from "@/lib/notify";
import { useCreateDepositFull } from "@workspace/api-client-react";
import {
  ArrowLeft, Upload, X, AlertCircle, Check, Hash, Image as ImageIcon,
  ChevronRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDRESS_KEY = "etr_deposit_address";

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

export default function Receive() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const storedAddress = loadStoredAddress();

  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate: createDeposit, isPending } = useCreateDepositFull();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.error("Invalid File Type", "Please upload an image file (JPG, PNG, etc.)."); return; }
    if (file.size > 5 * 1024 * 1024) { notify.error("File Too Large", "Screenshot must be under 5 MB. Please compress and try again."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      setScreenshotPreview(r);
      setScreenshotData(r);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 10) { notify.error("Minimum Deposit", "The minimum USDT deposit is $10.00."); return; }
    if (!txHash && !screenshotData) { notify.error("Proof Required", "Please provide a transaction hash or payment screenshot."); return; }

    createDeposit(
      {
        amountUsdt: n,
        txHash: txHash || undefined,
        screenshotData: screenshotData || undefined,
        assignedAddress: storedAddress?.address || undefined,
      },
      {
        onSuccess: () => {
          notify.depositSubmitted();
          queryClient.invalidateQueries();
          navigate("/wallet");
        },
        onError: (err: any) => notify.error("Submission Failed", err?.data?.error || err?.message || "Could not submit your deposit. Please try again."),
      }
    );
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/wallet/deposit-address")}
          className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Submit Deposit</h1>
          <p className="text-xs text-white/40">Provide proof of your USDT payment</p>
        </div>
      </div>

      {/* No address warning */}
      {!storedAddress && (
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="flex gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">No Active Deposit Address</p>
              <p className="text-xs text-white/50 mt-1">
                You need to generate a deposit address first, then send USDT to it before submitting proof.
              </p>
              <button
                onClick={() => navigate("/wallet/deposit-address")}
                className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-200 transition-colors"
              >
                Get Address <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned address display */}
      {storedAddress && (
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(38,161,123,0.08)", border: "1px solid rgba(38,161,123,0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <img src={USDT_LOGO} alt="USDT" className="w-5 h-5 rounded-full" />
            <span className="text-xs font-bold text-[#26a17b]/80 uppercase tracking-wide">
              Your Assigned Address
            </span>
          </div>
          <code className="text-xs font-mono text-[#26a17b] break-all leading-relaxed block">
            {storedAddress.address}
          </code>
        </div>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 space-y-5"
        style={{
          background: "linear-gradient(135deg, #0f1117 0%, #131720 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="text-xs text-white/50 font-medium mb-2 block">Amount Sent (USDT)</label>
            <div className="relative">
              <input
                type="number" step="0.01" min="10" value={amount}
                onChange={e => setAmount(e.target.value)} required
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3.5 text-white text-base font-mono placeholder:text-white/20 focus:outline-none focus:border-[#26a17b]/50 transition-colors pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#26a17b]">USDT</span>
            </div>
            <p className="text-xs text-white/30 mt-1.5">Minimum $10.00 USDT</p>
          </div>

          {/* Divider with OR */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/30 font-semibold">PROOF OF PAYMENT</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* TX Hash */}
          <div>
            <label className="text-xs text-white/50 font-medium mb-2 flex items-center gap-1.5 block">
              <Hash size={12} />
              Transaction Hash (TXID)
            </label>
            <input
              value={txHash} onChange={e => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full bg-white/5 border border-white/12 rounded-xl px-4 py-3.5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-[#26a17b]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/25">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Screenshot */}
          <div>
            <label className="text-xs text-white/50 font-medium mb-2 flex items-center gap-1.5 block">
              <ImageIcon size={12} />
              Payment Screenshot
            </label>
            {screenshotPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10">
                <img src={screenshotPreview} alt="proof" className="w-full h-36 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button type="button"
                  onClick={() => { setScreenshotPreview(null); setScreenshotData(null); }}
                  className="absolute top-3 right-3 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors">
                  <X size={13} />
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Screenshot attached</span>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-white/12 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/35 hover:border-[#26a17b]/40 hover:text-[#26a17b]/70 transition-all">
                <Upload size={20} />
                <span className="text-xs font-medium">Click to upload screenshot (max 5 MB)</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Warning */}
          <div className="flex gap-2.5 p-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/90 leading-relaxed">
              Send <strong>USDT only</strong> to the assigned address. Double-check before sending.
              Admin review takes ~2 hours.
            </p>
          </div>

          <button type="submit" disabled={isPending || !storedAddress}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#26a17b] to-emerald-500 text-white font-bold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isPending ? "Submitting..." : "Submit Deposit Request"}
          </button>
        </form>
      </motion.div>

      {/* No address prompt */}
      {!storedAddress && (
        <button onClick={() => navigate("/wallet/deposit-address")}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-[#26a17b] border border-[#26a17b]/25 bg-[#26a17b]/8 hover:brightness-110 transition-all">
          <ExternalLink size={15} />
          Get Deposit Address First
        </button>
      )}
    </div>
  );
}
