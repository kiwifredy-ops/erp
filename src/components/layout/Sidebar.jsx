import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { MODULES } from '../../lib/modules';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 text-slate-200 shrink-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <ShieldCheck className="w-6 h-6 text-sky-400" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">ERP</p>
          <p className="text-[11px] text-slate-400">Sistemas de Seguridad</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <NavLink
          to="/"
          end
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

        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.id}
              to={`/modulos/${m.id}`}
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
    </aside>
  );
}
