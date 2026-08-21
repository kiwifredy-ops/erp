import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSession } from '../../lib/authStore';

export default function AppLayout() {
  const user = getSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen w-full flex overflow-x-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
