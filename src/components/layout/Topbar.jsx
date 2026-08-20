import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { logout } from '../../lib/authStore';

export default function Topbar({ user }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-5">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-800">{user?.nombre}</p>
          <p className="text-[11px] text-slate-500">{user?.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
