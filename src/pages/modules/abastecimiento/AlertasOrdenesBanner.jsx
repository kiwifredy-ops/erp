import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { getAlertasOrdenes } from '../../../lib/abastecimientoStore';

export default function AlertasOrdenesBanner({ refreshKey, onSelect }) {
  const [atrasadas, setAtrasadas] = useState([]);

  useEffect(() => {
    getAlertasOrdenes().then((r) => setAtrasadas(r.atrasadas)).catch(() => {});
  }, [refreshKey]);

  if (atrasadas.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
        <Truck className="w-3.5 h-3.5" /> Órdenes con entrega atrasada
      </p>
      <ul className="space-y-1">
        {atrasadas.map((o) => (
          <li key={o.id}>
            <button onClick={() => onSelect(o.id)} className="text-xs text-red-700 hover:underline">
              {o.folio} — {o.proveedor}: atrasada {Math.abs(o.diasRestantes)} día(s)
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
