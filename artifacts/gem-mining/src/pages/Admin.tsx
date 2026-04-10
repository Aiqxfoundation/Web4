import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, Button, Badge, StatCard, Input, Label } from "@/components/ui";
import {
  useAdminGetStatsFull,
  useAdminGetUsers,
  useAdminBanUserFull,
  useAdminAdjustBalance,
  useAdminGetDepositsWithScreenshots,
  useAdminApproveDepositFull,
  useAdminRejectDepositFull,
  useAdminDeleteDepositScreenshot,
  useAdminGetWithdrawalsFull,
  useAdminApproveWithdrawalFull,
  useAdminRejectWithdrawalFull,
  useAdminGetAddresses,
  useAdminAddAddress,
  useAdminUpdateAddress,
  useAdminDeleteAddress,
  type AdminDepositFull,
  type AdminWithdrawalFull,
  type DepositAddress,
} from "@workspace/api-client-react";
import { formatCurrency, formatGems } from "@/lib/utils";
import {
  Users, UserX, UserCheck, Gem, DollarSign, Repeat, Clock, CreditCard,
  Shield, Wallet, ImageIcon, Eye, Trash2, Plus, Pencil, Check,
  X, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from "lucide-react";

type Tab = "stats" | "users" | "deposits" | "withdrawals" | "addresses";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "deposits", label: "Deposits" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "addresses", label: "Addresses" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="text-primary" /> Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Ecosystem management and monitoring dashboard.</p>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex border-b border-border w-full overflow-x-auto custom-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-4 text-sm font-medium capitalize transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "stats" && <AdminStats />}
        {tab === "users" && <AdminUsers />}
        {tab === "deposits" && <AdminDeposits />}
        {tab === "withdrawals" && <AdminWithdrawals />}
        {tab === "addresses" && <AdminAddresses />}
      </div>
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function AdminStats() {
  const { data: stats, isLoading } = useAdminGetStatsFull();
  if (isLoading) return <LoadingText />;
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={20} />} />
      <StatCard title="Active Users" value={stats.activeUsers} icon={<UserCheck size={20} />} color="text-emerald-500" />
      <StatCard title="Banned Users" value={stats.bannedUsers} icon={<UserX size={20} />} color="text-red-500" />
      <StatCard title="Total Gems Mined" value={formatGems(stats.totalGemsMined)} icon={<Gem size={20} />} color="text-primary" />
      <StatCard title="USDT Deposited" value={formatCurrency(stats.totalDepositsUsdt)} icon={<DollarSign size={20} />} color="text-emerald-500" />
      <StatCard title="PTC Converted" value={formatGems(stats.totalEtrConverted)} icon={<Repeat size={20} />} />
      <StatCard
        title="Pending Deposits"
        value={stats.pendingDeposits}
        icon={<Clock size={20} />}
        color="text-amber-500"
        className={stats.pendingDeposits > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}
      />
      <StatCard
        title="Pending Withdrawals"
        value={stats.pendingWithdrawals}
        icon={<CreditCard size={20} />}
        color="text-amber-500"
        className={stats.pendingWithdrawals > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}
      />
      <StatCard title="Active Addresses" value={`${stats.activeAddresses} / ${stats.totalAddresses}`} icon={<Wallet size={20} />} color="text-blue-500" />
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function AdminUsers() {
  const { data: users, isLoading } = useAdminGetUsers();
  const { mutate: banUser } = useAdminBanUserFull();
  const { mutate: adjustBalance } = useAdminAdjustBalance();
  const qc = useQueryClient();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [balanceInputs, setBalanceInputs] = useState<Record<number, { gems?: string; etr?: string; usdt?: string }>>({});

  const toggleExpand = (id: number) => setExpandedUser((cur) => (cur === id ? null : id));

  const handleBan = (id: number, current: boolean) => {
    banUser(
      { userId: id, banned: !current },
      {
        onSuccess: () => { toast.success("User status updated"); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to update user"),
      }
    );
  };

  const handleAdjustBalance = (id: number) => {
    const inputs = balanceInputs[id] || {};
    const data: { gemsBalance?: number; etrBalance?: number; usdtBalance?: number } = {};
    if (inputs.gems !== undefined && inputs.gems !== "") data.gemsBalance = Number(inputs.gems);
    if (inputs.etr !== undefined && inputs.etr !== "") data.etrBalance = Number(inputs.etr);
    if (inputs.usdt !== undefined && inputs.usdt !== "") data.usdtBalance = Number(inputs.usdt);
    if (!Object.keys(data).length) { toast.error("Enter at least one balance value"); return; }

    adjustBalance(
      { userId: id, ...data },
      {
        onSuccess: () => {
          toast.success("Balance updated");
          setBalanceInputs((prev) => ({ ...prev, [id]: {} }));
          qc.invalidateQueries();
        },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to update balance"),
      }
    );
  };

  if (isLoading) return <LoadingText />;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse defi-table">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground">
              <th className="p-4 font-medium border-b border-border">ID / Username</th>
              <th className="p-4 font-medium border-b border-border">Status</th>
              <th className="p-4 font-medium border-b border-border">Balances</th>
              <th className="p-4 font-medium border-b border-border text-right">Total Dep.</th>
              <th className="p-4 font-medium border-b border-border">Joined</th>
              <th className="p-4 font-medium border-b border-border text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <React.Fragment key={u.id}>
                <tr className="hover:bg-secondary/20 transition-colors border-b border-border">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{u.username}</span>
                      <span className="text-xs text-muted-foreground">#{u.id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {u.isActive ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>}
                      {u.isAdmin && <Badge variant="warning">Admin</Badge>}
                      {u.isBanned && <Badge variant="destructive">Banned</Badge>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Gems:</span>
                        <span className="text-foreground font-mono">{formatGems(u.gemsBalance)}</span>
                      </span>
                      <span className="flex justify-between gap-4">
                        <span className="text-muted-foreground">PTC:</span>
                        <span className="text-amber-400 font-mono">{u.etrBalance.toFixed(4)}</span>
                      </span>
                      <span className="flex justify-between gap-4">
                        <span className="text-muted-foreground">USDT:</span>
                        <span className="text-emerald-500 font-mono">{u.usdtBalance.toFixed(2)}</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-500">{formatCurrency(u.totalDepositUsdt)}</td>
                  <td className="p-4 text-muted-foreground text-xs">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(u.id)}
                        className="h-8 px-2 text-muted-foreground"
                        title="Adjust balance"
                      >
                        {expandedUser === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                      {!u.isAdmin && (
                        <Button
                          variant={u.isBanned ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleBan(u.id, u.isBanned)}
                          className={
                            u.isBanned
                              ? "bg-emerald-600 hover:bg-emerald-500 h-8 px-3"
                              : "text-destructive hover:bg-destructive/10 border-destructive/20 h-8 px-3"
                          }
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Balance Adjustment Panel */}
                {expandedUser === u.id && (
                  <tr className="border-b border-border">
                    <td colSpan={6} className="p-4 bg-secondary/10">
                      <div className="flex flex-wrap items-end gap-4">
                        <p className="w-full text-xs font-semibold text-muted-foreground mb-1">
                          Adjust Balances for <span className="text-foreground">{u.username}</span>
                          <span className="font-normal ml-1">(leave blank to keep current)</span>
                        </p>
                        {(["gems", "etr", "usdt"] as const).map((field) => (
                          <div key={field} className="flex flex-col gap-1 min-w-[120px]">
                            <Label className="text-xs capitalize">{field === "gems" ? "Gems" : field.toUpperCase()}</Label>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder={
                                field === "gems"
                                  ? formatGems(u.gemsBalance)
                                  : field === "etr"
                                  ? u.etrBalance.toFixed(4)
                                  : u.usdtBalance.toFixed(2)
                              }
                              value={balanceInputs[u.id]?.[field] ?? ""}
                              onChange={(e) =>
                                setBalanceInputs((prev) => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], [field]: e.target.value },
                                }))
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={() => handleAdjustBalance(u.id)}
                          className="h-8 px-4 bg-primary text-primary-foreground"
                        >
                          <Check size={14} className="mr-1" /> Apply
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Deposits ────────────────────────────────────────────────────────────────

function ScreenshotModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1 text-sm"
        >
          <X size={18} /> Close
        </button>
        <img src={src} alt="Payment screenshot" className="w-full rounded-lg shadow-2xl border border-white/10" />
      </div>
    </div>
  );
}

function AdminDeposits() {
  const { data: deposits, isLoading } = useAdminGetDepositsWithScreenshots();
  const { mutate: approve } = useAdminApproveDepositFull();
  const { mutate: reject } = useAdminRejectDepositFull();
  const { mutate: deleteScreenshot } = useAdminDeleteDepositScreenshot();
  const qc = useQueryClient();
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  const handleAction = (id: number, action: "approve" | "reject") => {
    const mutator = action === "approve" ? approve : reject;
    mutator(
      { depositId: id },
      {
        onSuccess: () => { toast.success(`Deposit ${action}d`); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Action failed"),
      }
    );
  };

  const handleDeleteScreenshot = (id: number) => {
    if (!confirm("Delete this screenshot permanently?")) return;
    deleteScreenshot(
      { depositId: id },
      {
        onSuccess: () => { toast.success("Screenshot deleted"); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to delete screenshot"),
      }
    );
  };

  if (isLoading) return <LoadingText />;

  const pending = deposits?.filter((d: AdminDepositFull) => d.status === "pending") ?? [];
  const processed = deposits?.filter((d: AdminDepositFull) => d.status !== "pending") ?? [];
  const sorted = [...pending, ...processed];

  return (
    <>
      {viewingScreenshot && (
        <ScreenshotModal src={viewingScreenshot} onClose={() => setViewingScreenshot(null)} />
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse defi-table">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground">
                <th className="p-4 font-medium border-b border-border">User</th>
                <th className="p-4 font-medium border-b border-border text-right">Amount</th>
                <th className="p-4 font-medium border-b border-border">Address / TX</th>
                <th className="p-4 font-medium border-b border-border">Screenshot</th>
                <th className="p-4 font-medium border-b border-border">Date</th>
                <th className="p-4 font-medium border-b border-border">Status</th>
                <th className="p-4 font-medium border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted?.map((d: AdminDepositFull) => (
                <tr
                  key={d.id}
                  className={`hover:bg-secondary/20 transition-colors ${d.status === "pending" ? "bg-amber-500/5" : ""}`}
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{d.username}</span>
                      <span className="text-xs text-muted-foreground">#{d.userId}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-500">{formatCurrency(d.amountUsdt)}</td>
                  <td className="p-4 max-w-[160px]">
                    {d.assignedAddress ? (
                      <span className="font-mono text-xs block truncate text-blue-400" title={d.assignedAddress}>
                        {d.assignedAddress}
                      </span>
                    ) : null}
                    {d.txHash ? (
                      <span className="font-mono text-xs block truncate text-muted-foreground" title={d.txHash}>
                        {d.txHash}
                      </span>
                    ) : null}
                    {!d.assignedAddress && !d.txHash && <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-4">
                    {d.screenshotData ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingScreenshot(d.screenshotData!)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDeleteScreenshot(d.id)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    ) : d.hasScreenshot ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ImageIcon size={13} /> Deleted
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {format(new Date(d.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        d.status === "approved" ? "success" : d.status === "rejected" ? "destructive" : "warning"
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    {d.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(d.id, "approve")}
                          className="bg-emerald-600 hover:bg-emerald-500 h-8 px-3"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(d.id, "reject")}
                          className="text-destructive border-destructive/20 h-8 px-3"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

function AdminWithdrawals() {
  const { data: withdrawals, isLoading } = useAdminGetWithdrawalsFull();
  const { mutate: approve } = useAdminApproveWithdrawalFull();
  const { mutate: reject } = useAdminRejectWithdrawalFull();
  const qc = useQueryClient();

  const handleAction = (id: number, action: "approve" | "reject") => {
    const mutator = action === "approve" ? approve : reject;
    mutator(
      { withdrawalId: id },
      {
        onSuccess: () => { toast.success(`Withdrawal ${action}d`); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Action failed"),
      }
    );
  };

  if (isLoading) return <LoadingText />;

  const pending = withdrawals?.filter((w: AdminWithdrawalFull) => w.status === "pending") ?? [];
  const processed = withdrawals?.filter((w: AdminWithdrawalFull) => w.status !== "pending") ?? [];
  const sorted = [...pending, ...processed];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse defi-table">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground">
              <th className="p-4 font-medium border-b border-border">User</th>
              <th className="p-4 font-medium border-b border-border text-right">Asset / Amount</th>
              <th className="p-4 font-medium border-b border-border">Destination Wallet</th>
              <th className="p-4 font-medium border-b border-border">Date</th>
              <th className="p-4 font-medium border-b border-border">Status</th>
              <th className="p-4 font-medium border-b border-border text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted?.map((w: AdminWithdrawalFull) => (
              <tr
                key={w.id}
                className={`hover:bg-secondary/20 transition-colors ${w.status === "pending" ? "bg-amber-500/5" : ""}`}
              >
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{w.username}</span>
                    <span className="text-xs text-muted-foreground">#{w.userId}</span>
                  </div>
                </td>
                <td className="p-4 text-right font-bold">
                  {w.currency === "usdt" ? (
                    <span className="text-emerald-500">{formatCurrency(w.amount)}</span>
                  ) : (
                    <span className="text-amber-400">{w.amount.toFixed(4)} PTC</span>
                  )}
                </td>
                <td className="p-4 font-mono text-xs max-w-[180px] truncate text-muted-foreground" title={w.walletAddress}>
                  {w.walletAddress}
                </td>
                <td className="p-4 text-muted-foreground text-xs">
                  {format(new Date(w.createdAt), "MMM d, HH:mm")}
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      w.status === "approved" ? "success" : w.status === "rejected" ? "destructive" : "warning"
                    }
                  >
                    {w.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  {w.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(w.id, "approve")}
                        className="bg-emerald-600 hover:bg-emerald-500 h-8 px-3"
                      >
                        Mark Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(w.id, "reject")}
                        className="text-destructive border-destructive/20 h-8 px-3"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Addresses ───────────────────────────────────────────────────────────────

function AdminAddresses() {
  const { data: addresses, isLoading } = useAdminGetAddresses();
  const { mutate: addAddress, isPending: isAdding } = useAdminAddAddress();
  const { mutate: updateAddress } = useAdminUpdateAddress();
  const { mutate: deleteAddress } = useAdminDeleteAddress();
  const qc = useQueryClient();

  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editLabel, setEditLabel] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) { toast.error("Address is required"); return; }

    addAddress(
      { address: newAddress.trim(), label: newLabel.trim(), network: "Peridot Network" },
      {
        onSuccess: () => {
          toast.success("Address added");
          setNewAddress("");
          setNewLabel("");
          qc.invalidateQueries();
        },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to add address"),
      }
    );
  };

  const startEdit = (addr: DepositAddress) => {
    setEditingId(addr.id);
    setEditAddress(addr.address);
    setEditLabel(addr.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAddress("");
    setEditLabel("");
  };

  const saveEdit = (id: number) => {
    updateAddress(
      { id, address: editAddress.trim(), label: editLabel.trim() },
      {
        onSuccess: () => {
          toast.success("Address updated");
          cancelEdit();
          qc.invalidateQueries();
        },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to update address"),
      }
    );
  };

  const handleToggleActive = (addr: DepositAddress) => {
    updateAddress(
      { id: addr.id, isActive: !addr.isActive },
      {
        onSuccess: () => { toast.success(addr.isActive ? "Address deactivated" : "Address activated"); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to update"),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this address permanently? This cannot be undone.")) return;
    deleteAddress(
      { id },
      {
        onSuccess: () => { toast.success("Address deleted"); qc.invalidateQueries(); },
        onError: (err: any) => toast.error(err?.data?.error || "Failed to delete"),
      }
    );
  };

  if (isLoading) return <LoadingText />;

  return (
    <div className="space-y-6">
      {/* Add New Address */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus size={18} className="text-primary" /> Add New Deposit Address
        </h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[260px]">
            <Label>Deposit Address (0x...)</Label>
            <Input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              required
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div className="min-w-[180px]">
            <Label>Label <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Pool A"
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={isAdding} className="h-10 px-6">
            {isAdding ? "Adding..." : "Add Address"}
          </Button>
        </form>
      </Card>

      {/* Address List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Address Pool</h2>
          <span className="text-xs text-muted-foreground">
            {addresses?.filter((a) => a.isActive).length ?? 0} active / {addresses?.length ?? 0} total
          </span>
        </div>
        {!addresses?.length ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No addresses configured. Add your first deposit address above.
          </p>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse defi-table">
              <thead>
                <tr className="bg-secondary/50 text-muted-foreground">
                  <th className="p-4 font-medium border-b border-border">Address</th>
                  <th className="p-4 font-medium border-b border-border">Label</th>
                  <th className="p-4 font-medium border-b border-border">Network</th>
                  <th className="p-4 font-medium border-b border-border">Status</th>
                  <th className="p-4 font-medium border-b border-border">Added</th>
                  <th className="p-4 font-medium border-b border-border text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {addresses.map((addr) => (
                  <tr key={addr.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-mono text-xs max-w-[200px]">
                      {editingId === addr.id ? (
                        <Input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      ) : (
                        <span className="truncate block" title={addr.address}>{addr.address}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === addr.id ? (
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Label..."
                        />
                      ) : (
                        <span className="text-muted-foreground">{addr.label || "—"}</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{addr.network}</td>
                    <td className="p-4">
                      <Badge variant={addr.isActive ? "success" : "warning"}>
                        {addr.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {format(new Date(addr.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {editingId === addr.id ? (
                          <>
                            <Button size="sm" onClick={() => saveEdit(addr.id)} className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500">
                              <Check size={13} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 px-2">
                              <X size={13} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(addr)}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(addr)}
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                              title={addr.isActive ? "Deactivate" : "Activate"}
                            >
                              {addr.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(addr.id)}
                              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }: {
  title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}>
      <div
        className="w-full max-w-sm mx-4 rounded-3xl p-6 space-y-5"
        style={{
          background: "linear-gradient(160deg, #0d0e15 0%, #111320 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Trash2 size={16} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs leading-relaxed mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{message}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onCancel}
            className="py-2.5 rounded-2xl text-sm font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px rgba(239,68,68,0.3)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function LoadingText() {
  return <div className="p-12 text-center text-muted-foreground">Loading...</div>;
}
