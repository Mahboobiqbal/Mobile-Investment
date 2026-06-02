import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, TrendingUp, LayoutGrid,
  Activity, ArrowUpRight, ArrowDownRight, Target,
  BarChart3, PieChart, LineChart, ScatterChart,
  Wallet, Banknote, UserPlus, Clock,
  RefreshCw, Bell, Calendar, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
  AreaChart, Area,
  ScatterChart as RechartsScatterChart, Scatter,
} from 'recharts';
import api from '../api/axios';
import NotificationBell from '../components/NotificationBell';


interface UserStats {
  total: number; verified: number; investors: number; totalBalance: number;
}
interface TransactionStats {
  total: number; pending: number; approved: number; withdrawn: number;
  rejected: number; totalDeposits: number; totalWithdrawals: number;
}
interface DailyTransaction {
  _id: string; deposits: number; withdrawals: number; count: number;
}
interface MonthlyGrowth {
  _id: string; count: number;
}
interface TopUser {
  _id: string; name: string; email: string; currentBalance: number;
}
interface AnalyticsData {
  users: UserStats; transactions: TransactionStats;
  plans: { total: number }; categories: { active: number };
  dailyTransactions: DailyTransaction[]; monthlyGrowth: MonthlyGrowth[];
  topUsers: TopUser[];
}

