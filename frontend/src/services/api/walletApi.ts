import api from '../api';

// Types
export interface InvestmentCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface InvestmentPlan {
  _id: string;
  category: string | InvestmentCategory;
  name: string;
  dailyReturnRate: number;
  minInvestment: number;
  maxInvestment?: number | null;
  description?: string;
  isActive: boolean;
}

export interface InvestmentSystem extends InvestmentCategory {
  plans: InvestmentPlan[];
}

export interface Transaction {
  _id: string;
  user: string;
  amount: number;
  type: 'Deposit' | 'Withdrawal' | string;
  transactionId?: string;
  targetPhone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | string;
  createdAt: string;
  updatedAt: string;
}

export interface MutualFundRequest {
  _id: string;
  user: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export const walletApi = {
  // Public
  getCategories: () => api.get<{ categories: InvestmentCategory[] }>('/wallet/categories'),
  getSystems: () => api.get<{ systems: InvestmentSystem[] }>('/wallet/systems'),
  getPlans: () => api.get<{ plans: InvestmentPlan[] }>('/wallet/plans'),

  // Auth / Protected
  deposit: (data: { amount: number; transactionId: string }) =>
    api.post<{ message: string; transaction: Transaction }>('/wallet/deposit', data),

  withdraw: (data: { amount: number; targetPhone: string }) =>
    api.post<{ message: string; transaction: Transaction; currentBalance: number }>('/wallet/withdraw', data),

  selectPlan: (data: { planName: string }) =>
    api.post<{ message: string; activePlan: string }>('/wallet/select-plan', data),

  getTransactions: () =>
    api.get<{ transactions: Transaction[] }>('/wallet/transactions'),

  requestMutualFundRedemption: (data: { amount: number }) =>
    api.post<{ message: string; request: MutualFundRequest }>('/wallet/mutual-funds/request', data),

  getMutualFundRequests: () =>
    api.get<{ requests: MutualFundRequest[] }>('/wallet/mutual-funds/requests'),

  // Admin
  triggerDailyRoi: () =>
    api.post<{ message: string }>('/wallet/trigger-daily-roi'),
};
