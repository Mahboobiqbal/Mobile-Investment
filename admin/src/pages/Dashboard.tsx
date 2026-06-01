import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Users, TrendingUp, Settings, Layers, Home as HomeIcon } from 'lucide-react';
import Transactions from './Transactions';
import UsersPage from './Users';
import UserDetail from './UserDetail';
import Plans from './Plans';
import Categories from './Categories';
import Home from './Home';

const Dashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/transactions', label: 'Transactions', icon: TrendingUp },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/categories', label: 'Systems', icon: Layers },
    { path: '/plans', label: 'Plans', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/users') return location.pathname.startsWith('/users');
    if (path === '/') return location.pathname === '/' || location.pathname === '/Home' || location.pathname === '';
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-xl font-bold text-indigo-600">Admin Panel</span>
        </div>
        <nav className="mt-6 space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/plans" element={<Plans />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