const COLORS = {
  indigo: '#6366f1', indigoLight: '#a5b4fc',
  emerald: '#10b981', emeraldLight: '#6ee7b7',
  rose: '#f43f5e', roseLight: '#fda4af',
  amber: '#f59e0b', amberLight: '#fcd34d',
  blue: '#3b82f6', blueLight: '#93c5fd',
  cyan: '#06b6d4', cyanLight: '#67e8f9',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-200/80">
      <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-900">Rs. {p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-200/80">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="text-sm font-semibold text-slate-900">{d.name}</span>
      </div>
      <p className="text-lg font-bold mt-1">{d.value.toLocaleString()}</p>
    </div>
  );
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const step = Math.max(1, Math.floor(value / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, duration / 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export default function Home() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const h = currentTime.getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [currentTime]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const dailyChartData = useMemo(() =>
    data?.dailyTransactions.map(d => ({
      date: formatDate(d._id), deposits: d.deposits, withdrawals: d.withdrawals,
    })).slice(-14) || [], [data]);

  const monthlyChartData = useMemo(() =>
    data?.monthlyGrowth.map(m => ({ month: m._id, users: m.count })) || [], [data]);

  const transactionPieData = useMemo(() => [
    { name: 'Pending', value: data?.transactions.pending || 0, color: COLORS.amber },
    { name: 'Approved', value: data?.transactions.approved || 0, color: COLORS.emerald },
    { name: 'Withdrawn', value: data?.transactions.withdrawn || 0, color: COLORS.blue },
    { name: 'Rejected', value: data?.transactions.rejected || 0, color: COLORS.rose },
  ], [data]);

  const scatterData = useMemo(() =>
    data?.dailyTransactions.map(d => ({
      deposits: d.deposits,
      withdrawals: d.withdrawals,
      date: formatDate(d._id),
    })).slice(-14) || [], [data]);

  const depositPct = data ? (data.transactions.totalDeposits / (data.transactions.totalDeposits + data.transactions.totalWithdrawals) * 100) : 50;
  const withdrawalPct = 100 - depositPct;
  const conversionRate = data ? ((data.users.investors / data.users.total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-7 sm:h-8 w-48 sm:w-64 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-4 sm:h-5 w-36 sm:w-48 rounded-lg bg-slate-100 animate-pulse" />
          </div>
          <div className="h-9 w-24 sm:w-32 rounded-xl bg-slate-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 sm:h-32 rounded-2xl bg-slate-100 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-72 sm:h-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="bg-white rounded-2xl p-8 text-center max-w-md border border-slate-200 shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
          <BarChart3 className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Analytics</h3>
        <p className="mt-2 text-sm text-slate-500">Check your connection and try again</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary mt-6">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </button>
      </div>
    </div>
  );

  const today = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {greeting}, Admin
              </h1>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 animate-float shrink-0" />
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {today}
              </span>
              <span className="hidden sm:inline mx-1">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                System is live
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />

            <button className="btn btn-secondary text-xs gap-2 px-3 sm:px-4">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5 group relative overflow-hidden hover:shadow-lg transition-all">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 transition-all duration-500 group-hover:scale-150" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</span>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight mt-2 sm:mt-3 text-slate-900">
              <CountUp value={data.users.total} />
            </p>
            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <UserPlus className="h-3 w-3" />
                +{data.users.verified} verified
              </span>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <span className="text-slate-500">{conversionRate.toFixed(1)}% investors</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5 group relative overflow-hidden hover:shadow-lg transition-all">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 transition-all duration-500 group-hover:scale-150" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Active Investors</span>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight mt-2 sm:mt-3 text-slate-900">
              <CountUp value={data.users.investors} />
            </p>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ArrowUpRight className="h-3 w-3" />
                +{data.users.total - data.users.investors > 0 ? data.users.total - data.users.investors : 0} potential
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5 group relative overflow-hidden hover:shadow-lg transition-all">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 transition-all duration-500 group-hover:scale-150" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Total Balance</span>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/25">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-bold tracking-tight mt-2 sm:mt-3 text-slate-900">
              <span className="text-sm sm:text-base font-semibold text-slate-500 mr-0.5">Rs.</span>
              <CountUp value={data.users.totalBalance} />
            </p>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Banknote className="h-3 w-3" />
                Across all users
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5 group relative overflow-hidden hover:shadow-lg transition-all">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 transition-all duration-500 group-hover:scale-150" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">Active Plans</span>
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight mt-2 sm:mt-3 text-slate-900">
              <CountUp value={data.plans.total} />
            </p>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Target className="h-3 w-3" />
                {data.categories.active} categories
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        {/* 14-Day Activity Bar Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">14-Day Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily deposits & withdrawals overview</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded bg-emerald-500" />
                <span className="text-[10px] font-medium text-slate-500">Deposits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded bg-rose-500" />
                <span className="text-[10px] font-medium text-slate-500">Withdrawals</span>
              </div>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="deposits" stackId="a" fill={COLORS.emerald} radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="withdrawals" stackId="a" fill={COLORS.rose} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No transaction data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Transaction Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">Current distribution</p>
            </div>
            <PieChart className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={transactionPieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                  stroke="none"
                >
                  {transactionPieData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {transactionPieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-slate-500 truncate">{item.name}</p>
                  <p className="text-xs font-bold text-slate-900">{item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row - User Growth + Scatter + Financial Flow */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        {/* User Growth Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">User Growth</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
            </div>
            <LineChart className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-56 sm:h-64">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" stroke={COLORS.indigo} strokeWidth={2.5} fill="url(#userGrowth)" dot={{ r: 3, fill: COLORS.indigo, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5, fill: COLORS.indigo, strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <LineChart className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No growth data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scatter Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Deposits vs Withdrawals</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily correlation scatter</p>
            </div>
            <ScatterChart className="h-4 w-4 text-slate-400" />
          </div>
          <div className="h-56 sm:h-64">
            {scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="deposits" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} name="Deposits" />
                  <YAxis type="number" dataKey="withdrawals" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} name="Withdrawals" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-200/80">
                          <p className="text-xs font-semibold text-slate-500 mb-1">{d.date}</p>
                          <p className="text-xs text-slate-600">Deposits: <span className="font-bold text-emerald-600">Rs. {d.deposits.toLocaleString()}</span></p>
                          <p className="text-xs text-slate-600">Withdrawals: <span className="font-bold text-rose-600">Rs. {d.withdrawals.toLocaleString()}</span></p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData} fill={COLORS.indigo} stroke={COLORS.indigoLight} strokeWidth={1} />
                </RechartsScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <ScatterChart className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Flow */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Financial Flow</h2>
              <p className="text-xs text-slate-500 mt-0.5">Overall deposits vs withdrawals</p>
            </div>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div className="relative">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-emerald-500" />
                  Total Deposits
                </span>
                <span className="text-sm font-bold text-emerald-600">Rs. {data.transactions.totalDeposits.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${depositPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">{depositPct.toFixed(1)}% of total flow</span>
            </div>
            <div className="relative">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-rose-500" />
                  Total Withdrawals
                </span>
                <span className="text-sm font-bold text-rose-600">Rs. {data.transactions.totalWithdrawals.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
                  style={{ width: `${withdrawalPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">{withdrawalPct.toFixed(1)}% of total flow</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Net Flow</span>
                <span className={`text-lg font-bold ${data.transactions.totalDeposits >= data.transactions.totalWithdrawals ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rs. {(data.transactions.totalDeposits - data.transactions.totalWithdrawals).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${data.transactions.totalDeposits >= data.transactions.totalWithdrawals ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.transactions.totalDeposits >= data.transactions.totalWithdrawals ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  Positive cash flow
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Top Investors + Transaction Summary */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Top Investors */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Investors</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highest balance holders</p>
            </div>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2">
            {data.topUsers.map((user, i) => (
              <div key={user._id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 sm:p-3 transition-all hover:bg-slate-100 border border-slate-100">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-xs sm:text-sm font-bold text-white shadow-md ${
                      i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                      i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900' :
                      'bg-gradient-to-br from-indigo-400 to-indigo-600'
                    }`}>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {i < 3 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-bold text-slate-500 shadow-sm border border-slate-200">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-[11px] sm:text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-emerald-600 shrink-0">Rs. {user.currentBalance.toLocaleString()}</span>
              </div>
            ))}
            {data.topUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No investors yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Transaction Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Transaction Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Quick summary of all activity</p>
            </div>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 sm:p-4 border border-emerald-200/30">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.transactions.total.toLocaleString()}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">All time transactions</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 sm:p-4 border border-amber-200/30">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900">{data.transactions.pending.toLocaleString()}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Awaiting review</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 sm:p-4 border border-blue-200/30">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Deposits</span>
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-slate-900">Rs. {data.transactions.totalDeposits.toLocaleString()}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Total deposited</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 p-3 sm:p-4 border border-rose-200/30">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Withdrawals</span>
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-slate-900">Rs. {data.transactions.totalWithdrawals.toLocaleString()}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Total withdrawn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
