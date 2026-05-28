import api from '../api';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  currentBalance: number;
  activePlan: string;
  createdAt: string;
}

export interface ReviewTransactionData {
  transactionId: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export interface ReviewMutualFundData {
  requestId: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

export const adminApi = {
  getPendingTransactions: () => api.get('/admin/pending-transactions'),
  
  getAllTransactions: () => api.get('/admin/transactions'),
  
  reviewTransaction: (data: ReviewTransactionData) => 
    api.post('/admin/review-transaction', data),
    
  getAllUsers: () => api.get<{ users: AdminUser[] }>('/admin/users'),
  
  getUserDetail: (userId: string) => api.get<{ user: AdminUser }>('/admin/users/' + userId),
  
  updateUserBalance: (data: { userId: string; amount: number; type: 'add' | 'deduct'; notes?: string }) => 
    api.post('/admin/update-balance', data),
    
  getCategories: () => api.get('/admin/categories'),
  
  createCategory: (data: any) => api.post('/admin/categories', data),
  
  updateCategory: (categoryId: string, data: any) => api.put('/admin/categories/' + categoryId, data),
  
  deleteCategory: (categoryId: string) => api.delete('/admin/categories/' + categoryId),
  
  getPlans: () => api.get('/admin/plans'),
  
  createPlan: (data: any) => api.post('/admin/plans', data),
  
  updatePlan: (planId: string, data: any) => api.put('/admin/plans/' + planId, data),
  
  deletePlan: (planId: string) => api.delete('/admin/plans/' + planId),
  
  getAllMutualFundRequests: () => api.get('/admin/mutual-funds/requests'),
  
  reviewMutualFundRequest: (data: ReviewMutualFundData) => api.post('/admin/mutual-funds/review', data),
};