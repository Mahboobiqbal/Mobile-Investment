import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Plus, Edit3, Trash2, X, Search,
  LayoutGrid, ToggleLeft, ToggleRight, Percent, DollarSign,
  Infinity, Ban, FolderOpen, Sparkles,
} from 'lucide-react';

interface Category {
  _id: string; name: string;
}

interface Plan {
  _id: string;
  category: Category;
  name: string;
  dailyReturnRate: number;
  minInvestment: number;
  maxInvestment: number | null;
  description: string;
  isActive: boolean;
}

const defaultForm = {
  category: '',
  name: '',
  dailyReturnRate: '',
  minInvestment: '0',
  maxInvestment: '',
  description: '',
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [plansRes, catsRes] = await Promise.all([
        api.get('/admin/plans'),
        api.get('/admin/categories'),
      ]);
      setPlans(plansRes.data.plans);
      setCategories(catsRes.data.categories);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(defaultForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      category: plan.category?._id || '',
      name: plan.name,
      dailyReturnRate: String(plan.dailyReturnRate * 100),
      minInvestment: String(plan.minInvestment),
      maxInvestment: plan.maxInvestment ? String(plan.maxInvestment) : '',
      description: plan.description,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!editingPlan && !form.category) {
      setError('Please select a system');
      return;
    }
    const dailyReturnRateNum = parseFloat(form.dailyReturnRate) / 100;
    if (isNaN(dailyReturnRateNum) || dailyReturnRateNum <= 0) {
      setError('Daily return rate must be a positive number');
      return;
    }
    const payload: Record<string, unknown> = {
      name: form.name,
      dailyReturnRate: dailyReturnRateNum,
      minInvestment: form.minInvestment ? parseFloat(form.minInvestment) : 0,
      maxInvestment: form.maxInvestment ? parseFloat(form.maxInvestment) : null,
      description: form.description,
    };
    if (!editingPlan) payload.category = form.category;
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan._id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/admin/plans/${planId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete plan');
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      await api.put(`/admin/plans/${plan._id}`, { isActive: !plan.isActive });
      fetchData();
    } catch (err) {
      alert('Failed to toggle plan status');
    }
  };

  const filtered = search
    ? plans.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : plans;

  const activePlans = plans.filter(p => p.isActive).length;
  const inactivePlans = plans.length - activePlans;
  const systemsUsed = new Set(plans.map(p => p.category?._id).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                <LayoutGrid className="h-3 w-3" />
                {plans.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500">Create and manage investment plans under each system</p>
          </div>
          <button onClick={openCreate} disabled={categories.length === 0}
            className="btn btn-primary text-xs gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Warning */}
      {categories.length === 0 && (
        <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-50 to-amber-100/50 px-5 py-4 text-sm text-amber-700 shadow-sm">
          <span className="font-bold">No systems exist yet.</span> Create one in the <strong>Systems</strong> page before adding plans.
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="glass-card p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="stat-label">Total Plans</p>
                <p className="text-xl font-bold text-slate-900">{plans.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <ToggleRight className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="stat-label">Active</p>
                <p className="text-xl font-bold text-slate-900">{activePlans}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-slate-500/10 to-slate-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/25">
                <Ban className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="stat-label">Inactive</p>
                <p className="text-xl font-bold text-slate-900">{inactivePlans}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 transition-all duration-500 group-hover:scale-150" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="stat-label">Systems Used</p>
                <p className="text-xl font-bold text-slate-900">{systemsUsed}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="glass rounded-2xl px-4 py-3 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search plans by name or system..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/60 py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded-lg bg-slate-200" />
                  <div className="h-3 w-32 rounded-lg bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-xl bg-slate-200" />
                <div className="h-9 w-20 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
                <LayoutGrid className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-bold text-slate-700">
                {search ? 'No plans match your search' : plans.length === 0 ? 'No plans created yet' : 'No plans found'}
              </p>
              {search ? (
                <button onClick={() => setSearch('')} className="btn btn-primary mt-4 text-xs">
                  Clear Search
                </button>
              ) : categories.length > 0 ? (
                <button onClick={openCreate} className="btn btn-primary mt-4 text-xs gap-2">
                  <Plus className="h-3.5 w-3.5" /> Create Your First Plan
                </button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Plan</th>
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">System</th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Rate</th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Min</th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Max</th>
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((plan) => (
                    <tr key={plan._id}
                      className={`group transition-all duration-200 hover:bg-slate-50/50 ${!plan.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${
                            plan.isActive
                              ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/25'
                              : 'from-slate-400 to-slate-500 shadow-slate-500/25'
                          }`}>
                            <Percent className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                            {plan.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{plan.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {plan.category ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 border border-indigo-200/50 shadow-sm">
                            <FolderOpen className="h-3 w-3" />
                            {plan.category.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No system</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/50">
                          {(plan.dailyReturnRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-semibold text-slate-700">Rs. {plan.minInvestment.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-semibold text-slate-700">
                          {plan.maxInvestment
                            ? `Rs. ${plan.maxInvestment.toLocaleString()}`
                            : <Infinity className="h-4 w-4 inline text-slate-400" />}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => handleToggleActive(plan)}
                          className="transition-all duration-200 hover:scale-110 active:scale-95">
                          {plan.isActive
                            ? <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/50 shadow-sm">
                                <ToggleRight className="h-4 w-4" /> Active
                              </span>
                            : <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200/50">
                                <ToggleLeft className="h-4 w-4" /> Inactive
                              </span>}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(plan)}
                            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(plan._id)}
                            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-black/10 animate-scale-in border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
                  {editingPlan ? <Edit3 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                  <p className="text-xs text-slate-500">{editingPlan ? 'Update plan details' : 'Add a new investment plan'}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-xs font-semibold text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">System</label>
                <select required={!editingPlan}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={!!editingPlan}>
                  <option value="">Select a system</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Plan Name</label>
                <input type="text" required
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. Economy Car" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Daily Return Rate (%)</label>
                <input type="number" required step="0.1" min="0"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. 2.0" value={form.dailyReturnRate}
                  onChange={(e) => setForm({ ...form, dailyReturnRate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Min Investment (Rs.)</label>
                  <input type="number" min="0"
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="0" value={form.minInvestment}
                    onChange={(e) => setForm({ ...form, minInvestment: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Max Investment (Rs.)</label>
                  <input type="number" min="0"
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Leave empty for unlimited" value={form.maxInvestment}
                    onChange={(e) => setForm({ ...form, maxInvestment: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea className="w-full rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  rows={2} placeholder="Optional plan description" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all active:scale-95">
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
