import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Inbox } from 'lucide-react';
import { getPlataformaSession, logoutPlataforma } from '../../lib/plataformaAuthStore';

const NAV_ITEMS = [
  { to: '/plataforma', label: 'Empresas', icon: Building2, end: true },
  { to: '/plataforma/solicitudes', label: 'Solicitudes', icon: Inbox, end: false },
];

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 -mb-px">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 text-sm px-3 py-2.5 border-b-2 transition-colors ${
                  isActive ? 'border-sky-400 text-white font-medium' : 'border-transparent text-slate-400 hover:text-white'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
