import { useState } from 'react';
import MarcacionesTab from './MarcacionesTab';
import ResumenTab from './ResumenTab';
import MiAsistenciaTab from './MiAsistenciaTab';
import { puedeVer } from '../../../lib/authStore';

const TABS = [
  { id: 'marcaciones', label: 'Registro de Marcaciones' },
  { id: 'resumen', label: 'Resumen por Empleado' },
];

export default function AsistenciaModule() {
  const [tab, setTab] = useState('marcaciones');
  const vistaCompleta = puedeVer('asistencia');

  // Sin el permiso de "ver" el módulo completo, cada usuario solo puede
  // marcar su propio ingreso y salida — no ve datos de nadie más.
  if (!vistaCompleta) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Asistencia</h1>
          <p className="text-sm text-slate-500 mt-0.5">Marca tu entrada y salida del día.</p>
        </div>
        <MiAsistenciaTab />
      </div>
    );
  }

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
