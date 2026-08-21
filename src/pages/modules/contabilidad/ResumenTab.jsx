import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getResumen, getAlertasContabilidad, formatCLP } from '../../../lib/contabilidadStore';

export default function ResumenTab() {
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState({ ventasVencidas: [], comprasVencidas: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getResumen(), getAlertasContabilidad()])
      .then(([r, a]) => {
        setResumen(r);
        setAlertas(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !resumen) return <p className="text-sm text-slate-400">Cargando...</p>;

  const stats = [
    { label: 'Saldo total en bancos', value: formatCLP(resumen.saldoTotalBancos), icon: Wallet, tone: 'text-slate-800' },
    { label: 'Cuentas por cobrar', value: formatCLP(resumen.cuentasPorCobrar), sub: `${resumen.facturasVentaPendientes} factura(s) pendiente(s)`, icon: TrendingUp, tone: 'text-emerald-700' },
    { label: 'Cuentas por pagar', value: formatCLP(resumen.cuentasPorPagar), sub: `${resumen.facturasCompraPendientes} factura(s) pendiente(s)`, icon: TrendingDown, tone: 'text-red-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Icon className="w-4 h-4" />
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-semibold ${s.tone}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-slate-500 mt-1">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Ingresos del mes</p>
          <p className="text-xl font-semibold text-emerald-700">{formatCLP(resumen.ingresosMes)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Egresos del mes</p>
          <p className="text-xl font-semibold text-red-700">{formatCLP(resumen.egresosMes)}</p>
        </div>
      </div>

      {(alertas.ventasVencidas.length > 0 || alertas.comprasVencidas.length > 0) && (
        <div className="space-y-2">
          {alertas.ventasVencidas.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Facturas de venta por cobrar pronto
              </p>
              <ul className="space-y-1">
                {alertas.ventasVencidas.map((v) => (
                  <li key={v.id} className="text-xs text-amber-700">
                    {v.folio} — {v.cliente} — {formatCLP(v.monto)} —{' '}
                    {v.diasRestantes < 0 ? `vencida hace ${Math.abs(v.diasRestantes)} día(s)` : v.diasRestantes === 0 ? 'vence hoy' : `vence en ${v.diasRestantes} día(s)`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alertas.comprasVencidas.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Facturas de compra por pagar pronto
              </p>
              <ul className="space-y-1">
                {alertas.comprasVencidas.map((c) => (
                  <li key={c.id} className="text-xs text-red-700">
                    {c.folio} — {c.proveedor} — {formatCLP(c.monto)} —{' '}
                    {c.diasRestantes < 0 ? `vencida hace ${Math.abs(c.diasRestantes)} día(s)` : c.diasRestantes === 0 ? 'vence hoy' : `vence en ${c.diasRestantes} día(s)`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
