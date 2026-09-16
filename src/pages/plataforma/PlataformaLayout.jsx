import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';
import { getPlataformaSession, logoutPlataforma } from '../../lib/plataformaAuthStore';

export default function PlataformaLayout() {
  const superUser = getPlataformaSession();
  const navigate = useNavigate();
  if (!superUser) return <Navigate to="/plataforma/login" replace />;

  function handleLogout() {
    logoutPlataforma();
    navigate('/plataforma/login');
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="leading-tight min-w-0">
              <p className="text-sm font-semibold truncate">Panel de Plataforma</p>
              <p className="text-[11px] text-slate-400 truncate">Gestión de empresas</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-300 hidden sm:inline">{superUser.nombre}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white">
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
