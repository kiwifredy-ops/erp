import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { logout } from '../../lib/authStore';

export default function Topbar({ user, onOpenMenu }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between gap-2 px-3 sm:px-5">
      <button
        onClick={onOpenMenu}
        className="md:hidden p-2 -ml-1 rounded-md text-slate-500 hover:bg-slate-100 shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="text-right leading-tight min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate max-w-[40vw] sm:max-w-none">{user?.nombre}</p>
          <p className="text-[11px] text-slate-500 truncate max-w-[40vw] sm:max-w-none">{user?.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 shrink-0"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
