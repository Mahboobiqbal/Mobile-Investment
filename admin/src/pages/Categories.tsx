import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Plus, Edit3, Trash2, X, Layers, ToggleLeft, ToggleRight, Search,
  Hash, FileText, Eye, EyeOff, Sparkles,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing._id}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this system? Plans linked to it must be removed first.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (err) {
      alert('Failed to toggle');
    }
  };

  const filtered = search
    ? categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const active = categories.filter(c => c.isActive).length;
  const inactive = categories.length - active;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Systems</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <Layers className="h-3 w-3" />
                {categories.length} total
              </span>
            </div>
            <p className="text-sm text-slate-500">Create and manage investment categories</p>
          </div>
          <button onClick={openCreate}
            className="btn btn-primary text-xs self-start sm:self-auto">
            <Plus className="h-4 w-4" /> New System
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Total Systems</p>
                <p className="text-xl font-bold text-slate-900">{categories.length}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Active</p>
                <p className="text-xl font-bold text-slate-900">{active}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Inactive</p>
                <p className="text-xl font-bold text-slate-900">{inactive}</p>
              </div>
            </div>
          </div>
          <div className="card-hover p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <p className="stat-label">Plans</p>
                <p className="text-xl font-bold text-slate-900">—</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search systems by name, slug, or description..."
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
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-56 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-100">
                <Layers className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-700">
                {search ? 'No systems match your search' : 'No systems yet'}
              </p>
              {search ? (
                <button onClick={() => setSearch('')} className="btn btn-primary mt-4 text-xs">
                  Clear Search
                </button>
              ) : (
                <button onClick={openCreate} className="btn btn-primary mt-4 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Create Your First System
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-2 p-3 sm:hidden">
                {filtered.map((cat) => (
                  <div key={cat._id} className={`rounded-lg bg-slate-50 p-3 border border-slate-100 ${!cat.isActive ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'} text-white`}>
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{cat.name}</p>
                        <code className="text-[10px] text-slate-500">{cat.slug}</code>
                        {cat.description && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 pl-[52px]">
                      <button onClick={() => handleToggle(cat)}
                        className="transition-all duration-150 active:scale-95">
                        {cat.isActive
                          ? <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              <ToggleRight className="h-3 w-3" /> Active
                            </span>
                          : <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              <ToggleLeft className="h-3 w-3" /> Inactive
                            </span>}
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(cat)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat._id)}
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
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">System</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Slug</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Description</th>
                      <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((cat) => (
                      <tr key={cat._id}
                        className={`group transition-all duration-150 hover:bg-slate-50 ${!cat.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.isActive ? 'bg-emerald-500' : 'bg-slate-400'} text-white`}>
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                              <p className="text-[11px] text-slate-500">ID: {cat._id.slice(-8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono font-medium text-slate-600">{cat.slug}</code>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[220px] inline-block">
                              {cat.description || <span className="italic text-slate-300">No description</span>}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button onClick={() => handleToggle(cat)}
                            className="transition-all duration-150 hover:scale-110 active:scale-95">
                            {cat.isActive
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
                            <button onClick={() => openEdit(cat)}
                              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600" title="Edit">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(cat._id)}
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
                  {editing ? <Edit3 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{editing ? 'Edit System' : 'New System'}</h2>
                  <p className="text-xs text-slate-500">{editing ? 'Update system details' : 'Create a new investment category'}</p>
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
                <label className="block text-xs font-medium text-slate-700 mb-1.5">System Name</label>
                <input type="text" required
                  className="input-field"
                  placeholder="e.g. Car Rental System"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
                <textarea className="input-field"
                  rows={3} placeholder="Optional description of the system"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 btn btn-primary text-xs active:scale-95">
                  {editing ? 'Update System' : 'Create System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
