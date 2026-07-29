import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import {
  CheckCircle, ArrowDownCircle, ArrowUpCircle,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Ban, Wallet, User, Phone, Hash, Calendar, Clock,
  ShieldCheck, ShieldX, Send, Sparkles, ListFilter,
  Filter, Download,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

interface Transaction {
  _id: string;
  user: { _id: string; name: string; email: string };
  amount: number;
  type: 'plan' | 'deposit' | 'withdrawal' | 'Deposit' | 'Withdrawal';
  transactionId?: string;
  targetPhone?: string;
  planId?: string | { _id: string } | null;
  planName?: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

const tabs = [
  { key: 'pending', label: 'Pending', count: 'pending' as const },
  { key: 'approved', label: 'Approved', count: 'approved' as const },
  { key: 'withdrawn', label: 'Withdrawn', count: 'withdrawn' as const },
  { key: 'rejected', label: 'Rejected', count: 'rejected' as const },
];

const statusStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  withdrawn: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Wallet },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', icon: Ban },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || statusStyles.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function PaginationBar({ pagination, onPageChange }: {
  pagination: Pagination; onPageChange: (p: number) => void;
}) {
  const { page, pages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) range.push(i);
    return range;
  };

  return (
    <div className="card px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-xs sm:text-sm text-slate-500">
        Showing <span className="font-medium text-slate-800">{from}</span> to <span className="font-medium text-slate-800">{to}</span> of{' '}
        <span className="font-medium text-slate-800">{total}</span> results
      </p>
      <div className="flex items-center gap-1 overflow-x-auto">
        <button disabled={page <= 1} onClick={() => onPageChange(1)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => onPageChange(1)}
          className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${page === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          1
        </button>
        {getPages()[0] > 2 && <span className="px-1 text-slate-300 text-sm">...</span>}
        {getPages().map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${page === p ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {p}
          </button>
        ))}
        {getPages()[getPages().length - 1] < pages - 1 && <span className="px-1 text-slate-300 text-sm">...</span>}
        {pages > 1 && (
          <button onClick={() => onPageChange(pages)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${page === pages ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {pages}
          </button>
        )}
        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPageChange(pages)}
          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 15, total: 0, pages: 1 });
  const [counts, setCounts] = useState({ pending: 0, approved: 0, withdrawn: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; txId: string; action: 'approve' | 'reject' | 'withdraw';
  }>({ isOpen: false, txId: '', action: 'approve' });

  const [toast, setToast] = useState<{
    isOpen: boolean; type: 'success' | 'error'; message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ isOpen: true, type, message });
  };

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (activeTab) params.set('status', activeTab);
      const res = await api.get(`/admin/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
      if (res.data.counts) setCounts(res.data.counts);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handleReview = (txId: string, action: 'approve' | 'reject' | 'withdraw') => {
    setConfirmState({ isOpen: true, txId, action });
  };

  const handleConfirm = async () => {
    const { txId, action } = confirmState;
    setActionLoading(txId);
    setConfirmState(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await api.post('/admin/review-transaction', { transactionId: txId, action });
      const actionLabel = action === 'withdraw' ? 'withdrawn' : `${action}d`;
      const msg = res.data?.message || `Transaction ${actionLabel} successfully`;
      showToast('success', msg);
      fetchTransactions(pagination.page);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Action failed';
      showToast('error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalCount = counts.pending + counts.approved + counts.withdrawn + counts.rejected;

  const filtered = search
    ? transactions.filter(tx =>
        tx.user.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.user.email.toLowerCase().includes(search.toLowerCase()) ||
        tx.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
        tx.targetPhone?.includes(search)
      )
    : transactions;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <ListFilter className="h-3 w-3" />
                {totalCount.toLocaleString()} total
              </span>
            </div>
            <p className="text-sm text-slate-500">Review, approve, and manage all financial activity</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="btn btn-secondary text-xs">
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button className="btn btn-secondary text-xs">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const count = counts[tab.count];
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}>
              {tab.label}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {loading ? '-' : count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="card px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, email, transaction ID, or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">
            Clear
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="card overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-slate-100 border-b border-slate-200" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
                <div className="h-9 w-9 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-3 w-48 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded bg-slate-200" />
                <div className="h-6 w-20 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card py-16 px-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No transactions found</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">
            {search
              ? 'No matches for your search. Try a different name, email, or transaction ID.'
              : `There are no ${activeTab} transactions to review right now.`}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="btn btn-primary mt-6">
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount</th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Details</th>
                  <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx) => {
                  const normalizedType = String(tx.type || '').toLowerCase();
                  const isPlanPurchase = normalizedType === 'plan';
                  const isWalletDeposit = normalizedType === 'deposit';
                  const isDeposit = isPlanPurchase || isWalletDeposit;
                  const canAction = tx.status === 'pending';
                  const planId = typeof tx.planId === 'string' ? tx.planId : tx.planId?._id;

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                      {/* User */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                            isPlanPurchase ? 'bg-indigo-500' : isDeposit ? 'bg-emerald-500' : 'bg-orange-500'
                          }`}>
                            {tx.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{tx.user.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{tx.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                          isPlanPurchase ? 'bg-indigo-50 text-indigo-700' : isDeposit ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {isPlanPurchase ? 'Plan Purchase' : isDeposit ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        <StatusBadge status={tx.status} />
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-3.5 text-right">
                        <span className={`text-sm font-bold ${isPlanPurchase || isDeposit ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {isPlanPurchase || isDeposit ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                          {isDeposit && tx.transactionId && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" /> TID: {tx.transactionId}
                            </span>
                          )}
                          {isPlanPurchase && tx.planName && (
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> {tx.planName}
                            </span>
                          )}
                          {!isDeposit && tx.targetPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {tx.targetPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-slate-500">{formatDate(tx.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        {canAction ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {isPlanPurchase || isDeposit ? (
                              <>
                                <button onClick={() => handleReview(tx._id, 'approve')}
                                  disabled={actionLoading === tx._id}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all active:scale-95 disabled:opacity-50">
                                  <ShieldCheck className="h-3 w-3" /> Approve
                                </button>
                                <button onClick={() => handleReview(tx._id, 'reject')}
                                  disabled={actionLoading === tx._id}
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 disabled:opacity-50">
                                  <ShieldX className="h-3 w-3" /> Reject
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleReview(tx._id, 'withdraw')}
                                  disabled={actionLoading === tx._id}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all active:scale-95 disabled:opacity-50">
                                  <Send className="h-3 w-3" /> Mark Paid
                                </button>
                                <button onClick={() => handleReview(tx._id, 'reject')}
                                  disabled={actionLoading === tx._id}
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 disabled:opacity-50">
                                  <ShieldX className="h-3 w-3" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {tx.status === 'approved' && 'Credited'}
                            {tx.status === 'withdrawn' && 'Paid'}
                            {tx.status === 'rejected' && 'Declined'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2 p-3">
            {filtered.map((tx) => {
              const normalizedType = String(tx.type || '').toLowerCase();
              const isPlanPurchase = normalizedType === 'plan';
              const isWalletDeposit = normalizedType === 'deposit';
              const isDeposit = isPlanPurchase || isWalletDeposit;
              const canAction = tx.status === 'pending';

              return (
                <div key={tx._id} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
                        isPlanPurchase ? 'bg-indigo-500' : isDeposit ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}>
                        {tx.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{tx.user.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isPlanPurchase ? 'bg-indigo-50 text-indigo-700' : isDeposit ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {isPlanPurchase ? 'Plan' : isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${isPlanPurchase || isDeposit ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {isPlanPurchase || isDeposit ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tx.createdAt)}
                  </div>
                  {canAction && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                      {isPlanPurchase || isDeposit ? (
                        <>
                          <button onClick={() => handleReview(tx._id, 'approve')}
                            disabled={actionLoading === tx._id}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 border border-emerald-200 active:scale-95 disabled:opacity-50">
                            <ShieldCheck className="h-3 w-3" /> Approve
                          </button>
                          <button onClick={() => handleReview(tx._id, 'reject')}
                            disabled={actionLoading === tx._id}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 border border-rose-200 active:scale-95 disabled:opacity-50">
                            <ShieldX className="h-3 w-3" /> Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleReview(tx._id, 'withdraw')}
                            disabled={actionLoading === tx._id}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 border border-blue-200 active:scale-95 disabled:opacity-50">
                            <Send className="h-3 w-3" /> Mark Paid
                          </button>
                          <button onClick={() => handleReview(tx._id, 'reject')}
                            disabled={actionLoading === tx._id}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700 border border-rose-200 active:scale-95 disabled:opacity-50">
                            <ShieldX className="h-3 w-3" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <PaginationBar pagination={pagination} onPageChange={(p) => fetchTransactions(p)} />
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.action === 'approve' ? 'Approve Transaction' : confirmState.action === 'reject' ? 'Reject Transaction' : 'Mark as Paid'}
        message={`Are you sure you want to ${confirmState.action === 'withdraw' ? 'mark this withdrawal as paid' : confirmState.action + ' this transaction'}? This action cannot be undone.`}
        action={confirmState.action}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        loading={actionLoading === confirmState.txId}
      />

      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
