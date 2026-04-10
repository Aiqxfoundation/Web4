import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGenerateDepositAddress, useCreateDepositFull } from "@workspace/api-client-react";
import {
  ArrowLeft, Copy, Check, RefreshCw, AlertCircle, Clock,
  Upload, X, Hash, Image as ImageIcon, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const USDT_LOGO = "/images/usdt-logo.png";
const ADDR_KEY = "etr_deposit_addr_v2";
const TTL_MS = 2 * 60 * 60 * 1000;

interface Stored {
  address: string;
  label?: string;
  network?: string;
  expiresAt: number;
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(ADDR_KEY);
    if (!raw) return null;
    const s: Stored = JSON.parse(raw);
    if (Date.now() > s.expiresAt) { localStorage.removeItem(ADDR_KEY); return null; }
    return s;
  } catch { return null; }
}

function save(address: string, label?: string, network?: string): Stored {
  const s: Stored = { address, label, network, expiresAt: Date.now() + TTL_MS };
  localStorage.setItem(ADDR_KEY, JSON.stringify(s));
  return s;
}

function useCountdown(expiresAt: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s, remaining };
}

export default function DepositFlow() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Address state
  const [stored, setStored] = useState<Stored | null>(load);
  const [copied, setCopied] = useState(false);
  const { refetch: generateAddr, isFetching: isGenerating } = useGenerateDepositAddress();
  const { h, m, s, remaining } = useCountdown(stored?.expiresAt ?? null);

  // Proof state
  const [step, setStep] = useState<"address" | "proof">(stored ? "proof" : "address");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [screenshot, setScreenshot] = useState<{ preview: string; data: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: createDeposit, isPending: isSubmitting } = useCreateDepositFull();

  const handleGenerate = async () => {
    const r = await generateAddr();
    if (r.data) {
      const s = save(r.data.address, r.data.label ?? undefined, r.data.network ?? undefined);
      setStored(s);
      setStep("proof");
      toast.success("Address generated");
    } else {
      toast.error("No addresses available — contact support.");
    }
  };

  const handleCopy = () => {
    if (!stored?.address) return;
    navigator.clipboard.writeText(stored.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success("Address copied");
  };

  const handleDismiss = () => {
    localStorage.removeItem(ADDR_KEY);
    setStored(null);
    setStep("address");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Image files only"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setScreenshot({ preview: data, data });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n < 10) { toast.error("Minimum deposit is $10 USDT"); return; }
    if (!txHash && !screenshot) { toast.error("Provide TX hash or screenshot"); return; }
    createDeposit(
      {
        amountUsdt: n,
        txHash: txHash || undefined,
        screenshotData: screenshot?.data || undefined,
        assignedAddress: stored?.address || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Deposit submitted — pending admin review");
          queryClient.invalidateQueries();
          navigate("/wallet/usdt");
        },
        onError: (err: any) => toast.error(err?.data?.error || err?.message || "Submission failed"),
      }
    );
  };

  const pct = stored ? Math.max(0, (remaining / TTL_MS) * 100) : 0;

  return (
    <div className="max-w-md mx-auto">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]"
        style={{ background: "hsl(220 14% 6%)" }}>
        <button onClick={() => navigate("/wallet/usdt")}
          className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <img src={USDT_LOGO} alt="USDT" className="w-7 h-7 rounded-full" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">Deposit USDT</p>
            <p className="text-[10px] text-white/35">Secure USDT Deposit</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">

        {/* Step 1 — Get Address */}
        {step === "address" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl p-6 text-center space-y-4"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto">
                <img src={USDT_LOGO} alt="USDT" className="w-9 h-9 rounded-full" />
              </div>
              <div>
                <p className="font-bold text-white">Get Deposit Address</p>
                <p className="text-sm text-white/45 mt-1 leading-relaxed max-w-64 mx-auto">
                  Generate a unique deposit address to receive your USDT. Valid for 2 hours.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-40 hover:brightness-105 transition-all"
              >
                {isGenerating
                  ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" /> Generating…</span>
                  : "Generate Address"}
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <AlertCircle size={14} className="text-white/30 shrink-0 mt-0.5" />
              <p className="text-xs text-white/40 leading-relaxed">
                Send <strong className="text-white/60">USDT only</strong> to the provided address.
                Minimum $10 USDT. Admin reviews within ~2 hours.
              </p>
            </div>
          </motion.div>
        )}

        {/* Address card (always shown if exists) */}
        {stored && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>

            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.05]">
              <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Your Deposit Address</p>
              <button onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                title="Dismiss">
                <X size={13} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <code className="text-xs font-mono text-white/80 break-all leading-relaxed block bg-white/[0.04] rounded-xl p-3.5">
                {stored.address}
              </code>
              <button onClick={handleCopy}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                  copied
                    ? "bg-white/[0.08] text-white"
                    : "bg-primary text-black hover:brightness-105"
                )}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Address</>}
              </button>

              {/* Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-white/30" />
                  <span className="text-[10px] text-white/30">Expires in</span>
                </div>
                <span className="text-[11px] font-mono text-white/50">
                  {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                </span>
              </div>
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-white/20">
                This address stays active until you manually close it. It does not auto-dismiss.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Submit Proof */}
        {stored && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
                <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Submit Proof of Payment</p>
              </div>
              <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-xs text-white/45 font-medium mb-2 block">Amount Sent (USDT)</label>
                  <div className="relative">
                    <input
                      type="number" step="0.01" min="10" value={amount}
                      onChange={e => setAmount(e.target.value)} required placeholder="0.00"
                      className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">USDT</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Minimum $10.00</p>
                </div>

                {/* TX Hash */}
                <div>
                  <label className="text-xs text-white/45 font-medium mb-2 flex items-center gap-1.5 block">
                    <Hash size={11} /> Transaction Hash
                  </label>
                  <input
                    value={txHash} onChange={e => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3.5 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/25 font-semibold">OR</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Screenshot */}
                <div>
                  <label className="text-xs text-white/45 font-medium mb-2 flex items-center gap-1.5 block">
                    <ImageIcon size={11} /> Payment Screenshot
                  </label>
                  {screenshot ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/[0.09]">
                      <img src={screenshot.preview} alt="proof" className="w-full h-32 object-cover" />
                      <button type="button"
                        onClick={() => setScreenshot(null)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black/90 transition-colors">
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                        <Check size={11} className="text-primary" />
                        <span className="text-[10px] text-white/70 font-semibold">Screenshot attached</span>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-full h-20 border border-dashed border-white/[0.12] rounded-xl flex flex-col items-center justify-center gap-1.5 text-white/30 hover:border-primary/30 hover:text-primary/60 transition-all">
                      <Upload size={18} />
                      <span className="text-xs">Upload screenshot (max 5 MB)</span>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <AlertCircle size={13} className="text-white/30 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/40 leading-relaxed">
                    Send <strong className="text-white/60">USDT only</strong> to the provided address.
                    Admin approves within ~2 hours.
                  </p>
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm disabled:opacity-40 hover:brightness-105 transition-all">
                  {isSubmitting ? "Submitting…" : "Submit Deposit Request"}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
