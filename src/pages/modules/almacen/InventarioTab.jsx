import { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle, X, History, PackagePlus } from 'lucide-react';
import { getItems, crearItem, registrarMovimiento, solicitarReposicion, CATEGORIAS_ITEM, UNIDADES } from '../../../lib/almacenStore';
import { getProveedores } from '../../../lib/abastecimientoStore';
import AlertasStockBanner from './AlertasStockBanner';

export default function InventarioTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [reponiendo, setReponiendo] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await getItems());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = items.filter((it) => {
    const matchesQuery = !query || it.nombre.toLowerCase().includes(query.toLowerCase());
    const matchesCat = !categoria || it.categoria === categoria;
    return matchesQuery && matchesCat;
  });
  const selected = items.find((it) => it.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <AlertasStockBanner refreshKey={items} onSolicitar={setReponiendo} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar material..." className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todas las categorías</option>
          {CATEGORIAS_ITEM.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo material
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Material</th>
              <th className="text-left font-medium px-4 py-2.5">Categoría</th>
              <th className="text-left font-medium px-4 py-2.5">Ubicación</th>
              <th className="text-left font-medium px-4 py-2.5">Stock</th>
              <th className="text-left font-medium px-4 py-2.5">Mínimo</th>
              <th className="text-left font-medium px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((it) => {
              const bajoMinimo = it.stock < it.stockMinimo;
              return (
                <tr key={it.id} onClick={() => setSelectedId(it.id)} className="hover:bg-slate-50 cursor-pointer">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{it.nombre}</td>
                  <td className="px-4 py-2.5 text-slate-600">{it.categoria}</td>
                  <td className="px-4 py-2.5 text-slate-600">{it.ubicacion}</td>
                  <td className="px-4 py-2.5 text-slate-600">{it.stock} {it.unidad}</td>
                  <td className="px-4 py-2.5 text-slate-600">{it.stockMinimo}</td>
                  <td className="px-4 py-2.5">
                    {bajoMinimo && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setReponiendo(it); }}
                        className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded w-fit"
                      >
                        <AlertTriangle className="w-3 h-3" /> Bajo mínimo
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">Sin materiales que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateItemModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <ItemDrawer item={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}

      {reponiendo && (
        <ReposicionModal item={reponiendo} onClose={() => setReponiendo(null)} onCreated={() => setReponiendo(null)} />
      )}
    </div>
  );
}

function ReposicionModal({ item, onClose, onCreated }) {
  const [proveedores, setProveedores] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [cantidad, setCantidad] = useState(item.stockMinimo - item.stock > 0 ? item.stockMinimo - item.stock : 1);
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(null);

  useEffect(() => {
    getProveedores().then((provs) => {
      const activos = provs.filter((p) => p.activo);
      setProveedores(activos);
      if (activos[0]) setProveedor(activos[0].nombre);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const orden = await solicitarReposicion(item.id, { proveedor, cantidad, precioUnitario });
      setOk(orden.folio);
    } catch (err) {
      setError(err.message || 'No se pudo generar la solicitud.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <PackagePlus className="w-4 h-4" /> Solicitar reposición
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        {ok ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-md p-3">
              Orden de compra <strong>{ok}</strong> generada en Abastecimiento para <strong>{item.nombre}</strong>.
            </p>
            <button onClick={onCreated} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md py-2">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <p className="text-xs text-slate-500">{item.nombre} — stock actual {item.stock}, mínimo {item.stockMinimo}</p>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Proveedor</span>
              <select value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="input" required>
                <option value="">Seleccionar...</option>
                {proveedores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Cantidad a solicitar</span>
              <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input" required />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Precio unitario estimado (CLP)</span>
              <input type="number" min="0" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} className="input" required />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving || !proveedor} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Generando...' : 'Generar orden'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CreateItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', categoria: CATEGORIAS_ITEM[0], unidad: UNIDADES[0], stock: 0, stockMinimo: 0, ubicacion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearItem(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el material.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo material</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="block text-xs font-medium text-slate-600 mb-1">Nombre</span>
              <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Categoría</span>
              <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className="input">
                {CATEGORIAS_ITEM.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Unidad</span>
              <select value={form.unidad} onChange={(e) => set('unidad', e.target.value)} className="input">
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Stock inicial</span>
              <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Stock mínimo</span>
              <input type="number" min="0" value={form.stockMinimo} onChange={(e) => set('stockMinimo', e.target.value)} className="input" />
            </label>
            <label className="block col-span-2">
              <span className="block text-xs font-medium text-slate-600 mb-1">Ubicación</span>
              <input required value={form.ubicacion} onChange={(e) => set('ubicacion', e.target.value)} className="input" />
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar material'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemDrawer({ item, onClose, onChanged }) {
  const [tipo, setTipo] = useState('Entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) return;
    setError('');
    setSaving(true);
    try {
      await registrarMovimiento(item.id, tipo, Number(cantidad), motivo);
      setCantidad('');
      setMotivo('');
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el movimiento.');
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
            <h2 className="text-sm font-semibold text-slate-800">{item.nombre}</h2>
            <p className="text-xs text-slate-500">{item.id} · {item.categoria}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Stock actual</span><span className="font-medium text-slate-800">{item.stock} {item.unidad}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Stock mínimo</span><span className="font-medium text-slate-800">{item.stockMinimo} {item.unidad}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Ubicación</span><span className="font-medium text-slate-800">{item.ubicacion}</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registrar movimiento</p>
            <div className="flex gap-2">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
              <input type="number" min="1" placeholder="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input" />
            </div>
            <input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input" />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Confirmar movimiento'}</button>
          </form>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Movimientos
            </p>
            <ul className="space-y-3">
              {[...item.movimientos].reverse().map((m) => (
                <li key={m.id ?? `${m.tipo}-${m.fecha}`} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{m.tipo} · {m.cantidad} {item.unidad}</p>
                  <p className="text-xs text-slate-500">{new Date(m.fecha).toISOString().slice(0, 10)}</p>
                  {m.motivo && <p className="text-xs text-slate-500 mt-0.5">{m.motivo}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
