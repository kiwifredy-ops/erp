import { useEffect, useState } from 'react';
import { Plus, X, FileText } from 'lucide-react';
import { getContratos, crearContrato, estadoVigencia, TIPOS_MANTENIMIENTO, PERIODICIDADES } from '../../../lib/mantenimientoStore';
import { getClientes } from '../../../lib/clientesStore';
import AlertasCaducidadBanner from './AlertasCaducidadBanner';
import ContratoDrawer from './ContratoDrawer';

const formatCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const VIGENCIA_STYLES = {
  Activo: 'bg-emerald-50 text-emerald-700',
  'Por vencer': 'bg-amber-50 text-amber-700',
  Vencido: 'bg-red-50 text-red-700',
  Cancelado: 'bg-slate-100 text-slate-500',
};

export default function ContratosTab() {
  const [contratos, setContratos] = useState([]);
  const [vigencia, setVigencia] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setContratos(await getContratos());
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = contratos.filter((c) => !vigencia || estadoVigencia(c) === vigencia);
  const selected = contratos.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <AlertasCaducidadBanner refreshKey={contratos} onSelect={setSelectedId} />

      <div className="flex flex-wrap items-center gap-2">
        <select value={vigencia} onChange={(e) => setVigencia(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Toda vigencia</option>
          <option value="Activo">Activo</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Vencido">Vencido</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo contrato
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">Tipo</th>
              <th className="text-left font-medium px-4 py-2.5">Periodicidad</th>
              <th className="text-left font-medium px-4 py-2.5">Vigencia hasta</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setSelectedId(c.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /> {c.folio}</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{c.cliente}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.tipoMantenimiento}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.periodicidad}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(c.fechaTermino).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${VIGENCIA_STYLES[estadoVigencia(c)] ?? ''}`}>{estadoVigencia(c)}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin contratos que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateContratoModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <ContratoDrawer contrato={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateContratoModal({ onClose, onCreated }) {
  const [clientes, setClientes] = useState([]);
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    clienteId: '',
    cliente: '',
    tipoMantenimiento: TIPOS_MANTENIMIENTO[0],
    periodicidad: PERIODICIDADES[0],
    fechaInicio: hoy,
    fechaTermino: '',
    valorMensual: '',
    alcance: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  useEffect(() => {
    getClientes().then((cs) => setClientes(cs.filter((c) => c.activo)));
  }, []);

  function handlePickCliente(id) {
    const c = clientes.find((x) => x.id === id);
    set('clienteId', id);
    if (c) set('cliente', c.nombre);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearContrato({ ...form, clienteId: form.clienteId || null, valorMensual: form.valorMensual || null });
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear el contrato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo contrato de mantención</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {clientes.length > 0 && (
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Tipo de mantenimiento</span>
              <select value={form.tipoMantenimiento} onChange={(e) => set('tipoMantenimiento', e.target.value)} className="input">
                {TIPOS_MANTENIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Periodicidad</span>
              <select value={form.periodicidad} onChange={(e) => set('periodicidad', e.target.value)} className="input">
                {PERIODICIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Vigente desde</span>
              <input type="date" required value={form.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Vigente hasta (caducidad)</span>
              <input type="date" required value={form.fechaTermino} onChange={(e) => set('fechaTermino', e.target.value)} className="input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Valor mensual (CLP, opcional)</span>
            <input type="number" min="0" value={form.valorMensual} onChange={(e) => set('valorMensual', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Alcance del contrato</span>
            <textarea rows={2} value={form.alcance} onChange={(e) => set('alcance', e.target.value)} className="input" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar contrato'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { formatCLP, VIGENCIA_STYLES };
