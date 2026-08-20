import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getMarcaciones, registrarMarcacion } from '../../../lib/asistenciaStore';
import { getEmpleados } from '../../../lib/rrhhStore';

const ESTADO_STYLES = {
  Normal: 'bg-emerald-50 text-emerald-700',
  Atraso: 'bg-amber-50 text-amber-700',
  Ausencia: 'bg-red-50 text-red-700',
};

export default function MarcacionesTab() {
  const [version, setVersion] = useState(0);
  const [empleado, setEmpleado] = useState('');
  const [fecha, setFecha] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const marcaciones = useMemo(() => getMarcaciones(), [version]);
  const empleados = useMemo(() => [...new Set(marcaciones.map((m) => m.empleado))].sort(), [marcaciones]);
  const fechas = useMemo(() => [...new Set(marcaciones.map((m) => m.fecha))].sort().reverse(), [marcaciones]);

  const filtered = marcaciones.filter((m) => {
    const matchesEmpleado = !empleado || m.empleado === empleado;
    const matchesFecha = !fecha || m.fecha === fecha;
    return matchesEmpleado && matchesFecha;
  });

  function refresh() {
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={empleado} onChange={(e) => setEmpleado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los empleados</option>
          {empleados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={fecha} onChange={(e) => setFecha(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todas las fechas</option>
          {fechas.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Registrar marcación
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Empleado</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Entrada</th>
              <th className="text-left font-medium px-4 py-2.5">Salida</th>
              <th className="text-left font-medium px-4 py-2.5">Horas</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{m.empleado}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.fecha}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.horaEntrada ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.horaSalida ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{m.horasTrabajadas || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[m.estado] ?? ''}`}>{m.estado}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin marcaciones que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <RegistrarMarcacionModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}
    </div>
  );
}

function RegistrarMarcacionModal({ onClose, onCreated }) {
  const empleadosActivos = useMemo(() => getEmpleados().filter((e) => e.estado === 'Activo'), []);
  const [empleado, setEmpleado] = useState(empleadosActivos[0]?.nombre ?? '');
  const [hora, setHora] = useState(new Date().toTimeString().slice(0, 5));

  function handleSubmit(e) {
    e.preventDefault();
    if (!empleado || !hora) return;
    registrarMarcacion(empleado, new Date().toISOString().slice(0, 10), hora);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Registrar marcación de entrada</h2>
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
          <p className="text-xs text-slate-400">Jornada de referencia: 08:30. Marcaciones posteriores se registran como atraso.</p>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
