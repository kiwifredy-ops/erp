import { useEffect, useState } from 'react';
import { Wrench, Plus, X, History, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getEmpleados } from '../../../lib/rrhhStore';
import { getEquipos, crearEquipo, editarEquipo, asignarEquipo, devolverEquipo, estadoGarantia, TIPOS_EQUIPO } from '../../../lib/almacenStore';

const ESTADO_STYLES = {
  Asignado: 'bg-sky-50 text-sky-700',
  'En bodega': 'bg-emerald-50 text-emerald-700',
  'En mantención': 'bg-amber-50 text-amber-700',
};

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function EquiposTab() {
  const [equipos, setEquipos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setEquipos(await getEquipos());
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((empleados) =>
      setTecnicos(empleados.filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica'))
    );
  }, []);

  const selected = equipos.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo equipo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Equipo</th>
              <th className="text-left font-medium px-4 py-2.5">N° de serie</th>
              <th className="text-left font-medium px-4 py-2.5">Técnico / Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">Garantía</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipos.map((e) => {
              const garantia = estadoGarantia(e);
              return (
                <tr key={e.id} onClick={() => setSelectedId(e.id)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-800 flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-slate-400" /> {e.equipo}</p>
                    <p className="text-xs text-slate-500 pl-5.5">{e.tipo}</p>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{e.numeroSerie || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {e.tecnico ?? '—'}
                    {e.clienteInstalacion && <span className="block text-xs text-slate-400">{e.clienteInstalacion}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {garantia ? (
                      <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded w-fit ${garantia.estado === 'Vigente' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                        {garantia.estado === 'Vigente' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {garantia.estado}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[e.estado] ?? ''}`}>{e.estado}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateEquipoModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <EquipoDrawer equipo={selected} tecnicos={tecnicos} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateEquipoModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ equipo: '', tipo: TIPOS_EQUIPO[0], numeroSerie: '', fechaCompra: '', mesesGarantia: 12 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearEquipo(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el equipo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo equipo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nombre del equipo</span>
            <input required value={form.equipo} onChange={(e) => set('equipo', e.target.value)} className="input" placeholder="Ej. Cámara de pruebas #4" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Tipo</span>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
              {TIPOS_EQUIPO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">N° de serie</span>
            <input value={form.numeroSerie} onChange={(e) => set('numeroSerie', e.target.value)} className="input" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Fecha de compra</span>
              <input type="date" value={form.fechaCompra} onChange={(e) => set('fechaCompra', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Garantía (meses)</span>
              <input type="number" min="0" value={form.mesesGarantia} onChange={(e) => set('mesesGarantia', e.target.value)} className="input" />
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar equipo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EquipoDrawer({ equipo, tecnicos, onClose, onChanged }) {
  const [tecnicoElegido, setTecnicoElegido] = useState('');
  const [clienteInstalacion, setClienteInstalacion] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const garantia = estadoGarantia(equipo);

  async function handleAsignar(e) {
    e.preventDefault();
    if (!tecnicoElegido) return;
    setError('');
    setSaving(true);
    try {
      await asignarEquipo(equipo.id, tecnicoElegido, clienteInstalacion);
      setTecnicoElegido('');
      setClienteInstalacion('');
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo asignar el equipo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDevolver() {
    setSaving(true);
    try {
      await devolverEquipo(equipo.id);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleEditFicha(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setError('');
    setSaving(true);
    try {
      await editarEquipo(equipo.id, {
        numeroSerie: form.get('numeroSerie'),
        fechaCompra: form.get('fechaCompra') || null,
        mesesGarantia: form.get('mesesGarantia') || null,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo guardar.');
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
            <h2 className="text-sm font-semibold text-slate-800">{equipo.equipo}</h2>
            <p className="text-xs text-slate-500">{equipo.tipo}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {!editing ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <Row label="Estado" value={equipo.estado} />
              <Row label="Técnico asignado" value={equipo.tecnico ?? '—'} />
              <Row label="Instalado en" value={equipo.clienteInstalacion ?? '—'} />
              <Row label="N° de serie" value={equipo.numeroSerie || '—'} />
              <Row label="Fecha de compra" value={toDateInput(equipo.fechaCompra) || '—'} />
              <Row label="Garantía" value={garantia ? `${garantia.estado} — hasta ${toDateInput(garantia.vencimiento)}` : '—'} />
              <button onClick={() => setEditing(true)} className="text-xs font-medium text-sky-700 hover:underline pt-1">
                Editar serie / compra / garantía
              </button>
            </div>
          ) : (
            <form onSubmit={handleEditFicha} className="bg-slate-50 rounded-lg p-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">N° de serie</span>
                <input name="numeroSerie" defaultValue={equipo.numeroSerie || ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Fecha de compra</span>
                <input type="date" name="fechaCompra" defaultValue={toDateInput(equipo.fechaCompra)} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Garantía (meses)</span>
                <input type="number" min="0" name="mesesGarantia" defaultValue={equipo.mesesGarantia || ''} className="input" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          )}

          {equipo.estado === 'En bodega' && (
            <form onSubmit={handleAsignar} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Asignar a técnico</p>
              <select value={tecnicoElegido} onChange={(e) => setTecnicoElegido(e.target.value)} className="input">
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              <input value={clienteInstalacion} onChange={(e) => setClienteInstalacion(e.target.value)} placeholder="Cliente / instalación (opcional)" className="input" />
              <button type="submit" disabled={!tecnicoElegido || saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">Asignar</button>
            </form>
          )}

          {equipo.estado === 'Asignado' && (
            <button onClick={handleDevolver} disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
              Registrar devolución
            </button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...equipo.bitacora].reverse().map((b) => (
                <li key={b.id ?? `${b.evento}-${b.fecha}`} className="text-sm border-l-2 border-slate-200 pl-3">
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
