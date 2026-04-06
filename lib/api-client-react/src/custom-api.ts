import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

// ─── Types ──────────────────────────────────────────────────────────

export interface DepositAddress {
  id: number;
  address: string;
  label: string;
  network: string;
  isActive: boolean;
  createdAt: string;
}

export interface GeneratedAddress {
  id: number;
  address: string;
  label: string;
  network: string;
}

export interface AdminDepositFull {
  id: number;
  userId: number;
  username: string;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  screenshotData: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export interface AdminWithdrawalFull {
  id: number;
  userId: number;
  username: string;
  currency: string;
  amount: number;
  walletAddress: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminStatsFull {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalGemsMined: number;
  totalEtrConverted: number;
  totalEtrSupplyUsed: number;
  totalDepositsUsdt: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalAddresses: number;
  activeAddresses: number;
}

// ─── Deposit Address — Generate ────────────────────────────────────

export const useGenerateDepositAddress = (options?: { query?: any }) => {
  return useQuery<GeneratedAddress, Error>({
    queryKey: ["/api/deposits/generate-address"],
    queryFn: () => customFetch<GeneratedAddress>("/api/deposits/generate-address"),
    enabled: false, // only fetch on demand
    retry: false,
    ...options?.query,
  });
};

// ─── Admin: Deposit Addresses CRUD ─────────────────────────────────

export const useAdminGetAddresses = (options?: { query?: any }) => {
  return useQuery<DepositAddress[], Error>({
    queryKey: ["/api/admin/addresses"],
    queryFn: () => customFetch<DepositAddress[]>("/api/admin/addresses"),
    ...options?.query,
  });
};

export const useAdminAddAddress = (options?: any) => {
  return useMutation<DepositAddress, Error, { address: string; label: string; network: string }>({
    mutationFn: (data) =>
      customFetch<DepositAddress>("/api/admin/addresses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export const useAdminUpdateAddress = (options?: any) => {
  return useMutation<DepositAddress, Error, { id: number; address?: string; label?: string; network?: string; isActive?: boolean }>({
    mutationFn: ({ id, ...data }) =>
      customFetch<DepositAddress>(`/api/admin/addresses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export const useAdminDeleteAddress = (options?: any) => {
  return useMutation<{ message: string }, Error, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<{ message: string }>(`/api/admin/addresses/${id}`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// ─── Admin: Screenshot Management ──────────────────────────────────

export const useAdminDeleteDepositScreenshot = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/screenshot`, {
        method: "DELETE",
      }),
    ...options,
  });
};

// ─── Admin: Full deposits (with screenshot data) ──────────────────

export const useAdminGetDepositsWithScreenshots = (options?: { query?: any }) => {
  return useQuery<AdminDepositFull[], Error>({
    queryKey: ["/api/admin/deposits"],
    queryFn: () => customFetch<AdminDepositFull[]>("/api/admin/deposits"),
    ...options?.query,
  });
};

// ─── Admin: Full withdrawals ──────────────────────────────────────

export const useAdminGetWithdrawalsFull = (options?: { query?: any }) => {
  return useQuery<AdminWithdrawalFull[], Error>({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: () => customFetch<AdminWithdrawalFull[]>("/api/admin/withdrawals"),
    ...options?.query,
  });
};

// ─── Admin: Full stats ────────────────────────────────────────────

export const useAdminGetStatsFull = (options?: { query?: any }) => {
  return useQuery<AdminStatsFull, Error>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => customFetch<AdminStatsFull>("/api/admin/stats"),
    ...options?.query,
  });
};

// ─── Admin: Approve/Reject deposits and withdrawals (wrappers) ───

export const useAdminApproveDepositFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/approve`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminRejectDepositFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { depositId: number }>({
    mutationFn: ({ depositId }) =>
      customFetch<{ message: string }>(`/api/admin/deposits/${depositId}/reject`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminApproveWithdrawalFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { withdrawalId: number }>({
    mutationFn: ({ withdrawalId }) =>
      customFetch<{ message: string }>(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: "POST",
      }),
    ...options,
  });
};

export const useAdminRejectWithdrawalFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { withdrawalId: number }>({
    mutationFn: ({ withdrawalId }) =>
      customFetch<{ message: string }>(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: "POST",
      }),
    ...options,
  });
};

// ─── Deposit: create with screenshot support ──────────────────────

export interface CreateDepositWithScreenshot {
  amountUsdt: number;
  txHash?: string;
  screenshotData?: string;
  assignedAddress?: string;
}

export interface DepositResponse {
  id: number;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export const useCreateDepositFull = (options?: any) => {
  return useMutation<DepositResponse, Error, CreateDepositWithScreenshot>({
    mutationFn: (data) =>
      customFetch<DepositResponse>("/api/deposits", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

export interface DepositHistoryItem {
  id: number;
  amountUsdt: number;
  status: string;
  txHash: string | null;
  assignedAddress: string | null;
  hasScreenshot: boolean;
  screenshotData: string | null;
  createdAt: string;
  approvedAt: string | null;
}

export const useGetDepositsFull = (options?: { query?: any }) => {
  return useQuery<DepositHistoryItem[], Error>({
    queryKey: ["/api/deposits"],
    queryFn: () => customFetch<DepositHistoryItem[]>("/api/deposits"),
    ...options?.query,
  });
};

// ─── Levels ──────────────────────────────────────────────────────

export interface LevelDefinition {
  level: number;
  name: string;
  unlockCost: number | null;
  investmentThreshold: number | null;
  description: string;
  gemsPerYear: number;
  usdtReturn: number | null;
  returnMultiplier: number;
  pickaxeImage: string;
}

export interface UnlockedLevel {
  level: number;
  additionalInvestment: number;
  unlockedAt: string;
}

export interface LevelsStatus {
  currentLevel: number;
  totalMiningPower: number;
  dailyGems: number;
  usdtBalance: number;
  unlockedLevels: UnlockedLevel[];
  levelDefinitions: LevelDefinition[];
}

export const useGetLevels = (options?: { query?: any }) => {
  return useQuery<LevelsStatus, Error>({
    queryKey: ["/api/levels"],
    queryFn: () => customFetch<LevelsStatus>("/api/levels"),
    ...options?.query,
  });
};

export const useUnlockLevel = (options?: any) => {
  return useMutation<{ message: string; newLevel: number; deducted: number; newUsdtBalance: number }, Error, { level: number }>({
    mutationFn: (data) =>
      customFetch("/api/levels/unlock", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

export const useInvestInLevel = (options?: any) => {
  return useMutation<{ message: string; additionalUsdt: number; newUsdtBalance: number; newLevel: number; leveledUp: boolean }, Error, { additionalUsdt: number }>({
    mutationFn: (data) =>
      customFetch("/api/levels/invest", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });
};

// ─── Referrals ────────────────────────────────────────────────────────
export interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalRewardGems: number;
}

export const useGetReferrals = (options?: { query?: any }) => {
  return useQuery<ReferralStats, Error>({
    queryKey: ["/api/referrals"],
    queryFn: () => customFetch<ReferralStats>("/api/referrals"),
    ...options?.query,
  });
};

export const useApplyReferral = (options?: any) => {
  return useMutation<{ message: string }, Error, { referralCode: string }>({
    mutationFn: (data) =>
      customFetch<{ message: string }>("/api/referrals/apply", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};

// ─── Admin: Ban / Adjust balance ────────────────────────────────

export const useAdminBanUserFull = (options?: any) => {
  return useMutation<{ message: string }, Error, { userId: number; banned: boolean }>({
    mutationFn: ({ userId, banned }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ banned }),
      }),
    ...options,
  });
};

export const useAdminAdjustBalance = (options?: any) => {
  return useMutation<{ message: string }, Error, { userId: number; gemsBalance?: number; etrBalance?: number; usdtBalance?: number }>({
    mutationFn: ({ userId, ...data }) =>
      customFetch<{ message: string }>(`/api/admin/users/${userId}/adjust-balance`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options,
  });
};
