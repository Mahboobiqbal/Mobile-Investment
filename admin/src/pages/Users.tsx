import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  User as UserIcon, Phone, Wallet,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Calendar, Shield,
  Users as UsersIcon, BadgeCheck, Target, DollarSign, ArrowUpDown,
  X, Edit3, Eye, Mail, Sparkles,
} from 'lucide-react';

interface User {
  _id: string; name: string; email: string; phone: string;
  currentBalance: number; activePlan: string; role: string;
  isVerified: boolean; createdAt: string;
}

interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

interface Stats {
  verified: number; activePlans: number; totalBalance: number;
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600', 'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600', 'from-sky-500 to-blue-600',
  'from-pink-500 to-fuchsia-600', 'from-amber-500 to-yellow-600',
  'from-violet-500 to-indigo-600', 'from-lime-500 to-green-600',
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'balance-high', label: 'Balance High' },
  { value: 'balance-low', label: 'Balance Low' },
  { value: 'name', label: 'Name A-Z' },
];

function PaginationBar({ pagination, onPageChange }: {
  pagination: Pagination; onPageChange: (p: number) => void;
}) {
  const { page, pages, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const getPages = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) range.push(i);
    return range;
  };
  return (
    <div className="glass rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-3 sm:gap-4">
      <p className="text-xs sm:text-sm text-slate-500">
        {total === 0 ? 'No results' : <>Showing <span className="font-semibold text-slate-800">{from}</span> to <span className="font-semibold text-slate-800">{to}</span> of{' '}
        <span className="font-semibold text-slate-800">{total}</span></>}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto">
          <button disabled={page <= 1} onClick={() => onPageChange(1)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => onPageChange(1)}
            className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === 1 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>1</button>
          {getPages()[0] > 2 && <span className="px-1 text-sm text-slate-300">...</span>}
          {getPages().map((p) => (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === p ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
          {getPages()[getPages().length - 1] < pages - 1 && <span className="px-1 text-sm text-slate-300">...</span>}
          <button onClick={() => onPageChange(pages)}
            className={`min-w-[2.25rem] rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${page === pages ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'}`}>{pages}</button>
          <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button disabled={page >= pages} onClick={() => onPageChange(pages)}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function BalanceModal({ user, onClose, onUpdate }: {
  user: User; onClose: () => void; onUpdate: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/update-balance', {
        userId: user._id, amount: parseFloat(amount), type,
      });
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl shadow-black/10 animate-scale-in border border-slate-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Update Balance</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-3.5 border border-slate-200/50">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(user.name)} text-sm font-bold text-white shadow-lg`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">Current: <span className="font-semibold text-indigo-600">Rs. {user.currentBalance.toLocaleString()}</span></p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount</label>
            <input type="number" required min="1" step="any"
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter amount" value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2.5">
            {(['add', 'subtract'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${
                  type === t
                    ? t === 'add'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t === 'add' ? 'Add Funds' : 'Subtract'}
              </button>
            ))}
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={!amount || parseFloat(amount) <= 0 || submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Updating...
                </span>
              ) : type === 'add' ? 'Add Balance' : 'Subtract Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 1 });
  const [stats, setStats] = useState<Stats>({ verified: 0, activePlans: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [modalUser, setModalUser] = useState<User | null>(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=50`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const processed = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)
      );
    }
    switch (sort) {
      case 'oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'balance-high': result.sort((a, b) => b.currentBalance - a.currentBalance); break;
      case 'balance-low': result.sort((a, b) => a.currentBalance - b.currentBalance); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break;
    }
    return result;
  }, [users, search, sort]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Users</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-600">
                <UsersIcon className="h-3 w-3" />
                {pagination.total.toLocaleString()} total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">Manage and view all registered users</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="glass-card p-3.5 sm:p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Total Users</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 truncate">{pagination.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-3.5 sm:p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Verified</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 truncate">{stats.verified.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-3.5 sm:p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">On Plans</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 truncate">{stats.activePlans.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-3.5 sm:p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-sky-500/10 to-sky-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/25">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="stat-label">Total Balance</p>
                <p className="text-base sm:text-xl font-bold text-slate-900 truncate">Rs. {stats.totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="glass rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by name, email, or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-3 py-2.5 text-sm">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="outline-none bg-transparent text-slate-600 font-semibold text-xs cursor-pointer">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>{processed.length} results</span>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded-lg bg-slate-200" />
                  <div className="h-3 w-56 rounded-lg bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                <UserIcon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-700">
                {search ? 'No users match your search' : 'No users found'}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="btn btn-primary mt-4 text-xs">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-2 p-3 sm:hidden">
                {processed.map((user) => (
                  <div key={user._id} onClick={() => navigate(`/users/${user._id}`)}
                    className="rounded-xl bg-slate-50 p-3 border border-slate-100 transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(user.name)} text-sm font-bold text-white shadow-md`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-indigo-600">Rs. {user.currentBalance.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 pl-13">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                            <Shield className="h-2.5 w-2.5" /> Admin
                          </span>
                        )}
                        {user.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <BadgeCheck className="h-2.5 w-2.5" /> Verified
                          </span>
                        )}
                        {user.activePlan !== 'None' && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 truncate">
                            <Target className="h-2.5 w-2.5 shrink-0" /> {user.activePlan}
                          </span>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setModalUser(user); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600" title="Edit balance">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">User</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Balance</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Joined</th>
                      <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processed.map((user, index) => (
                      <tr key={user._id}
                        className="group transition-all duration-200 hover:bg-indigo-50/30 hover:shadow-sm cursor-pointer"
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => navigate(`/users/${user._id}`)}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(user.name)} text-sm font-bold text-white shadow-md`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                              <p className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {user.phone}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-indigo-600">Rs. {user.currentBalance.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {user.activePlan !== 'None' ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-200/50 shadow-sm">
                              <Target className="h-3 w-3" />
                              {user.activePlan}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No plan</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 border border-purple-200/50">
                                <Shield className="h-3 w-3" />
                                Admin
                              </span>
                            )}
                            {user.isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/50">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                            {user.role !== 'admin' && !user.isVerified && (
                              <span className="text-[11px] text-slate-500 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setModalUser(user)}
                              className="rounded-xl p-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="Edit balance">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => navigate(`/users/${user._id}`)}
                              className="rounded-xl p-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 hover:text-slate-600" title="View details">
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <PaginationBar pagination={pagination} onPageChange={(p) => fetchUsers(p)} />
        </div>
      )}

      {modalUser && (
        <BalanceModal user={modalUser} onClose={() => setModalUser(null)}
          onUpdate={() => { setModalUser(null); fetchUsers(pagination.page); }} />
      )}
    </div>
  );
}
