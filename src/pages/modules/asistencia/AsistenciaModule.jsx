import { useState } from 'react';
import MarcacionesTab from './MarcacionesTab';
import ResumenTab from './ResumenTab';

const TABS = [
  { id: 'marcaciones', label: 'Registro de Marcaciones' },
  { id: 'resumen', label: 'Resumen por Empleado' },
];

export default function AsistenciaModule() {
  const [tab, setTab] = useState('marcaciones');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Asistencia</h1>
        <p className="text-sm text-slate-500 mt-0.5">Marcaciones de entrada y salida, atrasos y ausencias del personal.</p>
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

      {tab === 'marcaciones' && <MarcacionesTab />}
      {tab === 'resumen' && <ResumenTab />}
    </div>
  );
}
