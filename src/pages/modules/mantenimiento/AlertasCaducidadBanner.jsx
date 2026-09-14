import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { getAlertasContratos } from '../../../lib/mantenimientoStore';

export default function AlertasCaducidadBanner({ refreshKey, onSelect }) {
  const [contratosPorVencer, setContratosPorVencer] = useState([]);

  useEffect(() => {
    getAlertasContratos().then((r) => setContratosPorVencer(r.contratosPorVencer)).catch(() => {});
  }, [refreshKey]);

  if (contratosPorVencer.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
        <CalendarClock className="w-3.5 h-3.5" /> Contratos de mantención por vencer
      </p>
      <ul className="space-y-1">
        {contratosPorVencer.map((c) => (
          <li key={c.id}>
            <button onClick={() => onSelect(c.id)} className="text-xs text-amber-700 hover:underline">
              {c.folio} — {c.cliente}: {c.diasRestantes < 0 ? `venció hace ${Math.abs(c.diasRestantes)} día(s)` : c.diasRestantes === 0 ? 'vence hoy' : `vence en ${c.diasRestantes} día(s)`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
