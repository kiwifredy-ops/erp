import { useEffect, useState } from 'react';
import { X, Plus, Paperclip, History, AlertTriangle } from 'lucide-react';
import {
  getAccidentes,
  crearAccidente,
  cambiarEstadoAccidente,
  getInformeAccidente,
  getNextEstadosAccidente,
  fileToBase64,
  TIPOS_ACCIDENTE,
  GRAVEDADES,
} from '../../../lib/prevencionStore';
import { getEmpleados } from '../../../lib/rrhhStore';
import { puedeCrear, puedeEditar } from '../../../lib/authStore';

const MAX_BYTES = 8 * 1024 * 1024;

const ESTADO_STYLES = {
  'En investigación': 'bg-amber-50 text-amber-700',
  Cerrado: 'bg-emerald-50 text-emerald-700',
};

const GRAVEDAD_STYLES = {
  Leve: 'bg-slate-100 text-slate-600',
  Grave: 'bg-amber-50 text-amber-700',
  Fatal: 'bg-red-50 text-red-700',
};

const emptyForm = () => ({
  empleado: '',
  fecha: new Date().toISOString().slice(0, 10),
  tipo: TIPOS_ACCIDENTE[0],
  gravedad: GRAVEDADES[0],
  lugar: '',
  descripcion: '',
  informeNombre: '',
  informeMimeType: '',
  informeContenido: null,
});

function CreateAccidenteModal({ empleados, onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleInforme(file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El archivo supera los 8MB permitidos.');
      return;
    }
    const contenido = await fileToBase64(file);
    setForm((f) => ({ ...f, informeContenido: contenido, informeNombre: file.name, informeMimeType: file.type || 'application/octet-stream' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.descripcion) {
      setError('Describe brevemente lo ocurrido.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await crearAccidente({ ...form, empleado: form.empleado || null });
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el accidente/incidente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Registrar accidente/incidente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Trabajador involucrado (opcional)</span>
            <select value={form.empleado} onChange={(e) => setForm((f) => ({ ...f, empleado: e.target.value }))} className="input">
              <option value="">Sin especificar</option>
              {empleados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Fecha</span>
              <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Gravedad</span>
              <select value={form.gravedad} onChange={(e) => setForm((f) => ({ ...f, gravedad: e.target.value }))} className="input">
                {GRAVEDADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Tipo</span>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="input">
              {TIPOS_ACCIDENTE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <input placeholder="Lugar (opcional)" value={form.lugar} onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value }))} className="input" />
          <textarea required rows={3} placeholder="Descripción de lo ocurrido" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className="input resize-none" />
          <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-md py-2 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-700 cursor-pointer">
            <Paperclip className="w-3.5 h-3.5" />
            {form.informeNombre || 'Adjuntar informe (opcional, máx. 8MB)'}
            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleInforme(e.target.files?.[0])} className="hidden" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccidenteDrawer({ accidente, onClose, onChanged }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(false);

  const nextEstados = getNextEstadosAccidente(accidente.estado);

  async function handleVerInforme() {
    setViewing(true);
    try {
      const { contenido, mimeType, nombreArchivo } = await getInformeAccidente(accidente.id);
      const win = window.open();
      if (win) {
        if (mimeType?.startsWith('image/')) {
          win.document.write(`<title>${nombreArchivo}</title><img src="${contenido}" style="max-width:100%" />`);
        } else {
          win.location.href = contenido;
        }
      }
    } finally {
      setViewing(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nuevoEstado) return;
    setError('');
    setSaving(true);
    try {
      await cambiarEstadoAccidente(accidente.id, nuevoEstado, motivo);
      setNuevoEstado('');
      setMotivo('');
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{accidente.folio}</h2>
            <p className="text-xs text-slate-500">{accidente.empleado ?? 'Sin trabajador asociado'} · {new Date(accidente.fecha).toISOString().slice(0, 10)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[accidente.estado] ?? ''}`}>{accidente.estado}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRAVEDAD_STYLES[accidente.gravedad] ?? ''}`}>{accidente.gravedad}</span>
            <span className="text-xs text-slate-500">{accidente.tipo}</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            {accidente.lugar && <p className="text-slate-600"><span className="font-medium text-slate-700">Lugar:</span> {accidente.lugar}</p>}
            <p className="text-slate-600">{accidente.descripcion}</p>
          </div>

          {accidente.informeNombre && (
            <button onClick={handleVerInforme} disabled={viewing} className="flex items-center gap-1 text-xs text-sky-700 hover:underline">
              <Paperclip className="w-3 h-3" /> Ver informe adjunto
            </button>
          )}

          {puedeEditar('prevencion') && nextEstados.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Actualizar estado</p>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className="input">
                <option value="">Seleccionar nuevo estado...</option>
                {nextEstados.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Observación (opcional)" className="input" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={!nuevoEstado || saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </form>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...accidente.bitacora].reverse().map((b) => (
                <li key={b.id} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{b.evento}</p>
                  <p className="text-xs text-slate-500">{new Date(b.fecha).toISOString().slice(0, 10)}</p>
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

export default function AccidentesTab({ onChanged }) {
  const [accidentes, setAccidentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setAccidentes(await getAccidentes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => setEmpleados(emps.filter((e) => e.estado === 'Activo')));
  }, []);

  const selected = accidentes.find((a) => a.id === selectedId) ?? null;
  const abiertos = accidentes.filter((a) => a.estado === 'En investigación').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 rounded-md px-3 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> {abiertos} en investigación
        </div>
        <div className="flex-1" />
        {puedeCrear('prevencion') && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
            <Plus className="w-4 h-4" /> Registrar
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Trabajador</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Tipo</th>
              <th className="text-left font-medium px-4 py-2.5">Gravedad</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accidentes.map((a) => (
              <tr key={a.id} onClick={() => setSelectedId(a.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{a.folio}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.empleado ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(a.fecha).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.tipo}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${GRAVEDAD_STYLES[a.gravedad] ?? ''}`}>{a.gravedad}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[a.estado] ?? ''}`}>{a.estado}</span>
                </td>
              </tr>
            ))}
            {!loading && accidentes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin accidentes ni incidentes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateAccidenteModal
          empleados={empleados}
          onClose={() => setShowCreate(false)}
          onCreated={() => { refresh(); setShowCreate(false); onChanged(); }}
        />
      )}

      {selected && (
        <AccidenteDrawer accidente={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}
