import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getTickets, ESTADOS_TICKET } from '../../../lib/ticketsStore';
import { getEmpleados } from '../../../lib/rrhhStore';
import CreateTicketModal from './CreateTicketModal';
import TicketDrawer from './TicketDrawer';

const ESTADO_STYLES = {
  Abierto: 'bg-slate-100 text-slate-600',
  Asignado: 'bg-sky-50 text-sky-700',
  'En curso': 'bg-amber-50 text-amber-700',
  Completado: 'bg-emerald-50 text-emerald-700',
  Cerrado: 'bg-slate-100 text-slate-500',
  Cancelado: 'bg-red-50 text-red-700',
};

const PRIORIDAD_STYLES = {
  Baja: 'text-slate-500',
  Media: 'text-sky-600',
  Alta: 'text-amber-600',
  Urgente: 'text-red-600 font-semibold',
};

export default function TicketsModule() {
  const [tickets, setTickets] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setTickets(await getTickets());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => setTecnicos(emps.filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica')));
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesQuery = !query || t.cliente.toLowerCase().includes(query.toLowerCase()) || t.folio.toLowerCase().includes(query.toLowerCase());
      const matchesEstado = !estado || t.estado === estado;
      return matchesQuery && matchesEstado;
    });
  }, [tickets, query, estado]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  const stats = [
    { label: 'Abiertos', value: tickets.filter((t) => t.estado === 'Abierto').length },
    { label: 'Asignados', value: tickets.filter((t) => t.estado === 'Asignado').length },
    { label: 'En curso', value: tickets.filter((t) => t.estado === 'En curso').length },
    { label: 'Completados', value: tickets.filter((t) => t.estado === 'Completado').length },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Tickets de Servicio Técnico</h1>
        <p className="text-sm text-slate-500 mt-0.5">Mesa de ayuda asigna a técnicos en terreno: inicio/fin con GPS, fotos y video, firma y encuesta del cliente.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por folio o cliente..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_TICKET.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo ticket
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">Técnico</th>
              <th className="text-left font-medium px-4 py-2.5">Prioridad</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} onClick={() => setSelectedId(t.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{t.folio}</td>
                <td className="px-4 py-2.5">
                  <p className="text-slate-800">{t.cliente}</p>
                  <p className="text-xs text-slate-500">{t.direccion}</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{t.tecnico ?? '—'}</td>
                <td className={`px-4 py-2.5 ${PRIORIDAD_STYLES[t.prioridad] ?? ''}`}>{t.prioridad}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[t.estado] ?? ''}`}>{t.estado}</span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Sin tickets que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <TicketDrawer ticket={selected} tecnicos={tecnicos} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

export { ESTADO_STYLES, PRIORIDAD_STYLES };
