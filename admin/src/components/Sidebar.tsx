import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, TrendingUp, Settings, Layers, Home as HomeIcon, X, MessageSquare, DollarSign } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon, shortcut: 'H' },
  { path: '/transactions', label: 'Transactions', icon: TrendingUp, shortcut: 'T' },
  { path: '/users', label: 'Users', icon: Users, shortcut: 'U' },
  { path: '/categories', label: 'Systems', icon: Layers, shortcut: 'S' },
  { path: '/plans', label: 'Plans', icon: Settings, shortcut: 'P' },
  { path: '/posts', label: 'Community', icon: MessageSquare, shortcut: 'C' },
  { path: '/daily-profit-rate', label: 'Daily Profit', icon: DollarSign, shortcut: 'D' },
];

function isActivePath(pathname: string, path: string) {
  if (path === '/users') return pathname.startsWith('/users');
  if (path === '/') return pathname === '/' || pathname === '/Home' || pathname === '';
  return pathname === path;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(location.pathname, item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                active
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            {active && (
              <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                {item.shortcut}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <span className="text-base font-black text-white">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-tight">Admin Panel</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              SmartInvest
            </span>
          </div>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <NavList onNavigate={onNavigate} />
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 border border-slate-200/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">Administrator</p>
            <p className="truncate text-[10px] text-slate-500">admin@smartinvest.pk</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={onClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}
