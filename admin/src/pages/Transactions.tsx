import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import {
  CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, DollarSign,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, AlertCircle, Ban, Wallet, User, Phone, Hash, Calendar
} from 'lucide-react';

interface Transaction {
  _id: string;
  user: { _id: string; name: string; email: string };
  amount: number;
  type: 'Deposit' | 'Withdrawal';
  transactionId?: string;
  targetPhone?: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

const STYLES = {
  badge: {
    pending: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200/50',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200/50',
    withdrawn: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-200/50',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-200/50',
  },
  icon: {
    pending: Clock, approved: CheckCircle, withdrawn: Wallet, rejected: Ban,
  },
  label: {
    pending: 'Pending', approved: 'Approved', withdrawn: 'Withdrawn', rejected: 'Rejected',
  },
};

const tabs = [
  { key: 'pending', label: 'Pending', color: 'bg-amber-500' },
  { key: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  { key: 'withdrawn', label: 'Withdrawn', color: 'bg-blue-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
];

function StatusBadge({ status }: { status: string }) {
  const s = status as keyof typeof STYLES.badge;
  const Icon = STYLES.icon[s] || AlertCircle;
  const label = STYLES.label[s as keyof typeof STYLES.label] || status;
  const cls = STYLES.badge[s] || 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

function ActionButton({ onClick, color, icon: Icon, label }: {
  onClick: () => void; color: string; icon: React.ElementType; label: string;
}) {
  const colors: Record<string, string> = {
    green: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 ring-emerald-200',
    blue: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700 ring-blue-200',
    red: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 ring-rose-200',
  };
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:ring-1 ${colors[color]}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
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
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span> to <span className="font-semibold text-slate-700">{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(1)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button onClick={() => onPageChange(1)}
          className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${page === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          1
        </button>

        {getPages()[0] > 2 && <span className="px-1 text-slate-300">...</span>}

        {getPages().map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {p}
          </button>
        ))}

        {getPages()[getPages().length - 1] < pages - 1 && <span className="px-1 text-slate-300">...</span>}

        {pages > 1 && (
          <button onClick={() => onPageChange(pages)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${page === pages ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {pages}
          </button>
        )}

        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPageChange(pages)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-6 rounded-xl border border-slate-100 bg-white p-5">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-200" />
          <div className="h-8 w-24 rounded-lg bg-slate-200" />
        </div>
      ))}
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

  const handleReview = async (txId: string, action: 'approve' | 'reject' | 'withdraw') => {
    if (!window.confirm(`Are you sure you want to ${action} this transaction?`)) return;
    setActionLoading(txId);
    try {
      await api.post('/admin/review-transaction', { transactionId: txId, action });
      fetchTransactions(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filtered = search
    ? transactions.filter(tx =>
        tx.user.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.user.email.toLowerCase().includes(search.toLowerCase()) ||
        tx.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
        tx.targetPhone?.includes(search)
      )
    : transactions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-slate-500">Review, approve, and manage all financial activity</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
              activeTab === tab.key
                ? 'border-indigo-200 bg-indigo-50 shadow-sm ring-1 ring-indigo-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}>
            <div className={`absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full opacity-10 ${tab.color}`} />
            <div className={`mb-2 inline-flex rounded-lg p-2 ${tab.color} bg-opacity-10`}>
              {tab.key === 'pending' ? <Clock className="h-4 w-4 text-amber-600" /> :
               tab.key === 'approved' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> :
               tab.key === 'withdrawn' ? <Wallet className="h-4 w-4 text-blue-600" /> :
               <Ban className="h-4 w-4 text-rose-600" />}
            </div>
            <p className="text-xs font-medium text-slate-500">{tab.label}</p>
            <p className="text-lg font-bold text-slate-900">
              {loading ? '-' : counts[tab.key as keyof typeof counts].toLocaleString()}
            </p>
          </button>
        ))}
      </div>

      {/* Search + Filter row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, email, TID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Transactions List */}
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
              <div className="mb-4 rounded-full bg-slate-100 p-4">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">No transactions found</p>
              <p className="mt-1 text-sm text-slate-500">
                {search ? 'Try a different search term' : `No ${activeTab} transactions yet`}
              </p>
            </div>
          ) : (
            filtered.map((tx) => (
              <div key={tx._id}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: User Info */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      tx.type === 'Deposit' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}>
                      {getInitials(tx.user.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{tx.user.name}</span>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          tx.type === 'Deposit' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                          {tx.type === 'Deposit' ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                          {tx.type}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tx.user.email}</span>
                        {tx.type === 'Deposit' && tx.transactionId && (
                          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> TID: {tx.transactionId}</span>
                        )}
                        {tx.type === 'Withdrawal' && tx.targetPhone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {tx.targetPhone}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Status */}
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.type === 'Deposit' ? 'text-emerald-600' : 'text-orange-600'}`}>
                        Rs. {tx.amount.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>

                {/* Actions */}
                {tx.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    {tx.type === 'Deposit' ? (
                      <>
                        <ActionButton color="green" icon={CheckCircle} label="Approve"
                          onClick={() => handleReview(tx._id, 'approve')} />
                        <ActionButton color="red" icon={XCircle} label="Reject"
                          onClick={() => handleReview(tx._id, 'reject')} />
                      </>
                    ) : (
                      <>
                        <ActionButton color="blue" icon={DollarSign} label="Mark as Withdrawn"
                          onClick={() => handleReview(tx._id, 'withdraw')} />
                        <ActionButton color="red" icon={XCircle} label="Reject"
                          onClick={() => handleReview(tx._id, 'reject')} />
                      </>
                    )}
                  </div>
                )}
                {tx.status === 'withdrawn' && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                    <Wallet className="h-3.5 w-3.5" /> Paid manually by admin
                  </div>
                )}
                {tx.status === 'approved' && tx.type === 'Deposit' && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" /> Balance credited
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <PaginationBar pagination={pagination} onPageChange={(p) => fetchTransactions(p)} />
      )}
    </div>
  );
}
