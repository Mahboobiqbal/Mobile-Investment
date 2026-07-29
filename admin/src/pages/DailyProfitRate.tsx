import { useEffect, useState } from 'react';
import api from '../api/axios';
import { DollarSign, Save, RotateCcw, Info, TrendingUp, Calendar, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';

export default function DailyProfitRatePage() {
  const [rate, setRate] = useState('0.5');
  const [currentRate, setCurrentRate] = useState(0.5);
  const [isDefault, setIsDefault] = useState(true);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    isOpen: boolean; type: 'success' | 'error'; message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ isOpen: true, type, message });
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/daily-profit-rate');
        const pct = res.data.rate * 100;
        setCurrentRate(pct);
        setRate(String(pct));
        setIsDefault(res.data.isDefault);
        setDate(res.data.date);
      } catch {
        setCurrentRate(0.5);
        setRate('0.5');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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

  const handleReset = () => {
    setRate('0.5');
  };

  // Compute a visual representation: a circular progress-like indicator
  const ratePercent = Math.min(Math.max(parseFloat(rate) || 0, 0), 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (ratePercent / 100) * circumference;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/20">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Left: Title + Rate */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-emerald-200" />
                <span className="text-sm text-emerald-100 font-medium">{date || 'Today'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Daily Profit Rate</h1>
              <p className="text-emerald-100 text-sm max-w-md">
                Set today's profit percentage. Resets to 0.5% automatically each day.
              </p>
              
              {/* Current rate big display */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">{currentRate.toFixed(2)}</span>
                <span className="text-2xl font-semibold text-emerald-200">%</span>
              </div>
              <div className="mt-2">
                {isDefault ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <Clock className="h-3 w-3" />
                    Default — not customized
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <CheckCircle className="h-3 w-3" />
                    Custom rate active
                  </span>
                )}
              </div>
            </div>
            
            {/* Right: Circular gauge */}
            <div className="hidden sm:flex flex-col items-center">
              <div className="relative">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  {/* Background circle */}
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="8"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="60" cy="60" r="54"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{ratePercent.toFixed(1)}</span>
                  <span className="text-xs text-emerald-200">percent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center animate-pulse">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-200" />
          <div className="mx-auto h-6 w-48 rounded bg-slate-200" />
        </div>
      ) : (
        <>
          {/* Set Rate Section */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Update Rate</h2>
                <p className="text-xs text-slate-500">Adjust today's profit distribution rate</p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Today's Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="input-field text-center text-2xl font-bold py-4 pr-12"
                  placeholder="0.5"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-medium text-slate-400">%</span>
              </div>
              
              {/* Quick preset buttons */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Quick:</span>
                {['0.1', '0.25', '0.5', '0.75', '1.0', '2.0'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRate(preset)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      rate === preset
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Enter a value between 0% and 100%. Default is 0.5%.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn btn-primary py-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Rate'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="btn btn-secondary py-3 active:scale-[0.98] disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset to 0.5%
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Info className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">How It Works</h2>
                <p className="text-xs text-slate-500">Understanding the daily profit system</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">1. Set Rate</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The rate applies to <strong className="text-slate-700">all active users</strong> when you trigger ROI distribution.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">2. Default 0.5%</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The default rate is <strong className="text-slate-700">0.5%</strong>. Override it for today using the form above.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">3. Auto Reset</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The rate <strong className="text-slate-700">resets automatically</strong> each day — only set it if you want a different value.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
