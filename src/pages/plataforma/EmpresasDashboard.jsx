import { useEffect, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { getEmpresas, ESTADOS_EMPRESA } from '../../lib/empresasStore';
import CreateEmpresaModal from './CreateEmpresaModal';
import EmpresaDrawer from './EmpresaDrawer';

export const ESTADO_STYLES = {
  Activa: 'bg-emerald-50 text-emerald-700',
  Suspendida: 'bg-amber-50 text-amber-700',
  Bloqueada: 'bg-red-50 text-red-700',
  Eliminada: 'bg-slate-100 text-slate-500',
};

export default function EmpresasDashboard() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setEmpresas(await getEmpresas());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = empresas.filter((e) => !estado || e.estado === estado);
  const selected = empresas.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Empresas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Todas las empresas dadas de alta en la plataforma.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-slate-900">{empresas.length}</p>
          <p className="text-xs text-slate-500 mt-1">Empresas totales</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-emerald-600">{empresas.filter((e) => e.estado === 'Activa').length}</p>
          <p className="text-xs text-slate-500 mt-1">Activas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-amber-600">{empresas.filter((e) => e.estado === 'Suspendida').length}</p>
          <p className="text-xs text-slate-500 mt-1">Suspendidas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-red-600">{empresas.filter((e) => e.estado === 'Bloqueada').length}</p>
          <p className="text-xs text-slate-500 mt-1">Bloqueadas</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500">
          <option value="">Todos los estados</option>
          {ESTADOS_EMPRESA.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva empresa
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Empresa</th>
              <th className="text-left font-medium px-4 py-2.5">Identificador</th>
              <th className="text-left font-medium px-4 py-2.5">Usuarios</th>
              <th className="text-left font-medium px-4 py-2.5">Alta</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <tr key={e.id} onClick={() => setSelectedId(e.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {e.nombre}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{e.slug}</td>
                <td className="px-4 py-2.5 text-slate-600">{e._count?.usuarios ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(e.fechaAlta).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[e.estado] ?? ''}`}>{e.estado}</span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Sin empresas que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateEmpresaModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <EmpresaDrawer empresa={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}
