import { useEffect, useState } from 'react';
import { Plus, X, Trash2, History, Package } from 'lucide-react';
import { getOrdenes, getTotalOrden, crearOrden, cambiarEstadoOrden, getNextEstados, getProveedores, ESTADOS_ORDEN } from '../../../lib/abastecimientoStore';

const ESTADO_STYLES = {
  Solicitada: 'bg-slate-100 text-slate-600',
  Aprobada: 'bg-sky-50 text-sky-700',
  'En tránsito': 'bg-amber-50 text-amber-700',
  Recibida: 'bg-emerald-50 text-emerald-700',
  Rechazada: 'bg-red-50 text-red-700',
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function OrdenesTab() {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setOrdenes(await getOrdenes());
  }

  useEffect(() => {
    refresh();
    getProveedores().then((provs) => setProveedores(provs.filter((p) => p.activo)));
  }, []);

  const filtered = ordenes.filter((o) => !estado || o.estado === estado);
  const selected = ordenes.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_ORDEN.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva orden
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Proveedor</th>
              <th className="text-left font-medium px-4 py-2.5">Fecha</th>
              <th className="text-left font-medium px-4 py-2.5">Ítems</th>
              <th className="text-left font-medium px-4 py-2.5">Total</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((o) => (
              <tr key={o.id} onClick={() => setSelectedId(o.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{o.folio}</td>
                <td className="px-4 py-2.5 text-slate-600">{o.proveedor}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(o.fecha).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{o.items.length}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatCLP(getTotalOrden(o))}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[o.estado] ?? ''}`}>{o.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateOrdenModal proveedores={proveedores} onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <OrdenDrawer orden={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

const emptyItem = () => ({ descripcion: '', cantidad: 1, precioUnitario: '' });

function CreateOrdenModal({ proveedores, onClose, onCreated }) {
  const [proveedor, setProveedor] = useState(proveedores[0]?.nombre ?? '');
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setItem(i, field, value) {
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function addItem() { setItems((its) => [...its, emptyItem()]); }
  function removeItem(i) { setItems((its) => its.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    const validItems = items.filter((it) => it.descripcion && it.cantidad && it.precioUnitario);
    if (!proveedor || validItems.length === 0) return;
    setError('');
    setSaving(true);
    try {
      await crearOrden({ proveedor, fecha: new Date().toISOString().slice(0, 10), items: validItems });
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear la orden.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva orden de compra</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Proveedor</span>
            <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="input">
              {proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </label>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ítems</p>
            {items.map((it, i) => (
              <div key={i} className="border border-slate-200 rounded-md p-3 space-y-2">
                <input placeholder="Descripción" value={it.descripcion} onChange={(e) => setItem(i, 'descripcion', e.target.value)} className="input" />
                <div className="flex items-center gap-2">
                  <input type="number" min="1" placeholder="Cantidad" value={it.cantidad} onChange={(e) => setItem(i, 'cantidad', e.target.value)} className="input" />
                  <input type="number" min="0" placeholder="Precio unitario" value={it.precioUnitario} onChange={(e) => setItem(i, 'precioUnitario', e.target.value)} className="input" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 p-1 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar ítem
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Solicitar orden'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrdenDrawer({ orden, onClose, onChanged }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const nextEstados = getNextEstados(orden.estado);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nuevoEstado) return;
    setError('');
    setSaving(true);
    try {
      await cambiarEstadoOrden(orden.id, nuevoEstado, motivo);
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
            <h2 className="text-sm font-semibold text-slate-800">{orden.folio}</h2>
            <p className="text-xs text-slate-500">{orden.proveedor} · {new Date(orden.fecha).toISOString().slice(0, 10)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[orden.estado] ?? ''}`}>{orden.estado}</span>
            <span className="text-sm font-semibold text-slate-800">{formatCLP(getTotalOrden(orden))}</span>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <Package className="w-3.5 h-3.5" /> Ítems
            </p>
            <ul className="space-y-2">
              {orden.items.map((it) => (
                <li key={it.id} className="bg-slate-50 rounded-md p-3 text-sm flex justify-between">
                  <div>
                    <p className="font-medium text-slate-700">{it.descripcion}</p>
                    <p className="text-xs text-slate-500">{it.cantidad} × {formatCLP(it.precioUnitario)}</p>
                  </div>
                  <p className="font-medium text-slate-800">{formatCLP(it.cantidad * it.precioUnitario)}</p>
                </li>
              ))}
            </ul>
          </div>

          {nextEstados.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Actualizar estado</p>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className="input">
                <option value="">Seleccionar nuevo estado...</option>
                {nextEstados.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Observación (opcional)" className="input" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={!nuevoEstado || saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Confirmar'}</button>
            </form>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...orden.bitacora].reverse().map((b) => (
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
