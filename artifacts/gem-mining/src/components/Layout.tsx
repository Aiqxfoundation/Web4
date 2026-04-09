import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Pickaxe, ArrowRightLeft, Wallet, Users, UserCircle,
  ShieldAlert, LogOut, Menu, X, Layers, Info, FileText,
  Shield, ScrollText, Link2, Zap, Gem, BarChart3, ChevronRight,
  BookOpen, Globe
} from "lucide-react";
import { cn, formatGems } from "@/lib/utils";
import { useGetWallet, useLogout } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Badge } from "./ui";
import { GemIcon } from "./GemIcon";
import { motion, AnimatePresence } from "framer-motion";

const BOTTOM_TABS = [
  { href: "/mining",   label: "Mine",    icon: Pickaxe },
  { href: "/levels",   label: "Levels",  icon: Layers },
  { href: "/convert",  label: "Convert", icon: ArrowRightLeft },
  { href: "/wallet",   label: "Wallet",  icon: Wallet },
  { href: "/profile",  label: "Profile", icon: UserCircle },
];

const SIDEBAR_NAV = [
  { href: "/mining",   label: "Mining",      icon: Pickaxe },
  { href: "/levels",   label: "Levels",      icon: Layers },
  { href: "/wallet",   label: "Wallet",      icon: Wallet },
  { href: "/convert",  label: "Convert",     icon: ArrowRightLeft },
  { href: "/referral", label: "Referrals",   icon: Users },
  { href: "/profile",  label: "Profile",     icon: UserCircle },
];

// ─── Info Drawer Pages ──────────────────────────────────────────────────────
const INFO_PAGES = [
  { id: "about",       label: "About Project",              icon: Info },
  { id: "documents",   label: "Documents",                  icon: FileText },
  { id: "privacy",     label: "Privacy Policy",             icon: Shield },
  { id: "terms",       label: "Terms of Service",           icon: ScrollText },
  { id: "blockchain",  label: "Blockchain",                 icon: Link2 },
  { id: "utilities",   label: "Upcoming Utilities & Use Cases", icon: Zap },
  { id: "ptc-gems",    label: "PTC Conversion & Gems",      icon: Gem },
  { id: "levels-info", label: "Levels & All Features",      icon: BarChart3 },
];

