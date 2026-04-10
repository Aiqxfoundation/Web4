import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Pickaxe, ArrowRightLeft, Wallet, Users, UserCircle,
  ShieldAlert, LogOut, X, Layers, Info, FileText,
  Shield, ScrollText, Zap, Gem, BarChart3, ChevronRight,
  BookOpen, Globe
} from "lucide-react";
import { cn, formatGems } from "@/lib/utils";
import { useGetWallet, useLogout } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { GemIcon } from "./GemIcon";
import { motion, AnimatePresence } from "framer-motion";

const BOTTOM_TABS = [
  { href: "/mining",   label: "Mine",    icon: Pickaxe },
  { href: "/levels",   label: "Levels",  icon: Layers },
  { href: "/convert",  label: "Convert", icon: ArrowRightLeft },
  { href: "/wallet",   label: "Wallet",  icon: Wallet },
  { href: "/referral", label: "Refer",   icon: Users },
  { href: "/profile",  label: "Profile", icon: UserCircle },
];

// ─── Info Drawer Pages ──────────────────────────────────────────────────────
const INFO_PAGES = [
  { id: "about",       label: "About Project",     icon: Info },
  { id: "documents",   label: "Documents",          icon: FileText },
  { id: "privacy",     label: "Privacy Policy",     icon: Shield },
  { id: "terms",       label: "Terms of Service",   icon: ScrollText },
  { id: "ptc-gems",    label: "PTC & Gem System",   icon: Gem },
  { id: "levels-info", label: "Levels & Features",  icon: BarChart3 },
];

