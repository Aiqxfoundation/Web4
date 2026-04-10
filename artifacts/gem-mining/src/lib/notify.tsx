import React from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Gem,
  Copy,
  Pickaxe,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  UserCheck,
  Wallet,
  Ban,
  RotateCcw,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";

type NotifyVariant = "success" | "error" | "warning" | "info";

interface NotifyConfig {
  title: string;
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  variant?: NotifyVariant;
}

const VARIANT_STYLES: Record<
  NotifyVariant,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    bar: string;
    glow: string;
  }
> = {
  success: {
    bg: "linear-gradient(135deg, rgba(16,18,28,0.98) 0%, rgba(16,24,22,0.98) 100%)",
    border: "rgba(16,185,129,0.2)",
    iconBg: "rgba(16,185,129,0.12)",
    iconColor: "#10b981",
    bar: "#10b981",
    glow: "0 0 0 1px rgba(16,185,129,0.08) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.06)",
  },
  error: {
    bg: "linear-gradient(135deg, rgba(16,18,28,0.98) 0%, rgba(24,14,14,0.98) 100%)",
    border: "rgba(239,68,68,0.2)",
    iconBg: "rgba(239,68,68,0.12)",
    iconColor: "#ef4444",
    bar: "#ef4444",
    glow: "0 0 0 1px rgba(239,68,68,0.08) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(239,68,68,0.06)",
  },
  warning: {
    bg: "linear-gradient(135deg, rgba(16,18,28,0.98) 0%, rgba(24,20,10,0.98) 100%)",
    border: "rgba(245,158,11,0.2)",
    iconBg: "rgba(245,158,11,0.12)",
    iconColor: "#f59e0b",
    bar: "#f59e0b",
    glow: "0 0 0 1px rgba(245,158,11,0.08) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(245,158,11,0.06)",
  },
  info: {
    bg: "linear-gradient(135deg, rgba(16,18,28,0.98) 0%, rgba(18,16,26,0.98) 100%)",
    border: "rgba(249,115,22,0.2)",
    iconBg: "rgba(249,115,22,0.12)",
    iconColor: "#f97316",
    bar: "#f97316",
    glow: "0 0 0 1px rgba(249,115,22,0.08) inset, 0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(249,115,22,0.06)",
  },
};

