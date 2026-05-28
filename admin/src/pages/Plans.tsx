import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Plus, Edit3, Trash2, X, FolderOpen, Search,
  LayoutGrid, ToggleLeft, ToggleRight, Percent, DollarSign,
  Infinity, Ban
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
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
      setError('Please select a category');
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Plans</h1>
          <p className="text-xs text-slate-500 mt-0.5">Create and manage investment plans under each system</p>
        </div>
        <button onClick={openCreate} disabled={categories.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="h-3.5 w-3.5" /> New Plan
        </button>
      </div>

      {categories.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          No systems exist yet. Create one in the <strong>Systems</strong> page first.
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={LayoutGrid} label="Total Plans" value={plans.length} color="bg-indigo-500" />
          <StatCard icon={ToggleRight} label="Active" value={activePlans} color="bg-emerald-500" />
          <StatCard icon={Ban} label="Inactive" value={plans.length - activePlans} color="bg-slate-500" />
          <StatCard icon={FolderOpen} label="Systems Used" value={new Set(plans.map(p => p.category?._id).filter(Boolean)).size} color="bg-amber-500" />
        </div>
      )}

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search plans..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-slate-100" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 rounded-full bg-slate-100 p-3">
                <LayoutGrid className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {search ? 'No plans match your search' : plans.length === 0 ? 'No plans created yet' : 'No plans match your search'}
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
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">System</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Daily Rate</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Max</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((plan) => (
                    <tr key={plan._id} className={`transition-colors hover:bg-slate-50/50 ${!plan.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{plan.name}</p>
                          {plan.description && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{plan.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {plan.category ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                            <FolderOpen className="h-3 w-3" /> {plan.category.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs font-bold text-emerald-600">{(plan.dailyReturnRate * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">Rs. {plan.minInvestment.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">
                        {plan.maxInvestment ? `Rs. ${plan.maxInvestment.toLocaleString()}` : <Infinity className="h-3.5 w-3.5 inline text-slate-400" />}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => handleToggleActive(plan)}
                          className="transition-colors hover:opacity-80">
                          {plan.isActive
                            ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                            : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(plan)}
                            className="rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all" title="Edit">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(plan._id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">System</label>
                <select required={!editingPlan}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={!!editingPlan}>
                  <option value="">Select a system</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Plan Name</label>
                <input type="text" required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  placeholder="e.g. Economy Car" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Daily Return Rate (%)</label>
                <input type="number" required step="0.1" min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  placeholder="e.g. 2.0" value={form.dailyReturnRate}
                  onChange={(e) => setForm({ ...form, dailyReturnRate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Investment</label>
                  <input type="number" min="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="0" value={form.minInvestment}
                    onChange={(e) => setForm({ ...form, minInvestment: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Investment</label>
                  <input type="number" min="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                    placeholder="Unlimited" value={form.maxInvestment}
                    onChange={(e) => setForm({ ...form, maxInvestment: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                  rows={2} placeholder="Optional" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">
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
