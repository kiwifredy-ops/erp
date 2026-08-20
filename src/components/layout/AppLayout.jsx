import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSession } from '../../lib/authStore';

export default function AppLayout() {
  const user = getSession();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen w-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