function ToastContent({
  title,
  description,
  icon,
  variant = "info",
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: NotifyVariant;
}) {
  const s = VARIANT_STYLES[variant];

  return (
    <div
      style={{
        display: "flex",
        alignItems: description ? "flex-start" : "center",
        gap: "12px",
        padding: "14px 16px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "14px",
        boxShadow: s.glow,
        backdropFilter: "blur(20px)",
        position: "relative",
        overflow: "hidden",
        minWidth: "300px",
        maxWidth: "380px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: s.bar,
          borderRadius: "14px 0 0 14px",
          boxShadow: `0 0 8px ${s.bar}60`,
        }}
      />

      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: s.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `1px solid ${s.border}`,
          color: s.iconColor,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13.5px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            lineHeight: "1.3",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "12px",
              color: "rgba(255,255,255,0.45)",
              lineHeight: "1.5",
              fontWeight: 400,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function show(config: NotifyConfig) {
  const { title, description, duration = 3500, icon, variant = "info" } = config;

  return toast.custom(
    () => (
      <ToastContent
        title={title}
        description={description}
        icon={icon}
        variant={variant}
      />
    ),
    { duration },
  );
}

export const notify = {
  success(title: string, description?: string, duration?: number) {
    return show({
      title,
      description,
      duration,
      variant: "success",
      icon: <CheckCircle2 size={18} />,
    });
  },

  error(title: string, description?: string, duration?: number) {
    return show({
      title,
      description,
      duration: duration ?? 4500,
      variant: "error",
      icon: <XCircle size={18} />,
    });
  },

  warning(title: string, description?: string, duration?: number) {
    return show({
      title,
      description,
      duration,
      variant: "warning",
      icon: <AlertTriangle size={18} />,
    });
  },

  info(title: string, description?: string, duration?: number) {
    return show({
      title,
      description,
      duration,
      variant: "info",
      icon: <Info size={18} />,
    });
  },

  miningStarted() {
    return show({
      title: "Mining Session Active",
      description: "Peridot Gems are now accumulating. Come back to claim your rewards.",
      duration: 4000,
      variant: "success",
      icon: <Pickaxe size={18} />,
    });
  },

  miningError(msg?: string) {
    return show({
      title: "Mining Failed",
      description: msg || "Unable to start your mining session. Please try again.",
      duration: 4500,
      variant: "error",
      icon: <Pickaxe size={18} />,
    });
  },

  noGemsYet() {
    return show({
      title: "No Gems to Claim",
      description: "Your mining session hasn't accumulated any gems yet. Check back soon.",
      duration: 3500,
      variant: "warning",
      icon: <Gem size={18} />,
    });
  },

  gemsClaimed(amount: string) {
    return show({
      title: "Gems Claimed Successfully",
      description: `${amount} Peridot Gems added to your balance. Mining has restarted.`,
      duration: 5000,
      variant: "success",
      icon: <Gem size={18} />,
    });
  },

  claimError(msg?: string) {
    return show({
      title: "Claim Failed",
      description: msg || "Could not process your gem claim. Please try again.",
      duration: 4500,
      variant: "error",
      icon: <Gem size={18} />,
    });
  },

  gemsConverted() {
    return show({
      title: "Conversion Successful",
      description: "Your Peridot Gems have been converted to PTC and added to your balance.",
      duration: 4000,
      variant: "success",
      icon: <Coins size={18} />,
    });
  },

  conversionError(msg?: string) {
    return show({
      title: "Conversion Failed",
      description: msg || "Failed to convert gems. Please verify your balance and try again.",
      duration: 4500,
      variant: "error",
      icon: <Coins size={18} />,
    });
  },

  copied(label = "Copied to clipboard") {
    return show({
      title: label,
      description: "The value has been copied and is ready to paste.",
      duration: 2500,
      variant: "success",
      icon: <Copy size={18} />,
    });
  },

  depositSubmitted() {
    return show({
      title: "Deposit Submitted",
      description: "Your deposit is under review. Admin will confirm within 24 hours.",
      duration: 5000,
      variant: "info",
      icon: <ArrowDownLeft size={18} />,
    });
  },

  depositAssigned() {
    return show({
      title: "Deposit Address Ready",
      description: "A BSC wallet address has been assigned to your account.",
      duration: 4000,
      variant: "success",
      icon: <Wallet size={18} />,
    });
  },

  depositDismissed() {
    return show({
      title: "Request Dismissed",
      description: "The deposit address request has been cleared.",
      duration: 2500,
      variant: "info",
      icon: <RotateCcw size={18} />,
    });
  },

  withdrawalSubmitted() {
    return show({
      title: "Withdrawal Requested",
      description: "Your withdrawal is queued for admin approval. Processing takes up to 24 hours.",
      duration: 5000,
      variant: "info",
      icon: <ArrowUpRight size={18} />,
    });
  },

  transferSent(amount: string, to: string) {
    return show({
      title: "Transfer Successful",
      description: `${amount} PTC sent to ${to.slice(0, 8)}...${to.slice(-6)}.`,
      duration: 4000,
      variant: "success",
      icon: <ArrowUpRight size={18} />,
    });
  },

  investSuccess(msg?: string) {
    return show({
      title: "Investment Confirmed",
      description: msg || "Your USDT has been invested and your mining level upgraded.",
      duration: 4000,
      variant: "success",
      icon: <Coins size={18} />,
    });
  },

  referralCopied() {
    return show({
      title: "Referral Link Copied",
      description: "Share this link to earn rewards when your referrals deposit.",
      duration: 3000,
      variant: "success",
      icon: <Copy size={18} />,
    });
  },

  referralGemsClaimed(amount: string) {
    return show({
      title: "Referral Gems Claimed",
      description: `${amount} referral gems have been added to your balance.`,
      duration: 4000,
      variant: "success",
      icon: <Gem size={18} />,
    });
  },

  referralApplied(msg?: string) {
    return show({
      title: "Referral Code Applied",
      description: msg || "You are now linked to your referrer.",
      duration: 3500,
      variant: "success",
      icon: <UserCheck size={18} />,
    });
  },

  accountCreated() {
    return show({
      title: "Account Created",
      description: "Welcome to Peridot Mining. Your mining journey begins now.",
      duration: 4000,
      variant: "success",
      icon: <UserCheck size={18} />,
    });
  },

  passwordRecovered() {
    return show({
      title: "Password Reset",
      description: "Your password has been updated. You can now login.",
      duration: 4000,
      variant: "success",
      icon: <ShieldCheck size={18} />,
    });
  },

  adminUserUpdated() {
    return show({
      title: "User Updated",
      description: "The user's account status has been changed.",
      duration: 3000,
      variant: "success",
      icon: <UserCheck size={18} />,
    });
  },

  adminBalanceUpdated() {
    return show({
      title: "Balance Updated",
      description: "The user's balance has been adjusted successfully.",
      duration: 3000,
      variant: "success",
      icon: <Coins size={18} />,
    });
  },

  adminDepositAction(action: string) {
    return show({
      title: `Deposit ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
      description: `The deposit request has been ${action}d and the user has been notified.`,
      duration: 3500,
      variant: action === "approve" ? "success" : "warning",
      icon: action === "approve" ? <CheckCircle2 size={18} /> : <Ban size={18} />,
    });
  },

  adminWithdrawalAction(action: string) {
    return show({
      title: `Withdrawal ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
      description: `The withdrawal request has been ${action}d.`,
      duration: 3500,
      variant: action === "approve" ? "success" : "warning",
      icon: action === "approve" ? <CheckCircle2 size={18} /> : <Ban size={18} />,
    });
  },

  adminAddressAdded() {
    return show({
      title: "Address Added",
      description: "The new deposit wallet address is now active.",
      duration: 3000,
      variant: "success",
      icon: <Plus size={18} />,
    });
  },

  adminAddressUpdated() {
    return show({
      title: "Address Updated",
      description: "The wallet address has been saved.",
      duration: 3000,
      variant: "success",
      icon: <Pencil size={18} />,
    });
  },

  adminAddressToggled(isActive: boolean) {
    return show({
      title: isActive ? "Address Deactivated" : "Address Activated",
      description: isActive
        ? "This address will no longer be assigned to users."
        : "This address is now available for assignment.",
      duration: 3000,
      variant: isActive ? "warning" : "success",
      icon: isActive ? <Ban size={18} /> : <CheckCircle2 size={18} />,
    });
  },

  adminAddressDeleted() {
    return show({
      title: "Address Deleted",
      description: "The wallet address has been permanently removed.",
      duration: 3000,
      variant: "error",
      icon: <Trash2 size={18} />,
    });
  },

  adminScreenshotDeleted() {
    return show({
      title: "Screenshot Removed",
      description: "The deposit screenshot has been deleted from the system.",
      duration: 3000,
      variant: "info",
      icon: <Trash2 size={18} />,
    });
  },

  badgeMintError(msg?: string) {
    return show({
      title: "Badge Mint Failed",
      description: msg || "Could not mint your verification badge. Please try again.",
      duration: 4500,
      variant: "error",
      icon: <ShieldCheck size={18} />,
    });
  },
};
