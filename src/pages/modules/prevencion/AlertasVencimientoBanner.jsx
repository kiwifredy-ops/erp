import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { getAlertasVencimiento } from '../../../lib/prevencionStore';

function describeVencimiento(dias) {
  if (dias < 0) return `venció hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return 'vence hoy';
  return `vence en ${dias} día(s)`;
}

export default function AlertasVencimientoBanner({ refreshKey }) {
  const [alertas, setAlertas] = useState({ empresaPorVencer: [], personalPorVencer: [] });

  useEffect(() => {
    getAlertasVencimiento().then(setAlertas).catch(() => {});
  }, [refreshKey]);

  const { empresaPorVencer, personalPorVencer } = alertas;
  if (empresaPorVencer.length === 0 && personalPorVencer.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
        <CalendarClock className="w-3.5 h-3.5" /> Documentos por vencer
      </p>
      <ul className="space-y-1">
        {empresaPorVencer.map((d) => (
          <li key={`e-${d.id}`} className="text-xs text-amber-700">
            {d.tipo} — {d.nombre}: {describeVencimiento(d.diasRestantes)}
          </li>
        ))}
        {personalPorVencer.map((d) => (
          <li key={`p-${d.id}`} className="text-xs text-amber-700">
            {d.tipo} — {d.empleado}: {describeVencimiento(d.diasRestantes)}
          </li>
        ))}
      </ul>
    </div>
  );
}
