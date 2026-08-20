import { useState } from 'react';
import InventarioTab from './InventarioTab';
import EquiposTab from './EquiposTab';

const TABS = [
  { id: 'inventario', label: 'Catálogo e Inventario' },
  { id: 'equipos', label: 'Equipos Asignados' },
];

export default function AlmacenModule() {
  const [tab, setTab] = useState('inventario');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Almacén y Logística</h1>
        <p className="text-sm text-slate-500 mt-0.5">Inventario de materiales, stock mínimo y equipos entregados a técnicos.</p>
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

      {tab === 'inventario' && <InventarioTab />}
      {tab === 'equipos' && <EquiposTab />}
    </div>
  );
}
