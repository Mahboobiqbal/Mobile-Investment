import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  DollarSign, TrendingUp, Calendar, Clock, CheckCircle, Coins,
  PiggyBank, Gift, Save, RotateCcw, Percent,
} from 'lucide-react';
import Toast from '../components/Toast';

export default function DailyProfitRatePage() {
  const [rate, setRate] = useState('0.5');
  const [currentRate, setCurrentRate] = useState(0.5);
  const [isDefault, setIsDefault] = useState(true);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minDeposit, setMinDeposit] = useState('500');
  const [signupBonus, setSignupBonus] = useState('0');
  const [savingSettings, setSavingSettings] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean; type: 'success' | 'error'; message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ isOpen: true, type, message });
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rateRes, settingsRes] = await Promise.all([
          api.get('/admin/daily-profit-rate'),
          api.get('/admin/settings'),
        ]);
        const pct = rateRes.data.rate * 100;
        setCurrentRate(pct);
        setRate(String(pct));
        setIsDefault(rateRes.data.isDefault);
        setDate(rateRes.data.date);
        setMinDeposit(String(settingsRes.data.minDeposit));
        setSignupBonus(String(settingsRes.data.signupBonus));
      } catch {
        setCurrentRate(0.5);
        setRate('0.5');
        setMinDeposit('500');
        setSignupBonus('0');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSave = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val < 0 || val > 100) {
      showToast('error', 'Please enter a valid percentage (0–100)');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/daily-profit-rate', { rate: val });
      setCurrentRate(val);
      setIsDefault(false);
      setDate(res.data.date);
      showToast('success', res.data.message);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setRate('0.5');

  const handleSaveSettings = async () => {
    const minVal = parseFloat(minDeposit);
    const bonusVal = parseFloat(signupBonus);
    if (isNaN(minVal) || minVal < 0) {
      showToast('error', 'Please enter a valid minimum deposit amount');
      return;
    }
    if (isNaN(bonusVal) || bonusVal < 0) {
      showToast('error', 'Please enter a valid signup bonus amount');
      return;
    }
    setSavingSettings(true);
    try {
      const res = await api.post('/admin/settings', { minDeposit: minVal, signupBonus: bonusVal });
      showToast('success', res.data.message || 'Settings saved');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
              <div className="h-8 w-32 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="card p-8 animate-pulse">
          <div className="h-6 w-48 rounded bg-slate-200 mb-6" />
          <div className="h-12 w-full rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">App Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage profit rate, deposit limits, and signup rewards</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-lg border border-slate-200">
          <Calendar className="h-3.5 w-3.5" />
          {date || 'Today'}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">{currentRate.toFixed(2)}</span>
            <span className="text-lg font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-2">
            {isDefault ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" /> Default
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" /> Custom
              </span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Min Deposit</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">Rs. {parseFloat(minDeposit || '0').toLocaleString()}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Floor for all deposits</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signup Bonus</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Gift className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">Rs. {parseFloat(signupBonus || '0').toLocaleString()}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Per new registration</p>
        </div>
      </div>

      {/* Main Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Profit Rate */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Percent className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Daily Profit Rate</h2>
              <p className="text-xs text-slate-500">Today's ROI distribution percentage</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Rate (%)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" step="0.01" min="0" max="100"
                    value={rate} onChange={(e) => setRate(e.target.value)}
                    className="input-field text-lg font-bold py-3 pr-12 text-center" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">%</span>
                </div>
                <button onClick={handleReset} disabled={saving}
                  className="px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50" title="Reset to 0.5%">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['0.1', '0.25', '0.5', '0.75', '1.0', '2.0', '3.0', '5.0'].map((preset) => (
                <button key={preset} onClick={() => setRate(preset)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    rate === preset
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  {preset}%
                </button>
              ))}
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full btn btn-primary py-2.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save Rate</span>
              )}
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Coins className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Financial Settings</h2>
              <p className="text-xs text-slate-500">Minimum deposit and signup rewards</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <PiggyBank className="h-3.5 w-3.5 text-blue-700" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Minimum Deposit</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rs.</span>
                <input type="number" min="0"
                  value={minDeposit} onChange={(e) => setMinDeposit(e.target.value)}
                  className="input-field pl-10 text-lg font-bold py-3" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Users cannot submit deposits below this amount.</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                  <Gift className="h-3.5 w-3.5 text-amber-700" />
                </div>
                <span className="text-sm font-semibold text-slate-900">Signup Bonus</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rs.</span>
                <input type="number" min="0"
                  value={signupBonus} onChange={(e) => setSignupBonus(e.target.value)}
                  className="input-field pl-10 text-lg font-bold py-3" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">Automatically credited to new users on registration.</p>
            </div>

            <button onClick={handleSaveSettings} disabled={savingSettings}
              className="w-full btn bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all">
              {savingSettings ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Save Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Rate</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Applied to all active user balances when ROI is distributed.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <PiggyBank className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Min Deposit</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Global floor for wallet top-ups and plan purchases.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Gift className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Signup Bonus</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">New users get this instantly credited on registration.</p>
            </div>
          </div>
        </div>
      </div>

      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
