import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Pickaxe, ArrowRightLeft, Wallet, Users, UserCircle,
  ShieldAlert, LogOut, Menu, X, Layers
} from "lucide-react";
import { cn, formatGems } from "@/lib/utils";
import { useGetWallet, useLogout } from "@workspace/api-client-react";
import type { UserProfile } from "@workspace/api-client-react";
import { Badge } from "./ui";
import { GemIcon } from "./GemIcon";

// Bottom tabs (mobile) — main 5 actions
const BOTTOM_TABS = [
  { href: "/mining",   label: "Mine",    icon: Pickaxe },
  { href: "/levels",   label: "Levels",  icon: Layers },
  { href: "/convert",  label: "Convert", icon: ArrowRightLeft },
  { href: "/wallet",   label: "Wallet",  icon: Wallet },
  { href: "/profile",  label: "Profile", icon: UserCircle },
];

// Sidebar nav (desktop) — full list
const SIDEBAR_NAV = [
  { href: "/mining",   label: "Mining",      icon: Pickaxe },
  { href: "/levels",   label: "Levels",      icon: Layers },
  { href: "/wallet",   label: "Wallet",      icon: Wallet },
  { href: "/convert",  label: "Convert",     icon: ArrowRightLeft },
  { href: "/referral", label: "Referrals",   icon: Users },
  { href: "/profile",  label: "Profile",     icon: UserCircle },
];

export function Layout({ children, user }: { children: React.ReactNode; user: UserProfile }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card h-screen sticky top-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
            alt="ETR"
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-foreground text-base tracking-tight">ETR Mining</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          <SidebarLinks />
        </div>

        {/* User card */}
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
              alt="ETR"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-foreground">ETR Mining</span>
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

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}images/logo-icon.png`}
              alt="ETR"
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-foreground text-sm">ETR Mining</span>
          </div>
          <div className="flex items-center gap-3">
            {wallet && (
              <span className="font-mono text-xs font-bold flex items-center gap-1" style={{ color: "#f97316" }}>
                <GemIcon size={13} />
                {formatGems(wallet.gemsBalance)}
              </span>
            )}
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
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
