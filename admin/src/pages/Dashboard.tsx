import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Transactions from './Transactions';
import UsersPage from './Users';
import UserDetail from './UserDetail';
import Plans from './Plans';
import Categories from './Categories';
import Home from './Home';

export default function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
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
    </div>
  );
}
