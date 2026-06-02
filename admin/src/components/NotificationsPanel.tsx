import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle, Clock, X } from 'lucide-react';
import api from '../api/axios';

export type AdminNotification = {
  _id: string;
  title: string;
  message: string;
  meta?: Record<string, any>;
  createdAt: string;
  read: boolean;
};

type Props = {
  onClose?: () => void;
};

function formatTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPanel({ onClose }: Props) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let es: EventSource | null = null;

    const loadInitial = async () => {
      try {
        const [listRes, unreadRes] = await Promise.all([
          api.get('/admin/notifications?limit=20'),
          api.get('/admin/notifications/unread-count'),
        ]);
        const list = listRes.data?.notifications || [];
        setNotifications(list);
        setUnreadCount(unreadRes.data?.count ?? 0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    const startStream = () => {
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const url = `${baseUrl}/admin/notifications/stream`;

      // SSE can't send x-admin-key headers; backend/polling fallback will handle auth failures.
      // If EventSource can't even start, it should not break polling.
      try {
        es = new EventSource(url);
      } catch {
        return;
      }

      es.addEventListener('notification', (ev: MessageEvent) => {
        try {
          const payload = JSON.parse(ev.data);
          const n = payload.notification;
          setNotifications((prev) => {
            const already = prev.some((x) => x._id === n._id);
            if (already) return prev;
            return [{ ...n, read: false }, ...prev].slice(0, 50);
          });
          setUnreadCount((c) => c + 1);
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        try {
          es?.close();
        } catch {
          // ignore
        }
      };
    };

    loadInitial();
    startStream();

    const poll = window.setInterval(async () => {
      try {
        const [listRes, unreadRes] = await Promise.all([
          api.get('/admin/notifications?limit=20'),
          api.get('/admin/notifications/unread-count'),
        ]);
        setNotifications(listRes.data?.notifications || []);
        setUnreadCount(unreadRes.data?.count ?? 0);
      } catch {
        // ignore
      }
    }, 15000);

    return () => {
      window.clearInterval(poll);
      try {
        es?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        api.post('/admin/notifications/mark-read', { notificationId: n._id })
      )
    );

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await api.post('/admin/notifications/mark-read', { notificationId: id });
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);

  if (loading) {
    return (
      <div className="w-[360px] sm:w-[420px] p-4">
        <div className="text-sm font-semibold text-slate-800">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-bold text-slate-900">Notifications</span>
          <span className="text-[11px] font-bold bg-rose-50 text-rose-700 rounded-full px-2 py-0.5 border border-rose-100">
            {unreadCount} unread
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-700">No notifications</p>
          <p className="text-xs text-slate-500 mt-1">You’re all caught up.</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto px-1">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => markRead(n._id)}
              className={`w-full text-left px-3 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                n.read ? 'opacity-80' : 'opacity-100'
              }`}
              title={n.read ? 'Already read' : 'Mark as read'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {n.read ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <div className="text-xs font-bold text-slate-900 truncate">{n.title}</div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 break-words">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-2">{formatTime(n.createdAt)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

