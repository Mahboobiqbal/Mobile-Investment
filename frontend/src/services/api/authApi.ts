import api from '../api';

// Types
export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  currentBalance?: number;
  activePlan?: string | null;
  dp?: string;
  isVerified?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  phone: string;
}

export interface LoginData {
  email: string;
  password?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

export interface DashboardStats {
  totalDepositsApproved: number;
  totalWithdrawalsApproved: number;
  totalROIEarnings: number;
}

export const authApi = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login', data),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post<{ message: string; resetToken: string }>('/auth/verify-otp', data),

  resetPassword: (data: { email: string; resetToken: string; newPassword?: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),

  getProfile: () =>
    api.get<{ user: User }>('/auth/profile'),

  updatePassword: (data: { currentPassword?: string; newPassword?: string }) =>
    api.put<{ message: string }>('/auth/update-password', data),

  getDashboardStats: () =>
    api.get<DashboardStats>('/auth/dashboard-stats'),
};
