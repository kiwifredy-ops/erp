import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getRendiciones, getTotal, ESTADOS_RENDICION } from '../../../lib/gastosStore';
import { getEmpleados } from '../../../lib/rrhhStore';
import RendicionModal from './RendicionModal';
import RendicionDrawer from './RendicionDrawer';

const ESTADO_STYLES = {
  Enviada: 'bg-slate-100 text-slate-600',
  'En revisión': 'bg-amber-50 text-amber-700',
  Aprobada: 'bg-sky-50 text-sky-700',
  Rechazada: 'bg-red-50 text-red-700',
  Pagada: 'bg-emerald-50 text-emerald-700',
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function GastosModule() {
  const [rendiciones, setRendiciones] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tecnico, setTecnico] = useState('');
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setRendiciones(await getRendiciones());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => setEmpleados(emps.filter((e) => e.estado === 'Activo')));
  }, []);

  const tecnicos = [...new Set(rendiciones.map((r) => r.tecnico))];
  const filtered = rendiciones.filter((r) => {
    const matchesTecnico = !tecnico || r.tecnico === tecnico;
    const matchesEstado = !estado || r.estado === estado;
    return matchesTecnico && matchesEstado;
  });
  const selected = rendiciones.find((r) => r.id === selectedId) ?? null;

  const pendientes = rendiciones.filter((r) => ['Enviada', 'En revisión'].includes(r.estado)).length;
  const totalMes = rendiciones.reduce((sum, r) => sum + getTotal(r), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Rendición de Gastos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gastos de personal técnico en terreno: combustible, peajes, alojamiento y viáticos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-slate-900">{rendiciones.length}</p>
          <p className="text-xs text-slate-500 mt-1">Rendiciones totales</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-amber-600">{pendientes}</p>
          <p className="text-xs text-slate-500 mt-1">Pendientes de revisión</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-slate-900">{formatCLP(totalMes)}</p>
          <p className="text-xs text-slate-500 mt-1">Monto acumulado</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] flex items-center gap-1.5 text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-xs">Filtrar:</span>
        </div>
        <select value={tecnico} onChange={(e) => setTecnico(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los técnicos</option>
          {tecnicos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_RENDICION.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva rendición
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Técnico</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Ítems</th>
              <th className="text-left font-medium px-4 py-2.5">Total</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => setSelectedId(r.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.folio}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.tecnico}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(r.fecha).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{r.lineas.length}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatCLP(getTotal(r))}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[r.estado] ?? ''}`}>{r.estado}</span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin rendiciones que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <RendicionModal empleados={empleados} onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <RendicionDrawer rendicion={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

export { formatCLP, ESTADO_STYLES };
