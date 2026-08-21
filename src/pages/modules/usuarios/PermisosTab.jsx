import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getRolesPermisos, guardarPermiso } from '../../../lib/usuariosStore';
import { getModule } from '../../../lib/modules';

const ACCIONES = [
  { campo: 'puedeVer', label: 'Ver' },
  { campo: 'puedeCrear', label: 'Crear' },
  { campo: 'puedeEditar', label: 'Editar' },
  { campo: 'puedeEliminar', label: 'Eliminar' },
];

const VACIO = { puedeVer: false, puedeCrear: false, puedeEditar: false, puedeEliminar: false };

export default function PermisosTab() {
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [nuevoRol, setNuevoRol] = useState('');
  const [savingKey, setSavingKey] = useState('');

  async function refresh() {
    const data = await getRolesPermisos();
    setRoles(data.roles);
    setModulos(data.modulos);
    setPermisos(data.permisos);
    setRolSeleccionado((prev) => prev || data.roles[0] || '');
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function permisoDe(moduloId) {
    return permisos.find((p) => p.rol === rolSeleccionado && p.moduloId === moduloId) ?? { rol: rolSeleccionado, moduloId, ...VACIO };
  }

  async function toggle(moduloId, campo) {
    const actual = permisoDe(moduloId);
    const nuevo = { ...actual, [campo]: !actual[campo] };
    const key = `${rolSeleccionado}:${moduloId}`;
    setSavingKey(key);
    try {
      await guardarPermiso(rolSeleccionado, {
        moduloId,
        puedeVer: nuevo.puedeVer,
        puedeCrear: nuevo.puedeCrear,
        puedeEditar: nuevo.puedeEditar,
        puedeEliminar: nuevo.puedeEliminar,
      });
      setPermisos((ps) => {
        const sinEste = ps.filter((p) => !(p.rol === rolSeleccionado && p.moduloId === moduloId));
        return [...sinEste, nuevo];
      });
    } finally {
      setSavingKey('');
    }
  }

  function agregarRol() {
    const nombre = nuevoRol.trim();
    if (!nombre || roles.includes(nombre)) return;
    setRoles((rs) => [...rs, nombre].sort());
    setRolSeleccionado(nombre);
    setNuevoRol('');
  }

  if (loading) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roles</p>
        <ul className="space-y-1">
          {roles.map((r) => (
            <li key={r}>
              <button
                onClick={() => setRolSeleccionado(r)}
                className={`w-full text-left text-sm px-3 py-2 rounded-md ${
                  r === rolSeleccionado ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            </li>
          ))}
        </ul>
        <div className="pt-2 flex items-center gap-1.5">
          <input
            value={nuevoRol}
            onChange={(e) => setNuevoRol(e.target.value)}
            placeholder="Nuevo rol..."
            className="flex-1 text-sm border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button onClick={agregarRol} className="text-sky-600 hover:text-sky-800 p-1.5">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Módulo</th>
              {ACCIONES.map((a) => (
                <th key={a.campo} className="text-center font-medium px-3 py-2.5">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modulos.map((moduloId) => {
              const permiso = permisoDe(moduloId);
              const nombre = getModule(moduloId)?.nombre ?? moduloId;
              const key = `${rolSeleccionado}:${moduloId}`;
              return (
                <tr key={moduloId} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{nombre}</td>
                  {ACCIONES.map((a) => (
                    <td key={a.campo} className="text-center px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={!!permiso[a.campo]}
                        disabled={savingKey === key}
                        onChange={() => toggle(moduloId, a.campo)}
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
