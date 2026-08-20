import { useState } from 'react';
import { X } from 'lucide-react';
import { crearEmpleado, DEPARTAMENTOS, TIPOS_CONTRATO } from '../../../lib/rrhhStore';

const EMPTY = {
  nombre: '',
  documento: '',
  cargo: '',
  departamento: DEPARTAMENTOS[0],
  tipoContrato: TIPOS_CONTRATO[0],
  fechaIngreso: new Date().toISOString().slice(0, 10),
  email: '',
  telefono: '',
};

export default function EmpleadoModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    crearEmpleado(form);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo empleado</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre completo" span2>
              <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" />
            </Field>
            <Field label="Documento / RUT">
              <input required value={form.documento} onChange={(e) => set('documento', e.target.value)} className="input" />
            </Field>
            <Field label="Cargo">
              <input required value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className="input" />
            </Field>
            <Field label="Departamento">
              <select value={form.departamento} onChange={(e) => set('departamento', e.target.value)} className="input">
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Tipo de contrato">
              <select value={form.tipoContrato} onChange={(e) => set('tipoContrato', e.target.value)} className="input">
                {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Fecha de ingreso">
              <input type="date" required value={form.fechaIngreso} onChange={(e) => set('fechaIngreso', e.target.value)} className="input" />
            </Field>
            <Field label="Correo electrónico">
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
            </Field>
            <Field label="Teléfono">
              <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className="input" />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">
              Registrar empleado
            </button>
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
