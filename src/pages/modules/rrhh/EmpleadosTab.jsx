import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getEmpleados, DEPARTAMENTOS, ESTADOS_EMPLEADO } from '../../../lib/rrhhStore';
import EmpleadoModal from './EmpleadoModal';
import EmpleadoDrawer from './EmpleadoDrawer';

const ESTADO_STYLES = {
  Activo: 'bg-emerald-50 text-emerald-700',
  Vacaciones: 'bg-sky-50 text-sky-700',
  'Licencia médica': 'bg-amber-50 text-amber-700',
  Baja: 'bg-slate-100 text-slate-500',
};

export default function EmpleadosTab() {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setEmpleados(await getEmpleados());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return empleados.filter((e) => {
      const matchesQuery =
        !query ||
        e.nombre.toLowerCase().includes(query.toLowerCase()) ||
        e.documento.toLowerCase().includes(query.toLowerCase()) ||
        e.cargo.toLowerCase().includes(query.toLowerCase());
      const matchesDepto = !departamento || e.departamento === departamento;
      const matchesEstado = !estado || e.estado === estado;
      return matchesQuery && matchesDepto && matchesEstado;
    });
  }, [empleados, query, departamento, estado]);

  const selected = empleados.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, documento o cargo..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          value={departamento}
          onChange={(e) => setDepartamento(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los departamentos</option>
          {DEPARTAMENTOS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EMPLEADO.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo empleado
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Empleado</th>
              <th className="text-left font-medium px-4 py-2.5">Cargo</th>
              <th className="text-left font-medium px-4 py-2.5">Departamento</th>
              <th className="text-left font-medium px-4 py-2.5">Contrato</th>
              <th className="text-left font-medium px-4 py-2.5">Ingreso</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <tr
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className="hover:bg-slate-50 cursor-pointer"
              >
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800">{e.nombre}</p>
                  <p className="text-xs text-slate-500">{e.documento}</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{e.cargo}</td>
                <td className="px-4 py-2.5 text-slate-600">{e.departamento}</td>
                <td className="px-4 py-2.5 text-slate-600">{e.tipoContrato}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(e.fechaIngreso).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[e.estado] ?? ''}`}>
                    {e.estado}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                  No hay empleados que coincidan con el filtro.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                  Cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <EmpleadoModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            refresh();
            setShowCreate(false);
          }}
        />
      )}

      {selected && (
        <EmpleadoDrawer
          empleado={selected}
          onClose={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
