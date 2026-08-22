import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getMisTickets } from '../../../lib/ticketsStore';
import { ESTADO_STYLES, PRIORIDAD_STYLES } from './TicketsModule';
import TicketDrawer from './TicketDrawer';

export default function MisTicketsTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setTickets(await getMisTickets());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const activos = tickets.filter((t) => !['Cerrado', 'Cancelado'].includes(t.estado));
  const finalizados = tickets.filter((t) => ['Cerrado', 'Cancelado'].includes(t.estado));

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Pendientes</p>
        <ul className="space-y-1.5">
          {activos.map((t) => (
            <TicketCard key={t.id} ticket={t} onSelect={() => setSelectedId(t.id)} />
          ))}
          {!loading && activos.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Sin tickets pendientes por el momento.</p>
          )}
        </ul>
      </div>

      {finalizados.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Finalizados</p>
          <ul className="space-y-1.5">
            {finalizados.map((t) => (
              <TicketCard key={t.id} ticket={t} onSelect={() => setSelectedId(t.id)} />
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <TicketDrawer ticket={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function TicketCard({ ticket, onSelect }) {
  return (
    <li onClick={onSelect} className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="font-medium text-slate-800">{ticket.folio} · {ticket.cliente}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[ticket.estado] ?? ''}`}>{ticket.estado}</span>
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
        <MapPin className="w-3 h-3 shrink-0" /> {ticket.direccion}
      </p>
      <p className={`text-xs mt-0.5 ${PRIORIDAD_STYLES[ticket.prioridad] ?? ''}`}>Prioridad: {ticket.prioridad}</p>
    </li>
  );
}
