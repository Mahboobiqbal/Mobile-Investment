import { useEffect, useState } from 'react';
import api from '../api/axios';
import { DollarSign, Save, RotateCcw, Sparkles } from 'lucide-react';

export default function DailyProfitRatePage() {
  const [rate, setRate] = useState('0.5');
  const [currentRate, setCurrentRate] = useState(0.5);
  const [isDefault, setIsDefault] = useState(true);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      alert('Please enter a valid percentage (0–100)');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/daily-profit-rate', { rate: val });
      setCurrentRate(val);
      setIsDefault(false);
      setDate(res.data.date);
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRate('0.5');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Daily Profit Rate</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                <Sparkles className="h-3 w-3" />
                {date || 'Today'}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Set today's profit percentage. Resets to 0.5% automatically each day.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center animate-pulse">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-200" />
          <div className="mx-auto h-6 w-48 rounded-lg bg-slate-200" />
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/25">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Current Rate</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{currentRate.toFixed(2)}</span>
                <span className="text-2xl font-bold text-slate-500">%</span>
              </div>
              {isDefault && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  Default (not customized for today)
                </span>
              )}
              {!isDefault && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Custom rate for today
                </span>
              )}
            </div>

            <div className="mx-auto max-w-sm">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Set Today's Rate (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-bold text-center outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="0.5"
                />
                <span className="text-lg font-bold text-slate-500">%</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Enter a value between 0% and 100%. Default is 0.5%.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-3">How It Works</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">1</div>
                <p>The daily profit rate applies to <strong>all active users</strong> when you trigger ROI distribution.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">2</div>
                <p>The default rate is <strong>0.5%</strong>. You can override it for today using the form above.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">3</div>
                <p>The rate <strong>resets to 0.5% automatically</strong> each day — you only need to set it if you want a different value.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
