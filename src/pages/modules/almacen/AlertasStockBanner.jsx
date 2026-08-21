import { useEffect, useState } from 'react';
import { PackageX } from 'lucide-react';
import { getAlertasStock } from '../../../lib/almacenStore';

export default function AlertasStockBanner({ refreshKey, onSolicitar }) {
  const [bajoMinimo, setBajoMinimo] = useState([]);

  useEffect(() => {
    getAlertasStock().then((r) => setBajoMinimo(r.bajoMinimo)).catch(() => {});
  }, [refreshKey]);

  if (bajoMinimo.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1.5">
        <PackageX className="w-3.5 h-3.5" /> Materiales bajo stock mínimo
      </p>
      <ul className="space-y-1">
        {bajoMinimo.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-2">
            <span className="text-xs text-red-700">{it.nombre} — {it.stock} / {it.stockMinimo} {it.unidad}</span>
            <button onClick={() => onSolicitar({ id: it.id, nombre: it.nombre, stock: it.stock, stockMinimo: it.stockMinimo })} className="text-xs font-medium text-red-700 hover:underline shrink-0">
              Solicitar reposición
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
