import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, X } from 'lucide-react';
import { MODULES } from '../../lib/modules';
import { puedeVer } from '../../lib/authStore';

function NavContent({ visibles, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
      <NavLink
        to="/"
        end
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive ? 'bg-sky-500/15 text-sky-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        Panel principal
      </NavLink>

      <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Módulos
      </p>

      {visibles.map((m) => {
        const Icon = m.icon;
        return (
          <NavLink
            key={m.id}
            to={`/modulos/${m.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-sky-500/15 text-sky-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{m.nombre}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800 shrink-0">
      <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0" />
      <div className="leading-tight min-w-0">
        <p className="text-sm font-semibold text-white truncate">ERP</p>
        <p className="text-[11px] text-slate-400 truncate">Sistemas de Seguridad</p>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const visibles = MODULES.filter((m) => puedeVer(m.id));

  return (
    <>
      {/* Escritorio: fija en el flujo del layout */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-slate-200 shrink-0">
        <Brand />
        <NavContent visibles={visibles} />
      </aside>

      {/* Móvil: panel deslizable sobre el contenido */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="relative w-72 max-w-[85vw] flex flex-col bg-slate-900 text-slate-200 h-full shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 shrink-0">
              <Brand />
              <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-2 mr-2 shrink-0" aria-label="Cerrar menú">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent visibles={visibles} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
