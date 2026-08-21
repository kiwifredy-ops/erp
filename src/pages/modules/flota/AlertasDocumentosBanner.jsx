import { useEffect, useState } from 'react';
import { FileWarning } from 'lucide-react';
import { getAlertasDocumentos } from '../../../lib/flotaStore';

export default function AlertasDocumentosBanner({ refreshKey, onSelect }) {
  const [documentosPorVencer, setDocumentosPorVencer] = useState([]);

  useEffect(() => {
    getAlertasDocumentos().then((r) => setDocumentosPorVencer(r.documentosPorVencer)).catch(() => {});
  }, [refreshKey]);

  if (documentosPorVencer.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1.5">
        <FileWarning className="w-3.5 h-3.5" /> Documentación de vehículos por vencer
      </p>
      <ul className="space-y-1">
        {documentosPorVencer.map((d, i) => (
          <li key={`${d.id}-${d.documento}-${i}`}>
            <button onClick={() => onSelect(d.id)} className="text-xs text-amber-700 hover:underline">
              {d.patente} — {d.documento}: {d.diasRestantes < 0 ? `venció hace ${Math.abs(d.diasRestantes)} día(s)` : d.diasRestantes === 0 ? 'vence hoy' : `vence en ${d.diasRestantes} día(s)`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
