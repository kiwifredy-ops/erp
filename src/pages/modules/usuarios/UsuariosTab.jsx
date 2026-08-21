import { useEffect, useState } from 'react';
import { Plus, X, KeyRound } from 'lucide-react';
import { getUsuarios, crearUsuario, editarUsuario, toggleUsuarioActivo, cambiarPassword, getRolesPermisos, ROLES_BASE } from '../../../lib/usuariosStore';

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState(ROLES_BASE);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [passwordId, setPasswordId] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      setUsuarios(await getUsuarios());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getRolesPermisos().then((r) => setRoles([...new Set([...ROLES_BASE, ...r.roles])])).catch(() => {});
  }, []);

  async function handleToggle(id) {
    setError('');
    try {
      await toggleUsuarioActivo(id);
      refresh();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Nombre</th>
              <th className="text-left font-medium px-4 py-2.5">Correo</th>
              <th className="text-left font-medium px-4 py-2.5">Rol</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
              <th className="text-left font-medium px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{u.nombre}</td>
                <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {editingId === u.id ? (
                    <RolInline usuario={u} roles={roles} onDone={() => { setEditingId(null); refresh(); }} />
                  ) : (
                    <button onClick={() => setEditingId(u.id)} className="hover:underline">{u.rol}</button>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPasswordId(u.id)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-sky-700">
                      <KeyRound className="w-3.5 h-3.5" /> Contraseña
                    </button>
                    <button onClick={() => handleToggle(u.id)} className="text-xs font-medium text-sky-700 hover:underline">
                      {u.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Sin usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUsuarioModal roles={roles} onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {passwordId && (
        <PasswordModal usuarioId={passwordId} onClose={() => setPasswordId(null)} />
      )}
    </div>
  );
}

function RolInline({ usuario, roles, onDone }) {
  const [saving, setSaving] = useState(false);
  async function handleChange(e) {
    setSaving(true);
    try {
      await editarUsuario(usuario.id, { rol: e.target.value });
    } finally {
      setSaving(false);
      onDone();
    }
  }
  return (
    <select autoFocus defaultValue={usuario.rol} disabled={saving} onChange={handleChange} onBlur={onDone} className="text-sm border border-slate-300 rounded px-1.5 py-1">
      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

function CreateUsuarioModal({ roles, onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', email: '', rol: roles[0] ?? '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearUsuario(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo usuario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nombre completo</span>
            <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Correo electrónico</span>
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Rol</span>
            <select value={form.rol} onChange={(e) => set('rol', e.target.value)} className="input">
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Contraseña inicial</span>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} className="input" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({ usuarioId, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await cambiarPassword(usuarioId, password);
      setOk(true);
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Cambiar contraseña</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        {ok ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-emerald-700">Contraseña actualizada correctamente.</p>
            <button onClick={onClose} className="w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md py-2">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Nueva contraseña</span>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
