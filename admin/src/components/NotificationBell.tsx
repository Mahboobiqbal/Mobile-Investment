import React from 'react';
import { Bell } from 'lucide-react';
import api from '../api/axios';
import NotificationsPanel from './NotificationsPanel';

export default function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications/unread-count');
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchUnreadCount();
    const poll = window.setInterval(fetchUnreadCount, 15000);
    return () => window.clearInterval(poll);
  }, [fetchUnreadCount]);

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-ghost relative p-2 sm:p-2.5 rounded-xl"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50"
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <NotificationsPanel
            onClose={() => {
              setOpen(false);
              fetchUnreadCount();
            }}
          />
        </div>
      )}
    </div>
  );
}

