import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowLeft, Mail, Phone, Wallet, TrendingUp, TrendingDown,
  Clock, CheckCircle, Ban, ArrowDownCircle, ArrowUpCircle,
  Calendar, Hash, Target, Activity, PieChart,
} from 'lucide-react';

interface Transaction {
  _id: string; amount: number; type: 'Deposit' | 'Withdrawal';
  transactionId?: string; targetPhone?: string; status: string; createdAt: string;
}

interface UserData {
  _id: string; name: string; email: string; phone: string;
  currentBalance: number; activePlan: string; role: string;
  isVerified: boolean; createdAt: string;
  dp?: string;
}

interface Stats {
  totalDeposits: number; totalWithdrawals: number; totalROI: number;
  pendingDeposits: number; pendingWithdrawals: number;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pending' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, label: 'Approved' },
  withdrawn: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Wallet, label: 'Withdrawn' },
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', icon: Ban, label: 'Rejected' },
};

const AVATAR_COLORS = [
  'bg-emerald-600', 'bg-blue-600', 'bg-violet-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600',
  'bg-indigo-600', 'bg-teal-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const GRAVATAR_DEFAULT = 'https://www.gravatar.com/avatar/?d=mp';

function hasProfilePicture(dp?: string) {
  return dp && dp !== GRAVATAR_DEFAULT && dp.trim() !== '';
}

function UserAvatar({ name, dp, size = 'md' }: { name: string; dp?: string; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = React.useState(false);
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-20 w-20 text-2xl',
  };
  const imgSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-20 w-20',
  };

  if (hasProfilePicture(dp) && !imgError) {
    return (
      <div className={`${imgSizeClasses[size]} shrink-0 rounded-full overflow-hidden`}>         
        <img 
          src={dp} 
          alt={name} 
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full font-bold text-white ${getAvatarColor(name)}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TxBadge({ status }: { status: string }) {
  const c = statusConfig[status] || statusConfig.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${c.bg} ${c.text}`}>
      <Icon className="h-3 w-3" /> {c.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="card-hover p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="text-lg font-bold text-slate-900 truncate">
            {typeof value === 'number' ? `Rs. ${value.toLocaleString()}` : value}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100" />)}
      </div>
      <div className="h-64 rounded-xl bg-slate-100" />
    </div>
  );
}

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'Deposit' | 'Withdrawal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'withdrawn' | 'rejected'>('all');

  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setUser(res.data.user);
      setTransactions(res.data.transactions);
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load user', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  const filtered = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    return true;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingState />;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20">
      <p className="text-base sm:text-lg font-semibold text-slate-700">User not found</p>
      <button onClick={() => navigate('/users')} className="mt-4 btn btn-primary">Back to Users</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-bold text-slate-900 truncate">{user.name}</h1>
            <span className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>{user.role}</span>
            {user.isVerified && <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Verified</span>}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
          <div className="flex items-center gap-3 sm:gap-0 sm:flex-col sm:items-center">
            <UserAvatar name={user.name} dp={user.dp} size="lg" />
            <div className="sm:hidden min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-slate-500">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:gap-x-8 sm:gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 truncate">{user.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Target className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 truncate">Plan: <strong>{user.activePlan}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <Wallet className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-base sm:text-lg font-bold text-emerald-600">Rs. {user.currentBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard icon={TrendingUp} label="Total Deposits" value={stats.totalDeposits} color="bg-emerald-500" />
          <StatCard icon={TrendingDown} label="Total Withdrawals" value={stats.totalWithdrawals} color="bg-orange-500" />
          <StatCard icon={Activity} label="ROI Earnings" value={stats.totalROI} color="bg-blue-500" />
          <StatCard icon={Clock} label="Pending Deposits" value={stats.pendingDeposits} color="bg-amber-500" />
          <StatCard icon={Wallet} label="Pending Withdrawals" value={stats.pendingWithdrawals} color="bg-violet-500" />
        </div>
      )}

      {/* Transactions */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 border-b border-slate-200 px-4 sm:px-6 py-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">
            Transaction History
            <span className="ml-2 text-sm font-normal text-slate-400">({filtered.length} of {transactions.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type filter */}
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              {(['all', 'Deposit', 'Withdrawal'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterType === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {t === 'all' ? 'All' : t === 'Deposit' ? 'Deposits' : 'Withdrawals'}
                </button>
              ))}
            </div>
            {/* Status filter */}
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:border-emerald-300">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <PieChart className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No transactions match these filters</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="space-y-2 p-3 sm:hidden">
              {filtered.map((tx) => (
                <div key={tx._id} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      tx.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.type === 'Deposit' ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">{tx.type}</span>
                        <TxBadge status={tx.status} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(tx.createdAt)}</span>
                        {tx.transactionId && <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {tx.transactionId}</span>}
                        {tx.targetPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {tx.targetPhone}</span>}
                      </div>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${tx.type === 'Deposit' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {tx.type === 'Deposit' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop rows */}
            <div className="hidden sm:block divide-y divide-slate-100">
              {filtered.map((tx) => (
                <div key={tx._id} className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
                  {/* Type icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    tx.type === 'Deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {tx.type === 'Deposit' ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{tx.type}</span>
                      <TxBadge status={tx.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(tx.createdAt)}</span>
                      {tx.transactionId && <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> {tx.transactionId}</span>}
                      {tx.targetPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {tx.targetPhone}</span>}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-base font-bold ${tx.type === 'Deposit' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {tx.type === 'Deposit' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
