import { useMemo, useState } from 'react';
import { X, Mail, Phone, History } from 'lucide-react';
import {
  getEmpleado,
  getNextEstados,
  cambiarEstadoEmpleado,
  editarEmpleado,
  DEPARTAMENTOS,
  TIPOS_CONTRATO,
} from '../../../lib/rrhhStore';

export default function EmpleadoDrawer({ empleadoId, onClose, onChanged }) {
  const [version, setVersion] = useState(0);
  const empleado = useMemo(() => getEmpleado(empleadoId), [empleadoId, version]);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [editing, setEditing] = useState(false);

  if (!empleado) return null;

  const nextEstados = getNextEstados(empleado.estado);

  function refresh() {
    setVersion((v) => v + 1);
    onChanged();
  }

  function handleCambioEstado(e) {
    e.preventDefault();
    if (!nuevoEstado) return;
    cambiarEstadoEmpleado(empleado.id, nuevoEstado, motivo);
    setNuevoEstado('');
    setMotivo('');
    refresh();
  }

  function handleEdit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    editarEmpleado(empleado.id, {
      cargo: form.get('cargo'),
      departamento: form.get('departamento'),
      tipoContrato: form.get('tipoContrato'),
    });
    setEditing(false);
    refresh();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{empleado.nombre}</h2>
            <p className="text-xs text-slate-500">{empleado.id} · {empleado.documento}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {empleado.email && (
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{empleado.email}</span>
            )}
            {empleado.telefono && (
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{empleado.telefono}</span>
            )}
          </div>

          {!editing ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <Row label="Cargo" value={empleado.cargo} />
              <Row label="Departamento" value={empleado.departamento} />
              <Row label="Tipo de contrato" value={empleado.tipoContrato} />
              <Row label="Fecha de ingreso" value={empleado.fechaIngreso} />
              <Row label="Estado" value={empleado.estado} />
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-medium text-sky-700 hover:underline pt-1"
              >
                Editar cargo / departamento / contrato
              </button>
            </div>
          ) : (
            <form onSubmit={handleEdit} className="bg-slate-50 rounded-lg p-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Cargo</span>
                <input name="cargo" defaultValue={empleado.cargo} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Departamento</span>
                <select name="departamento" defaultValue={empleado.departamento} className="input">
                  {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Tipo de contrato</span>
                <select name="tipoContrato" defaultValue={empleado.tipoContrato} className="input">
                  {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-200">
                  Cancelar
                </button>
                <button type="submit" className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">
                  Guardar cambios
                </button>
              </div>
            </form>
          )}

          {nextEstados.length > 0 && (
            <form onSubmit={handleCambioEstado} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cambiar estado</p>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar nuevo estado...</option>
                {nextEstados.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo / observación (opcional)"
                className="input"
              />
              <button
                type="submit"
                disabled={!nuevoEstado}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2"
              >
                Confirmar cambio
              </button>
            </form>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...empleado.bitacora].reverse().map((b, i) => (
                <li key={i} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{b.evento}</p>
                  <p className="text-xs text-slate-500">{b.fecha}</p>
                  {b.detalle && <p className="text-xs text-slate-500 mt-0.5">{b.detalle}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
