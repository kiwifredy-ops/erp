import { useEffect, useState } from 'react';
import { Plus, X, Building2, Star } from 'lucide-react';
import { getProveedores, crearProveedor, toggleProveedorActivo, RUBROS_PROVEEDOR } from '../../../lib/abastecimientoStore';

export default function ProveedoresTab() {
  const [proveedores, setProveedores] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  async function refresh() {
    setProveedores(await getProveedores());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleToggle(id) {
    await toggleProveedorActivo(id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Proveedor</th>
              <th className="text-left font-medium px-4 py-2.5">Rubro</th>
              <th className="text-left font-medium px-4 py-2.5">Contacto</th>
              <th className="text-left font-medium px-4 py-2.5">Calificación</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
              <th className="text-left font-medium px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proveedores.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {p.nombre}</td>
                <td className="px-4 py-2.5 text-slate-600">{p.rubro}</td>
                <td className="px-4 py-2.5 text-slate-600">{p.contacto} · {p.telefono}</td>
                <td className="px-4 py-2.5">
                  {p.calificacionPromedio ? (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {p.calificacionPromedio.toFixed(1)} <span className="text-xs text-slate-400">({p.ordenesCalificadas})</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin calificar</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleToggle(p.id)} className="text-xs font-medium text-sky-700 hover:underline">
                    {p.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateProveedorModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}
    </div>
  );
}

function CreateProveedorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', rubro: RUBROS_PROVEEDOR[0], contacto: '', telefono: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearProveedor(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el proveedor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo proveedor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nombre</span>
            <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Rubro</span>
            <select value={form.rubro} onChange={(e) => set('rubro', e.target.value)} className="input">
              {RUBROS_PROVEEDOR.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Correo de contacto</span>
            <input type="email" value={form.contacto} onChange={(e) => set('contacto', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Teléfono</span>
            <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className="input" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar proveedor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
