import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

const titleMap: { test: RegExp; title: string }[] = [
  { test: /^\/transactions$/, title: 'Transactions' },
  { test: /^\/users\/[^/]+$/, title: 'User Details' },
  { test: /^\/users$/, title: 'Users' },
  { test: /^\/categories$/, title: 'Systems' },
  { test: /^\/plans$/, title: 'Plans' },
  { test: /^\/posts$/, title: 'Community' },
  { test: /^\/daily-profit-rate$/, title: 'Daily Profit' },
  { test: /^\/$/, title: 'Home' },
];

function getTitle(pathname: string) {
  return titleMap.find((m) => m.test.test(pathname))?.title ?? 'Admin';
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
          <span className="text-[10px] font-bold text-white">M</span>
        </div>
        <h1 className="text-sm font-semibold text-slate-900">{getTitle(location.pathname)}</h1>
      </div>
    </header>
  );
}