const INFO_CONTENT: Record<string, { title: string; content: React.ReactNode }> = {
  about: {
    title: "About Peridot Mining",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p>
          <span className="text-white font-semibold">Peridot Mining</span> is a next-generation decentralised gem mining ecosystem built on the BNB Smart Chain (BEP-20). Our platform bridges the gap between yield-generating digital assets and community-powered blockchain utility.
        </p>
        <p>
          Users deposit USDT, mine Peridot Gems over configurable sessions, and convert their accumulated Gems into PTC tokens — the native utility token of the Peridot ecosystem. The more you invest, the higher your mining level and the faster your gems accumulate.
        </p>
        <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold text-xs uppercase tracking-widest">Core Stats</p>
          <p>· Mining Periods: 3-hour (Free) / 24-hour (Paid)</p>
          <p>· Gem Rate: Up to 10,000,000 gems per $100 USDT over 180 days</p>
          <p>· PTC Token: BEP-20 on BNB Smart Chain</p>
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
        {[
          { title: "Whitepaper v1.0", desc: "Full technical and economic overview of the PTC ecosystem", icon: BookOpen },
          { title: "Tokenomics Report", desc: "PTC supply, distribution schedule, and halving mechanics", icon: BarChart3 },
          { title: "Mining Mechanics Guide", desc: "How sessions, levels, and gem rates work", icon: Pickaxe },
          { title: "Referral Commission Structure", desc: "2-tier referral tree and KYC-gated reward system", icon: Users },
          { title: "Smart Contract Audit", desc: "Third-party security audit of PTC BEP-20 contract", icon: Shield },
        ].map((doc, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <doc.icon size={16} style={{ color: "#f97316" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{doc.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{doc.desc}</p>
            </div>
          </div>
        ))}
        <p className="text-xs text-white/30 text-center pt-2">Full document portal coming soon.</p>
      </div>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p className="text-white/40 text-xs">Last updated: April 2026</p>
        <p><span className="text-white font-semibold">Data We Collect:</span> Username, hashed password, recovery information, referral linkage, and activity timestamps. We do not collect real names, email addresses, or government IDs through the platform interface.</p>
        <p><span className="text-white font-semibold">KYC Verification:</span> KYC (Know Your Customer) verification is a voluntary on-chain action performed by minting a Verification Badge (20 PTC). This unlocks withdrawal capabilities and referral commission payouts.</p>
        <p><span className="text-white font-semibold">Data Storage:</span> All data is stored in encrypted databases. Transaction screenshots submitted for deposit verification are stored temporarily and purged after admin review.</p>
        <p><span className="text-white font-semibold">Third Parties:</span> We do not sell or share your data with third parties. Blockchain transactions are public by nature on the BNB Smart Chain.</p>
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
        <p><span className="text-white font-semibold">2. Mining & Rewards:</span> Mining rates and session durations are subject to change. Gem accumulation is based on real-time calculations and may vary slightly due to network conditions.</p>
        <p><span className="text-white font-semibold">3. Deposits & Withdrawals:</span> USDT deposits require admin approval. Withdrawals are processed within 24–72 hours. Minimum withdrawal thresholds apply.</p>
        <p><span className="text-white font-semibold">4. Referral Commissions:</span> USDT commissions (15%) are credited upon deposit approval, only to KYC-verified uplines. Gem commissions are locked until both parties complete verification.</p>
        <p><span className="text-white font-semibold">5. Risk Disclaimer:</span> Cryptocurrency investments carry inherent risk. Past performance does not guarantee future results. Peridot Mining is not a financial advisor.</p>
        <p><span className="text-white font-semibold">6. Account Termination:</span> We reserve the right to suspend accounts engaged in fraudulent activity, manipulation, or violation of these terms.</p>
      </div>
    ),
  },
  blockchain: {
    title: "Blockchain",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold">Network: BNB Smart Chain (BSC)</p>
          <p>· Standard: BEP-20</p>
          <p>· Token Symbol: PTC</p>
          <p>· Decimals: 18</p>
          <p>· Block Time: ~3 seconds</p>
        </div>
        <p><span className="text-white font-semibold">Why BSC?</span> BNB Smart Chain offers low transaction fees (typically under $0.01), fast finality, and wide wallet compatibility — making it ideal for micro-reward systems like gem mining.</p>
        <p><span className="text-white font-semibold">USDT on BEP-20:</span> All deposits and withdrawals use Tether USD (USDT) on the BEP-20 standard. Ensure you always use the BEP-20 network when depositing — sending on other networks will result in lost funds.</p>
        <p><span className="text-white font-semibold">PTC Token:</span> PTC is the native utility token of the Peridot ecosystem. It is earned through gem conversion and used for KYC badge minting, governance participation, and future utility features.</p>
        <p><span className="text-white font-semibold">Transparency:</span> All token transactions are publicly verifiable on BscScan. Contract addresses will be published in the Documents section.</p>
      </div>
    ),
  },
  utilities: {
    title: "Upcoming Utilities & Use Cases",
    content: (
      <div className="space-y-3">
        {[
          { phase: "Q2 2026", title: "PTC DEX Listing", desc: "PTC listed on decentralised exchanges for open-market trading and liquidity provision." },
          { phase: "Q3 2026", title: "NFT Gem Badges", desc: "Earn exclusive on-chain NFT badges based on your mining level and gem milestones." },
          { phase: "Q3 2026", title: "Governance Voting", desc: "PTC holders vote on protocol parameters including mining rates and level thresholds." },
          { phase: "Q4 2026", title: "PTC Staking Pools", desc: "Stake PTC to earn compounded rewards and unlock premium mining multipliers." },
          { phase: "Q4 2026", title: "Cross-Chain Bridge", desc: "Bridge PTC between BSC, Ethereum, and Polygon for maximum liquidity flexibility." },
          { phase: "2027", title: "Peridot Marketplace", desc: "A peer-to-peer marketplace for trading gems, badges, and mining power boosts." },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="shrink-0 pt-0.5">
              <span className="text-[10px] font-black px-2 py-1 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>{item.phase}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  "ptc-gems": {
    title: "PTC Conversion & Gems",
    content: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <div className="rounded-2xl p-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold mb-2">Current Conversion Rate</p>
          <p className="text-2xl font-black font-mono" style={{ color: "#f97316" }}>100,000 Gems = 1 PTC</p>
          <p className="text-xs text-white/40 mt-1">Rate doubles after 1M PTC have been converted (Dynamic Halving)</p>
        </div>
        <p><span className="text-white font-semibold">What are Gems?</span> Peridot Gems are the in-platform mining reward unit. They accumulate in real-time during active mining sessions and are stored in your gem balance.</p>
        <p><span className="text-white font-semibold">Converting Gems to PTC:</span> Head to the Convert page to exchange your accumulated gems for PTC tokens at the current rate. PTC is credited instantly to your wallet balance.</p>
        <p><span className="text-white font-semibold">Dynamic Halving:</span> Once 1,000,000 PTC has been converted by all users platform-wide, the conversion rate doubles (you need more gems per PTC). This creates natural scarcity and rewards early participants.</p>
        <p><span className="text-white font-semibold">Gem Rate by Level:</span></p>
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
        <p><span className="text-white font-semibold">8 Mining Levels</span> — from Free Node to Sovereign. Each level requires a USDT investment threshold and unlocks faster gem accumulation through a level multiplier.</p>
        <div className="space-y-2">
          {[
            { name: "Free Node",      level: 0, invest: "Free",   mult: "1×",   rate: "~782 gems/day" },
            { name: "Miner I",        level: 1, invest: "$100",   mult: "1.0×", rate: "10M/day/100 USDT" },
            { name: "Miner II",       level: 2, invest: "$200",   mult: "1.2×", rate: "12M/day/100 USDT" },
            { name: "Miner III",      level: 3, invest: "$300",   mult: "1.5×", rate: "15M/day/100 USDT" },
            { name: "Senior Miner",   level: 4, invest: "$350",   mult: "1.8×", rate: "18M/day/100 USDT" },
            { name: "Master Miner",   level: 5, invest: "$400",   mult: "2.0×", rate: "20M/day/100 USDT" },
            { name: "Elite Miner",    level: 6, invest: "$450",   mult: "2.5×", rate: "25M/day/100 USDT" },
            { name: "Sovereign",      level: 7, invest: "$500+",  mult: "3.0×", rate: "30M/day/100 USDT" },
          ].map((lv) => (
            <div key={lv.level} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>{lv.level}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{lv.name}</p>
                <p className="text-[10px] text-white/35">{lv.rate}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-white/60">{lv.invest}</p>
                <p className="text-[10px] font-bold" style={{ color: "#f97316" }}>{lv.mult}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3 space-y-1.5" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <p className="text-white font-semibold text-xs">Key Features</p>
          <p>· KYC Verification Badge (20 PTC) — unlocks withdrawals & commissions</p>
          <p>· 2-Tier Referral System — 15% USDT + gem commissions</p>
          <p>· Dynamic Halving — gem-to-PTC rate doubles after 1M PTC converted</p>
          <p>· 24-hour mining sessions for paid levels</p>
          <p>· Real-time gem counter with smooth animation</p>
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
            {/* Header */}
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

            {/* Content */}
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
                        style={{ border: "1px solid transparent" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.12)" }}>
                            <page.icon size={16} style={{ color: "rgba(249,115,22,0.7)" }} />
                          </div>
                          <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{page.label}</span>
                        </div>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] text-white/20 text-center">Peridot Mining · PTC Ecosystem © 2026</p>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const SidebarLinks = () => (
    <div className="space-y-0.5 mt-4">
      {SIDEBAR_NAV.map((item) => {
        const active = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm",
              active
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon size={18} className={active ? "text-primary" : "text-muted-foreground"} />
            {item.label}
          </Link>
        );
      })}
      {user.isAdmin && (
        <Link
          href="/admin"
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm mt-2",
            location === "/admin"
              ? "bg-primary/12 text-primary"
              : "text-red-400/70 hover:bg-secondary hover:text-red-300"
          )}
        >
          <ShieldAlert size={18} />
          Admin
        </Link>
      )}

      {/* Info divider */}
      <div className="pt-3 pb-1">
        <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* Info button in sidebar */}
      <button
        onClick={() => { setSidebarOpen(false); setInfoOpen(true); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 font-medium text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <Info size={18} className="text-muted-foreground" />
        Information
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
            alt="PTC"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-foreground text-base tracking-tight">Peridot Mining</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          <SidebarLinks />
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{user.username}</span>
            <Badge variant={user.isActive ? "success" : "warning"}>
              {user.isActive ? "Active" : "Free"}
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">Gems</span>
            <span className="text-primary font-mono text-xs font-bold">
              {wallet ? formatGems(wallet.gemsBalance) : "—"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-red-400 hover:text-red-300 text-xs font-medium transition-colors rounded-md hover:bg-red-400/10"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Drawer ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform duration-300 md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
              alt="PTC"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-foreground">Peridot Mining</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">
            <X size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          <SidebarLinks />
        </div>
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground px-2 mb-2">{user.username}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-2 py-1.5 text-red-400 text-xs font-medium hover:bg-red-400/10 rounded-md"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Info Drawer ─── */}
      <InfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} />

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
              alt="PTC"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-foreground text-sm">Peridot Mining</span>
          </div>
          <div className="flex items-center gap-2">
            {wallet && (
              <span className="font-mono text-xs font-bold flex items-center gap-1" style={{ color: "#f97316" }}>
                <GemIcon size={13} />
                {formatGems(wallet.gemsBalance)}
              </span>
            )}
            {/* Info button */}
            <button
              onClick={() => setInfoOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
            >
              <Info size={15} style={{ color: "#f97316" }} />
            </button>
            <button onClick={() => setSidebarOpen(true)} className="text-foreground ml-1">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 custom-scrollbar">
          {children}
        </main>

        {/* ─── Mobile Bottom Tab Bar ─── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-border">
          <div className="flex items-center justify-around px-2 py-1.5">
            {BOTTOM_TABS.map((tab) => {
              const active = location === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[52px]"
                >
                  <tab.icon
                    size={22}
                    className={cn(
                      "transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {tab.label}
                  </span>
                  {active && (
                    <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
