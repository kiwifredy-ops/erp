import { useEffect, useState } from 'react';
import { Plus, X, MapPin, AlertTriangle } from 'lucide-react';
import { getVisitas, crearVisita, getContratos, ESTADOS_VISITA, TIPOS_MANTENIMIENTO } from '../../../lib/mantenimientoStore';
import { getClientes } from '../../../lib/clientesStore';
import { getEmpleados } from '../../../lib/rrhhStore';
import VisitaDrawer from './VisitaDrawer';

export const ESTADO_VISITA_STYLES = {
  Programada: 'bg-slate-100 text-slate-600',
  'En curso': 'bg-amber-50 text-amber-700',
  Realizada: 'bg-emerald-50 text-emerald-700',
  Cancelada: 'bg-red-50 text-red-700',
};

export function esAtrasada(visita) {
  return visita.estado === 'Programada' && new Date(visita.fechaProgramada).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
}

export default function AgendaTab() {
  const [visitas, setVisitas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setVisitas(await getVisitas());
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => setTecnicos(emps.filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica')));
  }, []);

  const filtered = visitas.filter((v) => !estado || v.estado === estado);
  const selected = visitas.find((v) => v.id === selectedId) ?? null;
  const atrasadas = visitas.filter(esAtrasada).length;

  return (
    <div className="space-y-4">
      {atrasadas > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-3.5 h-3.5" /> {atrasadas} visita{atrasadas === 1 ? '' : 's'} programada{atrasadas === 1 ? '' : 's'} con fecha vencida sin iniciar.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_VISITA.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva visita
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">Tipo</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha programada</th>
              <th className="text-left font-medium px-4 py-2.5">Técnico</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} onClick={() => setSelectedId(v.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{v.folio}{v.contratoId && <span className="ml-1.5 text-[10px] font-medium text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">Contrato</span>}</td>
                <td className="px-4 py-2.5">
                  <p className="text-slate-800">{v.cliente}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{v.direccion}</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{v.tipoMantenimiento}</td>
                <td className={`px-4 py-2.5 ${esAtrasada(v) ? 'text-red-600 font-medium' : 'text-slate-600'}`}>{new Date(v.fechaProgramada).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{v.tecnico ?? '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_VISITA_STYLES[v.estado] ?? ''}`}>{esAtrasada(v) ? 'Atrasada' : v.estado}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin visitas que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateVisitaModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <VisitaDrawer visita={selected} tecnicos={tecnicos} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateVisitaModal({ onClose, onCreated }) {
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [form, setForm] = useState({
    contratoId: '',
    clienteId: '',
    cliente: '',
    direccion: '',
    tipoMantenimiento: TIPOS_MANTENIMIENTO[0],
    fechaProgramada: '',
    tecnico: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    getClientes().then((cs) => setClientes(cs.filter((c) => c.activo)));
    getContratos().then((cs) => setContratos(cs.filter((c) => c.estado !== 'Cancelado')));
    getEmpleados().then((emps) => setTecnicos(emps.filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica')));
  }, []);

  function handlePickContrato(id) {
    const c = contratos.find((x) => x.id === id);
    set('contratoId', id);
    if (c) {
      set('cliente', c.cliente);
      set('clienteId', c.clienteId ?? '');
      set('tipoMantenimiento', c.tipoMantenimiento);
    }
  }

  function handlePickCliente(id) {
    const c = clientes.find((x) => x.id === id);
    set('clienteId', id);
    if (c) {
      set('cliente', c.nombre);
      set('direccion', [c.direccion, c.comuna].filter(Boolean).join(', '));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearVisita({ ...form, contratoId: form.contratoId || null, clienteId: form.clienteId || null, tecnico: form.tecnico || null });
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear la visita.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva visita de mantención</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {contratos.length > 0 && (
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Contrato (opcional — vacío para servicio puntual sin contrato)</span>
              <select value={form.contratoId} onChange={(e) => handlePickContrato(e.target.value)} className="input">
                <option value="">Sin contrato — servicio puntual</option>
                {contratos.map((c) => <option key={c.id} value={c.id}>{c.folio} — {c.cliente}</option>)}
              </select>
            </label>
          )}
          {!form.contratoId && clientes.length > 0 && (
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Cliente registrado (opcional)</span>
              <select value={form.clienteId} onChange={(e) => handlePickCliente(e.target.value)} className="input">
                <option value="">Sin seleccionar — escribir manualmente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Cliente</span>
            <input required value={form.cliente} onChange={(e) => set('cliente', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Dirección</span>
            <input required value={form.direccion} onChange={(e) => set('direccion', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Tipo de mantenimiento</span>
            <select value={form.tipoMantenimiento} onChange={(e) => set('tipoMantenimiento', e.target.value)} className="input">
              {TIPOS_MANTENIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Fecha programada</span>
            <input type="date" required value={form.fechaProgramada} onChange={(e) => set('fechaProgramada', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Técnico (opcional)</span>
            <select value={form.tecnico} onChange={(e) => set('tecnico', e.target.value)} className="input">
              <option value="">Sin asignar</option>
              {tecnicos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
            </select>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Programar visita'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
