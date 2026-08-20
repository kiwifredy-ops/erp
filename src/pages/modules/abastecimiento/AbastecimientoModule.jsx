import { useState } from 'react';
import OrdenesTab from './OrdenesTab';
import ProveedoresTab from './ProveedoresTab';

const TABS = [
  { id: 'ordenes', label: 'Órdenes de Compra' },
  { id: 'proveedores', label: 'Proveedores' },
];

export default function AbastecimientoModule() {
  const [tab, setTab] = useState('ordenes');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Abastecimiento</h1>
        <p className="text-sm text-slate-500 mt-0.5">Órdenes de compra, proveedores y seguimiento de solicitudes de material.</p>
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

      {tab === 'ordenes' && <OrdenesTab />}
      {tab === 'proveedores' && <ProveedoresTab />}
    </div>
  );
}