const INFO_CONTENT: Record<string, { title: string; content: React.ReactNode }> = {
  about: {
    title: "About Peridot Mining",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p>
          <span className="text-white font-semibold">Peridot Mining</span> is a next-generation decentralised gem mining ecosystem. Our platform connects yield-generating digital assets with community-powered token rewards.
        </p>
        <p>
          Users deposit USDT, mine Peridot Gems over configurable sessions, and convert their accumulated Gems into PTC tokens — the native utility token of the Peridot ecosystem. The more you invest, the higher your mining level and the faster your gems accumulate.
        </p>
        <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold text-xs uppercase tracking-widest">Core Facts</p>
          <p>· Mining Periods: 3-hour (Free) / 24-hour (Paid)</p>
          <p>· Up to 10,000,000 gems per $100 USDT over 180 days</p>
          <p>· PTC Token: Native Peridot ecosystem token</p>
          <p>· Referral Levels: 2-tier commission system</p>
        </div>
        <p>
          Our mission is to create a sustainable, transparent, and rewarding ecosystem where every participant — from free miners to sovereign-level investors — can grow their digital wealth.
        </p>
      </div>
    ),
  },
  documents: {
    title: "Documents",
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <BarChart3 size={18} style={{ color: "#f97316" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Tokenomics</p>
            <p className="text-xs text-white/40 mt-0.5">PTC supply, distribution & gem conversion mechanics</p>
          </div>
          <span className="text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
            Coming Soon
          </span>
        </div>
        {[
          { title: "Whitepaper", desc: "Full technical and economic overview", icon: BookOpen },
          { title: "Mining Mechanics", desc: "Sessions, levels, and gem rate guide", icon: Pickaxe },
          { title: "Referral Structure", desc: "2-tier referral and commission guide", icon: Users },
          { title: "Smart Contract Audit", desc: "Third-party security audit of PTC contract", icon: Shield },
        ].map((doc, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <doc.icon size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/50">{doc.title}</p>
              <p className="text-xs text-white/25 mt-0.5">{doc.desc}</p>
            </div>
            <span className="text-[9px] font-bold text-white/20 shrink-0">Pending</span>
          </div>
        ))}
        <p className="text-xs text-white/25 text-center pt-2">Full document portal releasing soon.</p>
      </div>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: April 2026</p>
        <p><span className="text-white font-semibold">Data We Collect:</span> Username, hashed password, recovery information, referral linkage, and activity timestamps. We do not collect real names, email addresses, or government IDs through the platform interface.</p>
        <p><span className="text-white font-semibold">KYC Verification:</span> KYC verification is a voluntary action that unlocks withdrawal capabilities and referral commission payouts. Verification status is stored securely.</p>
        <p><span className="text-white font-semibold">Data Storage:</span> All data is stored in encrypted databases. Transaction screenshots submitted for deposit verification are stored temporarily and purged after admin review.</p>
        <p><span className="text-white font-semibold">Third Parties:</span> We do not sell or share your data with third parties.</p>
        <p><span className="text-white font-semibold">Your Rights:</span> You may request account deletion at any time. Contact support through the platform profile page.</p>
      </div>
    ),
  },
  terms: {
    title: "Terms of Service",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: April 2026</p>
        <p><span className="text-white font-semibold">1. Eligibility:</span> You must be 18+ years old to use Peridot Mining. Use is prohibited where restricted by local laws.</p>
        <p><span className="text-white font-semibold">2. Mining & Rewards:</span> Mining rates and session durations are subject to change. Gem accumulation is based on real-time calculations.</p>
        <p><span className="text-white font-semibold">3. Deposits & Withdrawals:</span> USDT deposits require admin approval. Withdrawals are processed within 24–72 hours. Minimum withdrawal thresholds apply.</p>
        <p><span className="text-white font-semibold">4. Referral Commissions:</span> USDT commissions (15%) are credited upon deposit approval, only to KYC-verified uplines. Gem commissions are locked until both parties complete verification.</p>
        <p><span className="text-white font-semibold">5. Risk Disclaimer:</span> Cryptocurrency investments carry inherent risk. Past performance does not guarantee future results. Peridot Mining is not a financial advisor.</p>
        <p><span className="text-white font-semibold">6. Account Termination:</span> We reserve the right to suspend accounts engaged in fraudulent activity, manipulation, or violation of these terms.</p>
      </div>
    ),
  },
  "ptc-gems": {
    title: "PTC & Gem System",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <div className="rounded-2xl p-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold mb-2">Current Conversion Rate</p>
          <p className="text-2xl font-black font-mono" style={{ color: "#f97316" }}>100,000 Gems = 1 PTC</p>
          <p className="text-xs text-white/40 mt-1">Rate adjusts dynamically after 1M PTC converted (Halving)</p>
        </div>
        <p><span className="text-white font-semibold">What are Gems?</span> Peridot Gems are the in-platform mining reward unit. They accumulate in real-time during active mining sessions and are stored in your gem balance.</p>
        <p><span className="text-white font-semibold">Converting Gems to PTC:</span> Head to the Convert page to exchange your accumulated gems for PTC tokens at the current rate. PTC is credited instantly to your wallet balance.</p>
        <p><span className="text-white font-semibold">Dynamic Halving:</span> Once 1,000,000 PTC has been converted by all users platform-wide, the conversion rate doubles. This creates natural scarcity and rewards early participants.</p>
        <div className="space-y-1">
          {[
            ["Free Node", "~285,714 gems/year (free)"],
            ["Miner I–III", "10M gems per $100 USDT over 180 days"],
            ["Senior–Sovereign", "Multiplied rates based on investment tier"],
          ].map(([level, rate], i) => (
            <div key={i} className="flex justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.025)" }}>
              <span className="text-white/60">{level}</span>
              <span className="font-mono text-white/80 text-right" style={{ fontSize: 11 }}>{rate}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  "levels-info": {
    title: "Levels & All Features",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p><span className="text-white font-semibold">8 Mining Levels</span> — from Free Node to Sovereign. Each level requires a USDT investment threshold and unlocks faster gem accumulation.</p>
        <div className="space-y-2">
          {[
            { name: "Free Node",      level: 0, invest: "Free",   rate: "~782 gems/day" },
            { name: "Miner I",        level: 1, invest: "$100",   rate: "High rate" },
            { name: "Miner II",       level: 2, invest: "$200",   rate: "1.2× boost" },
            { name: "Miner III",      level: 3, invest: "$300",   rate: "1.5× boost" },
            { name: "Senior Miner",   level: 4, invest: "$350",   rate: "1.8× boost" },
            { name: "Master Miner",   level: 5, invest: "$400",   rate: "2.0× boost" },
            { name: "Elite Miner",    level: 6, invest: "$450",   rate: "2.5× boost" },
            { name: "Sovereign",      level: 7, invest: "$500+",  rate: "3.0× boost" },
          ].map((lv) => (
            <div key={lv.level} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>{lv.level}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{lv.name}</p>
                <p className="text-[10px] text-white/35">{lv.rate}</p>
              </div>
              <p className="text-xs font-mono text-white/50">{lv.invest}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3 space-y-1.5" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold text-xs">Key Features</p>
          <p>· KYC Verification — unlocks withdrawals & commissions</p>
          <p>· 2-Tier Referral System — 15% USDT + gem commissions</p>
          <p>· Dynamic Halving — gem-to-PTC rate adjusts with volume</p>
          <p>· 24-hour mining sessions for paid levels</p>
        </div>
      </div>
    ),
  },
};

// ─── Info Drawer Component ──────────────────────────────────────────────────
function InfoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activePage, setActivePage] = useState<string | null>(null);

  const handleBack = () => setActivePage(null);
  const handleClose = () => { setActivePage(null); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.aside
            key="drawer"
            className="fixed inset-y-0 right-0 z-50 flex flex-col"
            style={{ width: 320, background: "linear-gradient(180deg, #0d0e15 0%, #0a0b11 100%)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {activePage ? (
                <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-semibold">
                  <ChevronRight size={16} className="rotate-180" /> Back
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <Globe size={14} style={{ color: "#f97316" }} />
                  </div>
                  <span className="font-bold text-white text-sm">Information</span>
                </div>
              )}
              <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activePage ? (
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.18 }}
                    className="px-5 py-4"
                  >
                    <h2 className="text-base font-black text-white mb-4">{INFO_CONTENT[activePage]?.title}</h2>
                    {INFO_CONTENT[activePage]?.content}
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.18 }}
                    className="p-3 space-y-1"
                  >
                    {INFO_PAGES.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setActivePage(page.id)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all hover:bg-white/[0.04] group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                            <page.icon size={16} style={{ color: "rgba(249,115,22,0.7)" }} />
                          </div>
                          <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{page.label}</span>
                        </div>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-white/20 text-center">Peridot Mining © 2026</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────
export function Layout({ children, user }: { children: React.ReactNode; user: UserProfile }) {
  const [location] = useLocation();
  const [infoOpen, setInfoOpen] = useState(false);
  const { data: wallet } = useGetWallet();
  const { mutate: logout } = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        localStorage.removeItem("etr_token");
        setLocation("/login");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ─── Top Header (all screen sizes) ─── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-border"
        style={{ background: "rgba(10,11,17,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
            alt="Peridot"
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-foreground text-sm tracking-tight">Peridot Mining</span>
        </div>

        <div className="flex items-center gap-2.5">
          {wallet && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <GemIcon size={12} />
              <span className="font-mono text-xs font-bold" style={{ color: "#f97316" }}>
                {formatGems(wallet.gemsBalance)}
              </span>
            </div>
          )}

          <button
            onClick={() => setInfoOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Info size={15} className="text-white/50" />
          </button>

          {user.isAdmin && (
            <Link href="/admin">
              <button className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <ShieldAlert size={15} style={{ color: "rgba(239,68,68,0.7)" }} />
              </button>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <LogOut size={14} className="text-white/40" />
          </button>
        </div>
      </header>

      {/* ─── Info Drawer ─── */}
      <InfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />

      {/* ─── Page Content ─── */}
      <main className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
        {children}
      </main>

      {/* ─── Bottom Tab Bar ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border"
        style={{ background: "rgba(10,11,17,0.97)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-around px-1 py-1.5 max-w-2xl mx-auto">
          {BOTTOM_TABS.map((tab) => {
            const active = location === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[44px] flex-1"
              >
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                  active ? "bg-primary/15" : "bg-transparent"
                )}>
                  <tab.icon
                    size={20}
                    className={cn(
                      "transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors leading-none",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
