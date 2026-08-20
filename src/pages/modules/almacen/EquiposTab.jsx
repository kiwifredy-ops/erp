import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { getEmpleados } from '../../../lib/rrhhStore';
import { getEquipos, asignarEquipo, devolverEquipo } from '../../../lib/almacenStore';

const ESTADO_STYLES = {
  Asignado: 'bg-sky-50 text-sky-700',
  'En bodega': 'bg-emerald-50 text-emerald-700',
  'En mantención': 'bg-amber-50 text-amber-700',
};

export default function EquiposTab() {
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [asignando, setAsignando] = useState(null);
  const [tecnicoElegido, setTecnicoElegido] = useState('');

  async function refresh() {
    setEquipos(await getEquipos());
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((empleados) =>
      setTecnicos(empleados.filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica'))
    );
  }, []);

  async function handleAsignar(id) {
    if (!tecnicoElegido) return;
    await asignarEquipo(id, tecnicoElegido);
    setAsignando(null);
    setTecnicoElegido('');
    refresh();
  }

  async function handleDevolver(id) {
    await devolverEquipo(id);
    refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Equipo</th>
            <th className="text-left font-medium px-4 py-2.5">Tipo</th>
            <th className="text-left font-medium px-4 py-2.5">Técnico</th>
            <th className="text-left font-medium px-4 py-2.5">Estado</th>
            <th className="text-left font-medium px-4 py-2.5">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {equipos.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-slate-400" /> {e.equipo}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{e.tipo}</td>
              <td className="px-4 py-2.5 text-slate-600">{e.tecnico ?? '—'}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[e.estado] ?? ''}`}>{e.estado}</span>
              </td>
              <td className="px-4 py-2.5">
                {e.estado === 'Asignado' ? (
                  <button onClick={() => handleDevolver(e.id)} className="text-xs font-medium text-sky-700 hover:underline">
                    Registrar devolución
                  </button>
                ) : e.estado === 'En bodega' ? (
                  asignando === e.id ? (
                    <div className="flex items-center gap-1.5">
                      <select value={tecnicoElegido} onChange={(ev) => setTecnicoElegido(ev.target.value)} className="text-xs border border-slate-300 rounded px-1.5 py-1">
                        <option value="">Técnico...</option>
                        {tecnicos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                      </select>
                      <button onClick={() => handleAsignar(e.id)} className="text-xs font-medium text-sky-700 hover:underline">Asignar</button>
                    </div>
                  ) : (
                    <button onClick={() => setAsignando(e.id)} className="text-xs font-medium text-sky-700 hover:underline">Asignar a técnico</button>
                  )
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
