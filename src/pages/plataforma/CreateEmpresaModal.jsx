import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { crearEmpresa, fileToBase64 } from '../../lib/empresasStore';
import { MODULES } from '../../lib/modules';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

export default function CreateEmpresaModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    modulos: MODULES.map((m) => m.id),
    logo: '',
    logoMimeType: '',
  });
  const [slugTocado, setSlugTocado] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleLogo(file) {
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError('El logo supera los 2MB permitidos.');
      return;
    }
    setError('');
    const contenido = await fileToBase64(file);
    set('logo', contenido);
    set('logoMimeType', file.type || 'image/png');
  }

  function handleNombre(value) {
    set('nombre', value);
    if (!slugTocado) set('slug', slugify(value));
  }

  function toggleModulo(id) {
    setForm((f) => ({
      ...f,
      modulos: f.modulos.includes(id) ? f.modulos.filter((m) => m !== id) : [...f.modulos, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.modulos.length === 0) {
      setError('Selecciona al menos un módulo para el plan de la empresa.');
      return;
    }
    setSaving(true);
    try {
      await crearEmpresa(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear la empresa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva empresa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Datos de la empresa</p>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Nombre / Razón social</span>
              <input required value={form.nombre} onChange={(e) => handleNombre(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Identificador (usado internamente, no editable después)</span>
              <input
                required
                value={form.slug}
                onChange={(e) => { setSlugTocado(true); set('slug', slugify(e.target.value)); }}
                pattern="[a-z0-9_]{3,32}"
                title="Minúsculas, números y guion bajo, entre 3 y 32 caracteres."
                className="input font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Logo (opcional — aparece en el sidebar de su ERP)</span>
              <div className="flex items-center gap-3">
                {form.logo && <img src={form.logo} alt="Logo" className="w-10 h-10 rounded object-contain bg-slate-50 border border-slate-200 shrink-0" />}
                <label className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 border border-dashed border-slate-300 hover:border-sky-400 rounded-md px-3 py-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {form.logo ? 'Cambiar logo' : 'Subir logo (máx. 2MB)'}
                  <input type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files?.[0])} className="hidden" />
                </label>
              </div>
            </label>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Primer usuario (administrador)</p>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Nombre completo</span>
              <input required value={form.adminNombre} onChange={(e) => set('adminNombre', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Correo electrónico</span>
              <input type="email" required value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Contraseña inicial</span>
              <input type="password" required minLength={6} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} className="input" />
            </label>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Módulos incluidos en el plan</p>
            <div className="grid grid-cols-2 gap-1.5">
              {MODULES.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modulos.includes(m.id)}
                    onChange={() => toggleModulo(m.id)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                  />
                  {m.nombre}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-medium">{saving ? 'Creando empresa...' : 'Crear empresa'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
