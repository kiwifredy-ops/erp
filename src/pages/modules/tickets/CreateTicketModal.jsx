import { useState } from 'react';
import { X } from 'lucide-react';
import { crearTicket, PRIORIDADES } from '../../../lib/ticketsStore';

export default function CreateTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ cliente: '', direccion: '', descripcion: '', prioridad: 'Media' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearTicket(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear el ticket.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo ticket de servicio</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Cliente</span>
            <input required value={form.cliente} onChange={(e) => set('cliente', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Dirección</span>
            <input required value={form.direccion} onChange={(e) => set('direccion', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Descripción del servicio</span>
            <textarea required rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Prioridad</span>
            <select value={form.prioridad} onChange={(e) => set('prioridad', e.target.value)} className="input">
              {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Creando...' : 'Crear ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
