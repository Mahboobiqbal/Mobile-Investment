import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  User as UserIcon, Phone, Mail, Wallet,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Shield, Calendar,
  Users as UsersIcon, BadgeCheck, Target, DollarSign, ArrowUpDown,
  X, Edit3, Eye,
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2.5">
        <div className={`rounded-md p-2 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
      </div>
    </div>
  );
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
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">
        {total === 0 ? 'No results' : <>Showing <span className="font-semibold text-slate-700">{from}</span> to <span className="font-semibold text-slate-700">{to}</span> of{' '}
        <span className="font-semibold text-slate-700">{total}</span></>}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-0.5">
          <button disabled={page <= 1} onClick={() => onPageChange(1)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onPageChange(1)}
            className={`min-w-[1.75rem] rounded px-2 py-1 text-xs font-medium transition-colors ${page === 1 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>1</button>
          {getPages()[0] > 2 && <span className="px-1 text-xs text-slate-300">...</span>}
          {getPages().map((p) => (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[1.75rem] rounded px-2 py-1 text-xs font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
          {getPages()[getPages().length - 1] < pages - 1 && <span className="px-1 text-xs text-slate-300">...</span>}
          <button onClick={() => onPageChange(pages)}
            className={`min-w-[1.75rem] rounded px-2 py-1 text-xs font-medium transition-colors ${page === pages ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{pages}</button>
          <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button disabled={page >= pages} onClick={() => onPageChange(pages)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronsRight className="h-3.5 w-3.5" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Update Balance</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(user.name)} text-xs font-bold text-white`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">Balance: Rs. {user.currentBalance.toLocaleString()}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Amount</label>
            <input type="number" required min="1" step="any"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
              placeholder="Enter amount" value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(['add', 'subtract'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  type === t
                    ? t === 'add' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {t === 'add' ? 'Add Funds' : 'Subtract Funds'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={!amount || parseFloat(amount) <= 0 || submitting}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Updating...' : type === 'add' ? 'Add Balance' : 'Subtract Balance'}
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

  const processed = React.useMemo(() => {
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
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and view user details</p>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={UsersIcon} label="Total Users" value={pagination.total} color="bg-indigo-500" />
          <StatCard icon={BadgeCheck} label="Verified" value={stats.verified} color="bg-emerald-500" />
          <StatCard icon={Target} label="On Plans" value={stats.activePlans} color="bg-amber-500" />
          <StatCard icon={DollarSign} label="Total Balance" value={`Rs. ${stats.totalBalance.toLocaleString()}`} color="bg-sky-500" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search name, email, phone..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="outline-none bg-transparent text-slate-600 font-medium text-xs cursor-pointer">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg bg-slate-100" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 rounded-full bg-slate-100 p-3">
                <UserIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {search ? 'No users match your search' : 'No users found'}
              </p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">User</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Balance</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processed.map((user) => (
                    <tr key={user._id}
                      className="group transition-colors hover:bg-indigo-50/30 cursor-pointer"
                      onClick={() => navigate(`/users/${user._id}`)}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(user.name)} text-[10px] font-bold text-white`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{user.phone}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-bold text-indigo-600">Rs. {user.currentBalance.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        {user.activePlan !== 'None' ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{user.activePlan}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          {user.role === 'admin' && (
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Admin</span>
                          )}
                          {user.isVerified && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Verified</span>
                          )}
                          {user.role !== 'admin' && !user.isVerified && (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-slate-500">
                        <Calendar className="h-3 w-3 inline mr-0.5" />
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setModalUser(user)}
                            className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="Edit balance">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/users/${user._id}`)}
                            className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100 hover:text-slate-600" title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
