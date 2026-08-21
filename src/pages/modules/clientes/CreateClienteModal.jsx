import { useState } from 'react';
import { X } from 'lucide-react';
import { crearCliente, TIPOS_CLIENTE } from '../../../lib/clientesStore';

export default function CreateClienteModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    tipo: TIPOS_CLIENTE[0], nombre: '', rut: '', direccion: '', comuna: '', ciudad: '',
    telefono: '', email: '', contactoNombre: '', contactoCargo: '', contactoTelefono: '', notas: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearCliente(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el cliente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                {TIPOS_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="RUT">
              <input value={form.rut} onChange={(e) => set('rut', e.target.value)} className="input" placeholder="76.123.456-7" />
            </Field>
            <Field label="Nombre / Razón social" span2>
              <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" />
            </Field>
            <Field label="Dirección" span2>
              <input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} className="input" />
            </Field>
            <Field label="Comuna">
              <input value={form.comuna} onChange={(e) => set('comuna', e.target.value)} className="input" />
            </Field>
            <Field label="Ciudad">
              <input value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} className="input" />
            </Field>
            <Field label="Teléfono">
              <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className="input" />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
            </Field>
            <Field label="Contacto — nombre">
              <input value={form.contactoNombre} onChange={(e) => set('contactoNombre', e.target.value)} className="input" />
            </Field>
            <Field label="Contacto — cargo">
              <input value={form.contactoCargo} onChange={(e) => set('contactoCargo', e.target.value)} className="input" />
            </Field>
            <Field label="Contacto — teléfono" span2>
              <input value={form.contactoTelefono} onChange={(e) => set('contactoTelefono', e.target.value)} className="input" />
            </Field>
            <Field label="Notas" span2>
              <textarea rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)} className="input" />
            </Field>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar cliente'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, span2 }) {
  return (
    <label className={`block ${span2 ? 'col-span-2' : ''}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
