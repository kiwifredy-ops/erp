import { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { getMisRendiciones, getTotal } from '../../../lib/gastosStore';
import { getSession } from '../../../lib/authStore';
import { formatCLP, ESTADO_STYLES } from './GastosModule';
import RendicionModal from './RendicionModal';
import RendicionDrawer from './RendicionDrawer';

export default function MisRendicionesTab() {
  const user = getSession();
  const [rendiciones, setRendiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setRendiciones(await getMisRendiciones());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = rendiciones.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <button
        onClick={() => setShowCreate(true)}
        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-xl py-3"
      >
        <Plus className="w-4 h-4" /> Nueva rendición
      </button>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Mis rendiciones</p>
        <ul className="space-y-1.5">
          {rendiciones.map((r) => (
            <li
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {r.folio}
                </p>
                <p className="text-xs text-slate-500">{new Date(r.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} · {r.lineas.length} ítem{r.lineas.length === 1 ? '' : 's'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-slate-800">{formatCLP(getTotal(r))}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[r.estado] ?? ''}`}>{r.estado}</span>
              </div>
            </li>
          ))}
          {!loading && rendiciones.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Todavía no envías ninguna rendición.</p>
          )}
        </ul>
      </div>

      {showCreate && (
        <RendicionModal
          fixedTecnico={user?.nombre}
          onClose={() => setShowCreate(false)}
          onCreated={() => { refresh(); setShowCreate(false); }}
        />
      )}

      {selected && (
        <RendicionDrawer rendicion={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}
