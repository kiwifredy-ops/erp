import { useState } from 'react';
import VehiculosTab from './VehiculosTab';
import MantencionesTab from './MantencionesTab';
import MiVehiculoTab from './MiVehiculoTab';
import { puedeVer } from '../../../lib/authStore';

const TABS = [
  { id: 'vehiculos', label: 'Vehículos' },
  { id: 'mantenciones', label: 'Mantenciones' },
];

export default function FlotaModule() {
  const [tab, setTab] = useState('vehiculos');

  // Sin el permiso de "ver" el módulo completo, cada usuario solo ve el o
  // los vehículos asignados a su propio nombre — no la flota completa.
  if (!puedeVer('flota')) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Flota de Vehículos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vehículo(s) asignados a ti.</p>
        </div>
        <MiVehiculoTab />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Flota de Vehículos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vehículos, asignación a técnicos y mantenciones programadas.</p>
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

      {tab === 'vehiculos' && <VehiculosTab />}
      {tab === 'mantenciones' && <MantencionesTab />}
    </div>
  );
}
