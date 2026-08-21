import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Building2, User } from 'lucide-react';
import { getClientes } from '../../../lib/clientesStore';
import CreateClienteModal from './CreateClienteModal';
import ClienteDrawer from './ClienteDrawer';

export default function ClientesModule() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setClientes(await getClientes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const q = query.toLowerCase();
      return !q || c.nombre.toLowerCase().includes(q) || (c.rut ?? '').toLowerCase().includes(q);
    });
  }, [clientes, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Base de clientes de la empresa, con su historial de tickets y facturas de venta.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o RUT..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">RUT</th>
              <th className="text-left font-medium px-4 py-2.5">Contacto</th>
              <th className="text-left font-medium px-4 py-2.5">Tickets</th>
              <th className="text-left font-medium px-4 py-2.5">Facturas</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setSelectedId(c.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-2">
                  {c.tipo === 'Empresa' ? <Building2 className="w-3.5 h-3.5 text-slate-400" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                  {c.nombre}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.rut ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.contactoNombre ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{c._count.tickets}</td>
                <td className="px-4 py-2.5 text-slate-600">{c._count.facturasVenta}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin clientes que coincidan con la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateClienteModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selectedId && (
        <ClienteDrawer clienteId={selectedId} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}
