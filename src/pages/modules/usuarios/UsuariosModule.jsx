import { useState } from 'react';
import UsuariosTab from './UsuariosTab';
import PermisosTab from './PermisosTab';

const TABS = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'permisos', label: 'Roles y Permisos' },
];

export default function UsuariosModule() {
  const [tab, setTab] = useState('usuarios');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Usuarios y Permisos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cuentas de acceso al sistema y qué puede ver, crear, editar o eliminar cada rol en cada módulo.</p>
      </div>

      <div className="border-b border-slate-200 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <UsuariosTab />}
      {tab === 'permisos' && <PermisosTab />}
    </div>
  );
}
