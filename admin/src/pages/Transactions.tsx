import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import {
  CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, DollarSign,
  Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock, AlertCircle, Ban, Wallet, User, Phone, Hash, Calendar,
  TrendingUp, Filter, Download, Eye, MoreHorizontal,
  ShieldCheck, ShieldX, Send, Sparkles, ListFilter,
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

const tabs = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'amber', gradient: 'from-amber-500 to-amber-600', lightBg: 'bg-amber-50', lightText: 'text-amber-700' },
  { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600', lightBg: 'bg-emerald-50', lightText: 'text-emerald-700' },
  { key: 'withdrawn', label: 'Withdrawn', icon: Wallet, color: 'blue', gradient: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50', lightText: 'text-blue-700' },
  { key: 'rejected', label: 'Rejected', icon: Ban, color: 'rose', gradient: 'from-rose-500 to-rose-600', lightBg: 'bg-rose-50', lightText: 'text-rose-700' },
];

const statusStyles: Record<string, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle },
  withdrawn: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: Wallet },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', icon: Ban },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || statusStyles.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${s.bg} ${s.text} shadow-sm`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ActionButton({ onClick, variant, icon: Icon, label, loading }: {
  onClick: () => void; variant: 'approve' | 'reject' | 'withdraw'; icon: React.ElementType; label: string; loading?: boolean;
}) {
  const styles = {
    approve: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 hover:shadow-md hover:shadow-emerald-200/50 border-emerald-200',
    withdraw: 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 hover:shadow-md hover:shadow-blue-200/50 border-blue-200',
    reject: 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 hover:shadow-md hover:shadow-rose-200/50 border-rose-200',
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`}>
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      ) : <Icon className="h-3.5 w-3.5" />}
      {label}
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
    <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-800">{from}</span> to <span className="font-semibold text-slate-800">{to}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(1)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button onClick={() => onPageChange(1)}
          className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === 1 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>
          1
        </button>

        {getPages()[0] > 2 && <span className="px-1 text-slate-300 text-sm">...</span>}

        {getPages().map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === p ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>
            {p}
          </button>
        ))}

        {getPages()[getPages().length - 1] < pages - 1 && <span className="px-1 text-slate-300 text-sm">...</span>}

        {pages > 1 && (
          <button onClick={() => onPageChange(pages)}
            className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === pages ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>
            {pages}
          </button>
        )}

        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPageChange(pages)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-48 rounded-lg bg-slate-200" />
              <div className="h-3 w-64 rounded-lg bg-slate-100" />
            </div>
            <div className="h-6 w-24 rounded-xl bg-slate-200" />
            <div className="h-9 w-28 rounded-xl bg-slate-200" />
          </div>
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
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <ListFilter className="h-3 w-3" />
                {totalCount.toLocaleString()} total
              </span>
            </div>
            <p className="text-sm text-slate-500">Review, approve, and manage all financial activity</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost text-xs gap-2 rounded-xl px-4 py-2.5 border border-slate-200">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
            <button className="btn btn-ghost text-xs gap-2 rounded-xl px-4 py-2.5 border border-slate-200">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tabs.map((tab) => {
          const count = counts[tab.key as keyof typeof counts];
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              className={`group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'bg-white/70 backdrop-blur-sm border border-slate-200/70 hover:shadow-lg hover:border-slate-300'
              }`}>
              {/* Background gradient blob */}
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tab.gradient} opacity-5 transition-all duration-500 group-hover:scale-150 ${isActive ? 'scale-125' : ''}`} />
              <div className="relative">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 bg-gradient-to-br ${tab.gradient} shadow-lg`}
                  style={{ boxShadow: isActive ? `0 8px 24px -4px rgba(var(--${tab.color}-500), 0.3)` : undefined }}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tab.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className={`text-2xl font-bold ${isActive ? 'text-slate-900' : 'text-slate-900'}`}>
                    {loading ? '-' : count.toLocaleString()}
                  </p>
                  {count > 0 && (
                    <span className={`text-xs font-medium ${count > 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {count > 10 ? `↑ ${Math.round(count / totalCount * 100)}%` : `↓ ${Math.round(count / totalCount * 100)}%`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, email, transaction ID, or phone..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/60 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">
              Clear
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>{filtered.length} results</span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl py-20 px-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No transactions found</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm">
                {search
                  ? 'No matches for your search. Try a different name, email, or transaction ID.'
                  : `There are no ${activeTab} transactions to review right now.`}
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="btn btn-primary mt-6">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filtered.map((tx, index) => {
              const isDeposit = tx.type === 'Deposit';
              const canAction = tx.status === 'pending';
              const statusS = statusStyles[tx.status] || statusStyles.pending;
              const StatusIcon = statusS.icon;

              return (
                <div key={tx._id}
                  className="glass rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Avatar + Info */}
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg ${
                        isDeposit
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                          : 'bg-gradient-to-br from-orange-500 to-rose-500 shadow-orange-500/25'
                      }`}>
                        {getInitials(tx.user.name)}
                        <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${isDeposit ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                          {isDeposit ? <ArrowDownCircle className="h-2.5 w-2.5 text-white" /> : <ArrowUpCircle className="h-2.5 w-2.5 text-white" />}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{tx.user.name}</span>
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isDeposit ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {isDeposit ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                            {tx.type}
                          </span>
                          <StatusBadge status={tx.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            {tx.user.email}
                          </span>
                          {isDeposit && tx.transactionId && (
                            <span className="flex items-center gap-1.5">
                              <Hash className="h-3 w-3" />
                              TID: {tx.transactionId}
                            </span>
                          )}
                          {!isDeposit && tx.targetPhone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {tx.targetPhone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Actions */}
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${isDeposit ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {isDeposit ? '+' : '-'}Rs. {tx.amount.toLocaleString()}
                        </p>
                      </div>

                      {/* Action Buttons for pending */}
                      {canAction && (
                        <div className="hidden sm:flex items-center gap-1.5">
                          {isDeposit ? (
                            <>
                              <ActionButton variant="approve" icon={ShieldCheck} label="Approve"
                                onClick={() => handleReview(tx._id, 'approve')} loading={actionLoading === tx._id} />
                              <ActionButton variant="reject" icon={ShieldX} label="Reject"
                                onClick={() => handleReview(tx._id, 'reject')} loading={actionLoading === tx._id} />
                            </>
                          ) : (
                            <>
                              <ActionButton variant="withdraw" icon={Send} label="Mark Paid"
                                onClick={() => handleReview(tx._id, 'withdraw')} loading={actionLoading === tx._id} />
                              <ActionButton variant="reject" icon={ShieldX} label="Reject"
                                onClick={() => handleReview(tx._id, 'reject')} loading={actionLoading === tx._id} />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  {canAction && (
                    <div className="sm:hidden mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                      {isDeposit ? (
                        <>
                          <ActionButton variant="approve" icon={ShieldCheck} label="Approve"
                            onClick={() => handleReview(tx._id, 'approve')} loading={actionLoading === tx._id} />
                          <ActionButton variant="reject" icon={ShieldX} label="Reject"
                            onClick={() => handleReview(tx._id, 'reject')} loading={actionLoading === tx._id} />
                        </>
                      ) : (
                        <>
                          <ActionButton variant="withdraw" icon={Send} label="Mark Paid"
                            onClick={() => handleReview(tx._id, 'withdraw')} loading={actionLoading === tx._id} />
                          <ActionButton variant="reject" icon={ShieldX} label="Reject"
                            onClick={() => handleReview(tx._id, 'reject')} loading={actionLoading === tx._id} />
                        </>
                      )}
                    </div>
                  )}

                  {/* Status footer for non-pending */}
                  {!canAction && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-slate-100/50">
                      <StatusIcon className="h-3.5 w-3.5" style={{ color: statusS.text === 'text-amber-700' ? '#d97706' : statusS.text === 'text-emerald-700' ? '#059669' : statusS.text === 'text-blue-700' ? '#2563eb' : '#e11d48' }} />
                      <span className="text-slate-500">
                        {tx.status === 'withdrawn' && 'Marked as paid by admin'}
                        {tx.status === 'approved' && 'Balance credited to user'}
                        {tx.status === 'rejected' && 'Transaction was declined'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
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
