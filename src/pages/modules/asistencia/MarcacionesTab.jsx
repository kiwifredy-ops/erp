import { useEffect, useState } from 'react';
import { Plus, X, MapPin, LogOut } from 'lucide-react';
import { getMarcaciones, marcarEntrada, marcarSalida, obtenerUbicacion, mapsUrl } from '../../../lib/asistenciaStore';
import { getEmpleados } from '../../../lib/rrhhStore';

const ESTADO_STYLES = {
  Normal: 'bg-emerald-50 text-emerald-700',
  Atraso: 'bg-amber-50 text-amber-700',
  Ausencia: 'bg-red-50 text-red-700',
};

export default function MarcacionesTab() {
  const [marcaciones, setMarcaciones] = useState([]);
  const [empleadosActivos, setEmpleadosActivos] = useState([]);
  const [empleado, setEmpleado] = useState('');
  const [fecha, setFecha] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [marcandoSalidaId, setMarcandoSalidaId] = useState(null);

  async function refresh() {
    setMarcaciones(await getMarcaciones());
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => setEmpleadosActivos(emps.filter((e) => e.estado === 'Activo')));
  }, []);

  const empleadosList = [...new Set(marcaciones.map((m) => m.empleado))].sort();
  const fechas = [...new Set(marcaciones.map((m) => new Date(m.fecha).toISOString().slice(0, 10)))].sort().reverse();

  const filtered = marcaciones.filter((m) => {
    const fechaStr = new Date(m.fecha).toISOString().slice(0, 10);
    const matchesEmpleado = !empleado || m.empleado === empleado;
    const matchesFecha = !fecha || fechaStr === fecha;
    return matchesEmpleado && matchesFecha;
  });

  async function handleMarcarSalida(id) {
    setMarcandoSalidaId(id);
    try {
      const hora = new Date().toTimeString().slice(0, 5);
      const coords = await obtenerUbicacion();
      await marcarSalida(id, hora, coords);
      refresh();
    } finally {
      setMarcandoSalidaId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={empleado} onChange={(e) => setEmpleado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los empleados</option>
          {empleadosList.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={fecha} onChange={(e) => setFecha(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todas las fechas</option>
          {fechas.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Marcar entrada
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Empleado</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Entrada</th>
              <th className="text-left font-medium px-4 py-2.5">Salida</th>
              <th className="text-left font-medium px-4 py-2.5">Horas</th>
              <th className="text-left font-medium px-4 py-2.5">Extra</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
              <th className="text-left font-medium px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{m.empleado}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(m.fecha).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {m.horaEntrada ?? '—'}
                  {m.latEntrada != null && (
                    <a href={mapsUrl(m.latEntrada, m.lngEntrada)} target="_blank" rel="noreferrer" className="inline-flex ml-1 text-sky-500 hover:text-sky-700" title="Ver ubicación">
                      <MapPin className="w-3 h-3 inline" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {m.horaSalida ?? '—'}
                  {m.latSalida != null && (
                    <a href={mapsUrl(m.latSalida, m.lngSalida)} target="_blank" rel="noreferrer" className="inline-flex ml-1 text-sky-500 hover:text-sky-700" title="Ver ubicación">
                      <MapPin className="w-3 h-3 inline" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{m.horasTrabajadas || '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.horasExtra > 0 ? <span className="text-amber-600 font-medium">{m.horasExtra} h</span> : '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[m.estado] ?? ''}`}>{m.estado}</span>
                </td>
                <td className="px-4 py-2.5">
                  {m.horaEntrada && !m.horaSalida && (
                    <button
                      onClick={() => handleMarcarSalida(m.id)}
                      disabled={marcandoSalidaId === m.id}
                      className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline disabled:text-slate-400"
                    >
                      <LogOut className="w-3 h-3" /> {marcandoSalidaId === m.id ? 'Marcando...' : 'Marcar salida'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">Sin marcaciones que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <MarcarEntradaModal empleadosActivos={empleadosActivos} onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}
    </div>
  );
}

function MarcarEntradaModal({ empleadosActivos, onClose, onCreated }) {
  const [empleado, setEmpleado] = useState(empleadosActivos[0]?.nombre ?? '');
  const [hora, setHora] = useState(new Date().toTimeString().slice(0, 5));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!empleado || !hora) return;
    setError('');
    setSaving(true);
    try {
      const coords = await obtenerUbicacion();
      await marcarEntrada(empleado, new Date().toISOString().slice(0, 10), hora, coords);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la marcación.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Marcar entrada</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Empleado</span>
            <select value={empleado} onChange={(e) => setEmpleado(e.target.value)} className="input">
              {empleadosActivos.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Hora de entrada</span>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input" />
          </label>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="w-3 h-3" /> Se solicitará la ubicación actual (si el navegador lo permite).
          </p>
          <p className="text-xs text-slate-400">Jornada de referencia: 08:30. Marcaciones posteriores se registran como atraso.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
