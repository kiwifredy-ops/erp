import { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { getSolicitudes, actualizarEstadoSolicitud } from '../../lib/solicitudesStore';

const ESTADOS = ['Nueva', 'Contactada', 'Descartada'];

const ESTADO_STYLES = {
  Nueva: 'bg-sky-50 text-sky-700',
  Contactada: 'bg-emerald-50 text-emerald-700',
  Descartada: 'bg-slate-100 text-slate-500',
};

export default function SolicitudesDashboard() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState('');
  const [saving, setSaving] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      setSolicitudes(await getSolicitudes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleEstado(id, nuevoEstado) {
    setSaving(id);
    try {
      const actualizada = await actualizarEstadoSolicitud(id, nuevoEstado);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? actualizada : s)));
    } finally {
      setSaving('');
    }
  }

  const filtered = solicitudes.filter((s) => !estado || s.estado === estado);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Solicitudes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Contactos recibidos desde el formulario público de la landing.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-sky-600">{solicitudes.filter((s) => s.estado === 'Nueva').length}</p>
          <p className="text-xs text-slate-500 mt-1">Nuevas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-emerald-600">{solicitudes.filter((s) => s.estado === 'Contactada').length}</p>
          <p className="text-xs text-slate-500 mt-1">Contactadas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-slate-500">{solicitudes.filter((s) => s.estado === 'Descartada').length}</p>
          <p className="text-xs text-slate-500 mt-1">Descartadas</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500">
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Nombre</th>
              <th className="text-left font-medium px-4 py-2.5">Empresa</th>
              <th className="text-left font-medium px-4 py-2.5">Contacto</th>
              <th className="text-left font-medium px-4 py-2.5">Mensaje</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{s.nombre}</td>
                <td className="px-4 py-2.5 text-slate-600">{s.empresa}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.email}</div>
                  <div className="flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {s.telefono}</div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate" title={s.mensaje ?? ''}>{s.mensaje || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(s.createdAt).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={s.estado}
                    disabled={saving === s.id}
                    onChange={(e) => handleEstado(s.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-slate-400 ${ESTADO_STYLES[s.estado] ?? ''}`}
                  >
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin solicitudes que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
