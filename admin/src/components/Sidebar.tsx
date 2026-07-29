import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, TrendingUp, Settings, Layers, Home as HomeIcon, X, MessageSquare, DollarSign } from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/transactions', label: 'Transactions', icon: TrendingUp },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/categories', label: 'Systems', icon: Layers },
  { path: '/plans', label: 'Plans', icon: Settings },
  { path: '/posts', label: 'Community', icon: MessageSquare },
  { path: '/daily-profit-rate', label: 'Daily Profit', icon: DollarSign },
];

function isActivePath(pathname: string, path: string) {
  if (path === '/users') return pathname.startsWith('/users');
  if (path === '/') return pathname === '/' || pathname === '/Home' || pathname === '';
  return pathname === path;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(location.pathname, item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0`} />
            <span className="truncate">{item.label}</span>
            {active && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-700/50 px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white leading-tight">Admin Panel</span>
            <span className="text-[10px] text-slate-400">
              SmartInvest
            </span>
          </div>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0`} />
              <span className="truncate">{item.label}</span>
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">Administrator</p>
            <p className="truncate text-[10px] text-slate-400">admin@smartinvest.pk</p>
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
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={onClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-60 border-r border-slate-200 bg-white">
        <SidebarContent />
      </aside>
    </>
  );
}
