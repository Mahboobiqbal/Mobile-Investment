import { useEffect, useState } from 'react';
import api from '../api/axios';
import { MessageSquare, Send, Calendar, User, Tag } from 'lucide-react';
import Toast from '../components/Toast';

export default function Posts() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('update');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);

  const [toast, setToast] = useState<{
    isOpen: boolean; type: 'success' | 'error'; message: string;
  }>({ isOpen: false, type: 'success', message: '' });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ isOpen: true, type, message });
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/community/posts');
      setPosts(res.data.posts || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('error', 'Title and body are required');
      return;
    }
    setLoading(true);
    try {
      const authorAvatar = import.meta.env.VITE_ADMIN_AVATAR || undefined;
      const res = await api.post('/admin/posts', { title, body, category, isPublished, authorAvatar });
      setPosts(prev => [res.data.post, ...prev]);
      setTitle(''); setBody(''); setCategory('update'); setIsPublished(true);
      showToast('success', 'Post created successfully');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to create post');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Community</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <MessageSquare className="h-3 w-3" />
                {posts.length} posts
              </span>
            </div>
            <p className="text-sm text-slate-500">Create and manage community posts</p>
          </div>
        </div>
      </div>

      {/* Create Post Form */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Create Community Post</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Message Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={4} className="input-field" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="input-field w-auto">
                <option value="update">Update</option>
                <option value="announcement">Announcement</option>
                <option value="education">Education</option>
              </select>
            </div>
            <div className="pt-6">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Published
              </label>
            </div>
            <div className="pt-6 sm:ml-auto">
              <button type="submit" disabled={loading}
                className="btn btn-primary text-xs disabled:opacity-50">
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Recent Posts */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No posts yet. Create your first post above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p: any) => (
              <div key={p._id} className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(p.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{p.body}</p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-medium">
                    <Tag className="h-3 w-3" />
                    {p.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {p.author}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
