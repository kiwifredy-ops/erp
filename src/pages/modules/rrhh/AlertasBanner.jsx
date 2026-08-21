import { useEffect, useState } from 'react';
import { FileWarning, IdCard } from 'lucide-react';
import { getAlertas } from '../../../lib/rrhhStore';

export default function AlertasBanner({ onSelect, refreshKey }) {
  const [alertas, setAlertas] = useState({ contratosPorVencer: [], cedulasPorVencer: [] });

  useEffect(() => {
    getAlertas().then(setAlertas).catch(() => {});
  }, [refreshKey]);

  const { contratosPorVencer, cedulasPorVencer } = alertas;
  if (contratosPorVencer.length === 0 && cedulasPorVencer.length === 0) return null;

  return (
    <div className="space-y-2">
      {contratosPorVencer.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
            <FileWarning className="w-3.5 h-3.5" /> Contratos por vencer
          </p>
          <ul className="space-y-1">
            {contratosPorVencer.map((c) => (
              <li key={c.id}>
                <button onClick={() => onSelect(c.id)} className="text-xs text-red-700 hover:underline">
                  {c.nombre} — {c.diasRestantes < 0 ? `venció hace ${Math.abs(c.diasRestantes)} día(s)` : c.diasRestantes === 0 ? 'vence hoy' : `vence en ${c.diasRestantes} día(s)`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cedulasPorVencer.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
            <IdCard className="w-3.5 h-3.5" /> Cédulas de identidad por vencer
          </p>
          <ul className="space-y-1">
            {cedulasPorVencer.map((c) => (
              <li key={c.id}>
                <button onClick={() => onSelect(c.id)} className="text-xs text-amber-700 hover:underline">
                  {c.nombre} — {c.diasRestantes < 0 ? `venció hace ${Math.abs(c.diasRestantes)} día(s)` : c.diasRestantes === 0 ? 'vence hoy' : `vence en ${c.diasRestantes} día(s)`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
