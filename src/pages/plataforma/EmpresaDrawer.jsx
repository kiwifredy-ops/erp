import { useEffect, useState } from 'react';
import { X, Users, LayoutGrid, ShieldAlert, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import {
  getUsuariosEmpresa,
  getModulosEmpresa,
  toggleModuloEmpresa,
  bloquearEmpresa,
  suspenderEmpresa,
  reactivarEmpresa,
  eliminarEmpresa,
} from '../../lib/empresasStore';
import { getModule } from '../../lib/modules';
import { ESTADO_STYLES } from './EmpresasDashboard';

export default function EmpresaDrawer({ empresa, onClose, onChanged }) {
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  async function refresh() {
    const [u, m] = await Promise.all([getUsuariosEmpresa(empresa.id), getModulosEmpresa(empresa.id)]);
    setUsuarios(u);
    setModulos(m);
  }

  useEffect(() => {
    refresh();
  }, [empresa.id]);

  async function handleAccion(fn, confirmacion) {
    if (confirmacion && !confirm(confirmacion)) return;
    setError('');
    setSaving('accion');
    try {
      await fn(empresa.id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.');
    } finally {
      setSaving('');
    }
  }

  async function handleToggleModulo(moduloId, habilitadoActual) {
    setSaving(moduloId);
    try {
      setModulos(await toggleModuloEmpresa(empresa.id, moduloId, !habilitadoActual));
      onChanged();
    } finally {
      setSaving('');
    }
  }

  const esEliminada = empresa.estado === 'Eliminada';

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{empresa.nombre}</h2>
            <p className="text-xs text-slate-500 font-mono">{empresa.slug}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[empresa.estado] ?? ''}`}>{empresa.estado}</span>

          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Fecha de alta</span><span className="font-medium text-slate-800">{new Date(empresa.fechaAlta).toISOString().slice(0, 10)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Usuarios</span><span className="font-medium text-slate-800">{usuarios.length}</span></div>
            {empresa.fechaProximoPago && (
              <div className="flex justify-between"><span className="text-slate-500">Próximo pago</span><span className="font-medium text-slate-800">{new Date(empresa.fechaProximoPago).toISOString().slice(0, 10)}</span></div>
            )}
          </div>

          {!esEliminada && (
            <div className="flex flex-wrap gap-2">
              {empresa.estado === 'Activa' && (
                <>
                  <button
                    onClick={() => handleAccion(suspenderEmpresa, '¿Suspender esta empresa? Sus usuarios perderán el acceso de inmediato.')}
                    disabled={saving === 'accion'}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-200 rounded-md px-3 py-1.5 hover:bg-amber-50"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Suspender
                  </button>
                  <button
                    onClick={() => handleAccion(bloquearEmpresa, '¿Bloquear esta empresa? Sus usuarios perderán el acceso de inmediato.')}
                    disabled={saving === 'accion'}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-700 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Bloquear
                  </button>
                </>
              )}
              {(empresa.estado === 'Suspendida' || empresa.estado === 'Bloqueada') && (
                <button
                  onClick={() => handleAccion(reactivarEmpresa)}
                  disabled={saving === 'accion'}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-md px-3 py-1.5 hover:bg-emerald-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Reactivar
                </button>
              )}
              <button
                onClick={() => handleAccion(eliminarEmpresa, '¿Eliminar esta empresa? Sus usuarios perderán el acceso de inmediato. Los datos se conservan, esta acción no borra la base de datos.')}
                disabled={saving === 'accion'}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          {!esEliminada && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <LayoutGrid className="w-3.5 h-3.5" /> Módulos habilitados (plan)
              </p>
              <ul className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {modulos.map((m) => (
                  <li key={m.moduloId} className="flex items-center justify-between px-3 py-2 text-sm bg-white">
                    <span className="text-slate-700">{getModule(m.moduloId)?.nombre ?? m.moduloId}</span>
                    <input
                      type="checkbox"
                      checked={m.habilitado}
                      disabled={saving === m.moduloId}
                      onChange={() => handleToggleModulo(m.moduloId, m.habilitado)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <Users className="w-3.5 h-3.5" /> Usuarios de esta empresa
            </p>
            <ul className="space-y-1.5">
              {usuarios.map((u) => (
                <li key={u.id} className="bg-slate-50 rounded-md px-3 py-2 text-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 truncate">{u.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email} · {u.rol}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </li>
              ))}
              {usuarios.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Sin usuarios registrados todavía.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
