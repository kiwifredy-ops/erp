import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getMisVisitas } from '../../../lib/mantenimientoStore';
import { ESTADO_VISITA_STYLES, esAtrasada } from './AgendaTab';
import VisitaDrawer from './VisitaDrawer';

export default function MisVisitasTab() {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setVisitas(await getMisVisitas());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = visitas.find((v) => v.id === selectedId) ?? null;
  const pendientes = visitas.filter((v) => !['Realizada', 'Cancelada'].includes(v.estado));
  const finalizadas = visitas.filter((v) => ['Realizada', 'Cancelada'].includes(v.estado));

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Pendientes</p>
        <ul className="space-y-1.5">
          {pendientes.map((v) => (
            <VisitaCard key={v.id} visita={v} onSelect={() => setSelectedId(v.id)} />
          ))}
          {!loading && pendientes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Sin visitas de mantención pendientes.</p>
          )}
        </ul>
      </div>

      {finalizadas.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Finalizadas</p>
          <ul className="space-y-1.5">
            {finalizadas.map((v) => (
              <VisitaCard key={v.id} visita={v} onSelect={() => setSelectedId(v.id)} />
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <VisitaDrawer visita={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function VisitaCard({ visita, onSelect }) {
  return (
    <li onClick={onSelect} className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-800">{visita.folio} · {visita.cliente}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_VISITA_STYLES[visita.estado] ?? ''}`}>{esAtrasada(visita) ? 'Atrasada' : visita.estado}</span>
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3 shrink-0" /> {visita.direccion}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{visita.tipoMantenimiento} · {new Date(visita.fechaProgramada).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</p>
    </li>
  );
}
