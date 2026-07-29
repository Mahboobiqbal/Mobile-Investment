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
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Plans</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <LayoutGrid className="h-3 w-3" />
                {plans.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500">Create and manage investment plans under each system</p>
          </div>
          <button onClick={openCreate} disabled={categories.length === 0}
            className="btn btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Warning */}
      {categories.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-amber-700">
          <span className="font-semibold">No systems exist yet.</span> Create one in the <strong>Systems</strong> page before adding plans.
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Total Plans</p>
                <p className="text-xl font-bold text-slate-900">{plans.length}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ToggleRight className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Active</p>
                <p className="text-xl font-bold text-slate-900">{activePlans}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Inactive</p>
                <p className="text-xl font-bold text-slate-900">{inactivePlans}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FolderOpen className="h-5 w-5" />
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
      <div className="card px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search plans by name or system..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 border-l border-slate-200 pl-4">
          <span>{filtered.length} results</span>
        </div>
      </div>

      {/* Table / Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-slate-200" />
                <div className="h-9 w-20 rounded-lg bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-100">
                <LayoutGrid className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-700">
                {search ? 'No plans match your search' : plans.length === 0 ? 'No plans created yet' : 'No plans found'}
              </p>
              {search ? (
                <button onClick={() => setSearch('')} className="btn btn-primary mt-4 text-xs">
                  Clear Search
                </button>
              ) : categories.length > 0 ? (
                <button onClick={openCreate} className="btn btn-primary mt-4 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create Your First Plan
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-2 p-3 sm:hidden">
                {filtered.map((plan) => (
                  <div key={plan._id} className={`rounded-lg bg-slate-50 p-3 border border-slate-100 ${!plan.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                        plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}>
                        <Percent className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p>
                        {plan.category && (
                          <p className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-medium">
                            <FolderOpen className="h-2.5 w-2.5" /> {plan.category.name}
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                        {(plan.dailyReturnRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 pl-[52px]">
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span><span className="text-slate-400">Min:</span> Rs. {plan.minInvestment.toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">Max:</span>
                          {plan.maxInvestment ? `Rs. ${plan.maxInvestment.toLocaleString()}` : <Infinity className="h-3 w-3" />}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleActive(plan)}
                          className="rounded-lg p-1.5 text-slate-400 active:scale-95">
                          {plan.isActive
                            ? <ToggleRight className="h-4 w-4 text-emerald-600" />
                            : <ToggleLeft className="h-4 w-4 text-slate-400" />}
                        </button>
                        <button onClick={() => openEdit(plan)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(plan._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">System</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Daily Rate</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max</th>
                      <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((plan) => (
                      <tr key={plan._id}
                        className={`group transition-all duration-150 hover:bg-slate-50 ${!plan.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                              plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}>
                              <Percent className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                              {plan.description && (
                                <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{plan.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {plan.category ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                              <FolderOpen className="h-3 w-3" />
                              {plan.category.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No system</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            {(plan.dailyReturnRate * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs font-medium text-slate-700">Rs. {plan.minInvestment.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs font-medium text-slate-700">
                            {plan.maxInvestment
                              ? `Rs. ${plan.maxInvestment.toLocaleString()}`
                              : <Infinity className="h-4 w-4 inline text-slate-400" />}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button onClick={() => handleToggleActive(plan)}
                            className="transition-all duration-150 hover:scale-110 active:scale-95">
                            {plan.isActive
                              ? <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                                  <ToggleRight className="h-4 w-4" /> Active
                                </span>
                              : <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200">
                                  <ToggleLeft className="h-4 w-4" /> Inactive
                                </span>}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(plan)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600" title="Edit">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(plan._id)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete">
                              <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-t-xl sm:rounded-xl bg-white p-5 sm:p-6 shadow-xl animate-scale-in border border-slate-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                  {editingPlan ? <Edit3 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
                  <p className="text-xs text-slate-500">{editingPlan ? 'Update plan details' : 'Add a new investment plan'}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs font-medium text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">System</label>
                <select required={!editingPlan}
                  className="input-field"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={!!editingPlan}>
                  <option value="">Select a system</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Plan Name</label>
                <input type="text" required
                  className="input-field"
                  placeholder="e.g. Economy Car" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Daily Return Rate (%)</label>
                <input type="number" required step="0.1" min="0"
                  className="input-field"
                  placeholder="e.g. 2.0" value={form.dailyReturnRate}
                  onChange={(e) => setForm({ ...form, dailyReturnRate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Min Investment (Rs.)</label>
                  <input type="number" min="0"
                    className="input-field"
                    placeholder="0" value={form.minInvestment}
                    onChange={(e) => setForm({ ...form, minInvestment: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Max Investment (Rs.)</label>
                  <input type="number" min="0"
                    className="input-field"
                    placeholder="Leave empty for unlimited" value={form.maxInvestment}
                    onChange={(e) => setForm({ ...form, maxInvestment: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                <textarea className="input-field"
                  rows={2} placeholder="Optional plan description" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 btn btn-primary text-xs active:scale-95">
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
