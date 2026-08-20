import { useState } from 'react';
import EmpleadosTab from './EmpleadosTab';
import DepartamentosTab from './DepartamentosTab';

const TABS = [
  { id: 'empleados', label: 'Empleados' },
  { id: 'departamentos', label: 'Departamentos y Cargos' },
];

export default function RRHHModule() {
  const [tab, setTab] = useState('empleados');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Administración de RRHH</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ficha de empleados, ciclo de vida laboral y estructura organizacional.</p>
      </div>

      <div className="border-b border-slate-200 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'empleados' && <EmpleadosTab />}
      {tab === 'departamentos' && <DepartamentosTab />}
    </div>
  );
}
