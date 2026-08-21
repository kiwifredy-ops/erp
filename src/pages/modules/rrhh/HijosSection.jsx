import { useState } from 'react';
import { Baby, Plus, Trash2 } from 'lucide-react';
import { agregarHijo, eliminarHijo } from '../../../lib/rrhhStore';

export default function HijosSection({ empleado, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre) return;
    setError('');
    setSaving(true);
    try {
      await agregarHijo(empleado.id, { nombre, fechaNacimiento: fechaNacimiento || null });
      setNombre('');
      setFechaNacimiento('');
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo agregar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hijoId) {
    await eliminarHijo(empleado.id, hijoId);
    onChanged();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          <Baby className="w-3.5 h-3.5" /> Hijos
        </p>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>

      {empleado.hijos?.length > 0 ? (
        <ul className="space-y-1.5">
          {empleado.hijos.map((h) => (
            <li key={h.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-700">{h.nombre}</p>
                {h.fechaNacimiento && <p className="text-xs text-slate-500">Nacimiento: {new Date(h.fechaNacimiento).toISOString().slice(0, 10)}</p>}
              </div>
              <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !showForm && <p className="text-xs text-slate-400">Sin hijos registrados.</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-3 space-y-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="input" required />
          <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="input" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-2 py-1 text-xs rounded-md text-slate-600 hover:bg-slate-200">Cancelar</button>
            <button type="submit" disabled={saving} className="px-2 py-1 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Agregar'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
