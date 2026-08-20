import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw } from 'lucide-react';
import { logout } from '../../lib/authStore';
import { resetAll } from '../../lib/storage';

export default function Topbar({ user }) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleReset() {
    if (!confirm('Esto restablecerá todos los datos de ejemplo a su estado inicial. ¿Continuar?')) return;
    resetAll();
    window.location.href = '/login';
  }

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-5">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          title="Restablecer datos de ejemplo"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer datos
        </button>
        <div className="h-5 w-px bg-slate-200" />
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
