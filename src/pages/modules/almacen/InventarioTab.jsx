import { useMemo, useState } from 'react';
import { Plus, Search, AlertTriangle, X, History } from 'lucide-react';
import { getItems, crearItem, registrarMovimiento, CATEGORIAS_ITEM, UNIDADES } from '../../../lib/almacenStore';

export default function InventarioTab() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const items = useMemo(() => getItems(), [version]);
  const filtered = items.filter((it) => {
    const matchesQuery = !query || it.nombre.toLowerCase().includes(query.toLowerCase());
    const matchesCat = !categoria || it.categoria === categoria;
    return matchesQuery && matchesCat;
  });
  const selected = items.find((it) => it.id === selectedId);

  function refresh() {
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-4">
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

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
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
                      <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit">
                        <AlertTriangle className="w-3 h-3" /> Bajo mínimo
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateItemModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <ItemDrawer item={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', categoria: CATEGORIAS_ITEM[0], unidad: UNIDADES[0], stock: 0, stockMinimo: 0, ubicacion: '' });
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function handleSubmit(e) { e.preventDefault(); crearItem(form); onCreated(); }

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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">Registrar material</button>
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

  function handleSubmit(e) {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) return;
    registrarMovimiento(item.id, tipo, Number(cantidad), motivo);
    setCantidad('');
    setMotivo('');
    onChanged();
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
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md py-2">Confirmar movimiento</button>
          </form>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Movimientos
            </p>
            <ul className="space-y-3">
              {[...item.movimientos].reverse().map((m, i) => (
                <li key={i} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{m.tipo} · {m.cantidad} {item.unidad}</p>
                  <p className="text-xs text-slate-500">{m.fecha}</p>
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
