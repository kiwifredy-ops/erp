import { useState } from 'react';
import ResumenTab from './ResumenTab';
import FacturasVentaTab from './FacturasVentaTab';
import FacturasCompraTab from './FacturasCompraTab';
import CuentasTab from './CuentasTab';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'ventas', label: 'Facturas de Venta' },
  { id: 'compras', label: 'Facturas de Compra' },
  { id: 'cuentas', label: 'Cuentas Bancarias' },
];

export default function ContabilidadModule() {
  const [tab, setTab] = useState('resumen');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Contabilidad</h1>
        <p className="text-sm text-slate-500 mt-0.5">Facturas de venta y compra, notas de crédito, pagos, cuentas bancarias y saldos.</p>
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

      {tab === 'resumen' && <ResumenTab />}
      {tab === 'ventas' && <FacturasVentaTab />}
      {tab === 'compras' && <FacturasCompraTab />}
      {tab === 'cuentas' && <CuentasTab />}
    </div>
  );
}
