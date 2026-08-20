import { useMemo, useState } from 'react';
import { Plus, X, History, Car } from 'lucide-react';
import { getVehiculos, crearVehiculo, asignarVehiculo, cambiarEstadoVehiculo, registrarMantencion, getNextEstados, TIPOS_VEHICULO, ESTADOS_VEHICULO } from '../../../lib/flotaStore';
import { getEmpleados } from '../../../lib/rrhhStore';

const ESTADO_STYLES = {
  Disponible: 'bg-emerald-50 text-emerald-700',
  Asignado: 'bg-sky-50 text-sky-700',
  'En mantención': 'bg-amber-50 text-amber-700',
  'Fuera de servicio': 'bg-red-50 text-red-700',
};

export default function VehiculosTab() {
  const [version, setVersion] = useState(0);
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const vehiculos = useMemo(() => getVehiculos(), [version]);
  const filtered = vehiculos.filter((v) => !estado || v.estado === estado);
  const selected = vehiculos.find((v) => v.id === selectedId);

  function refresh() {
    setVersion((v) => v + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_VEHICULO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nuevo vehículo
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Vehículo</th>
              <th className="text-left font-medium px-4 py-2.5">Tipo</th>
              <th className="text-left font-medium px-4 py-2.5">Técnico</th>
              <th className="text-left font-medium px-4 py-2.5">Kilometraje</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} onClick={() => setSelectedId(v.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800 flex items-center gap-2"><Car className="w-3.5 h-3.5 text-slate-400" /> {v.patente}</p>
                  <p className="text-xs text-slate-500 pl-5.5">{v.marca} {v.modelo} ({v.anio})</p>
                </td>
                <td className="px-4 py-2.5 text-slate-600">{v.tipo}</td>
                <td className="px-4 py-2.5 text-slate-600">{v.tecnico ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-600">{v.kilometraje.toLocaleString('es-CL')} km</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[v.estado] ?? ''}`}>{v.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateVehiculoModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <VehiculoDrawer vehiculo={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateVehiculoModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ patente: '', marca: '', modelo: '', anio: new Date().getFullYear(), tipo: TIPOS_VEHICULO[0], kilometraje: 0, proximaMantencionKm: 10000 });
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function handleSubmit(e) { e.preventDefault(); crearVehiculo(form); onCreated(); }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nuevo vehículo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Patente</span>
              <input required value={form.patente} onChange={(e) => set('patente', e.target.value.toUpperCase())} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Tipo</span>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                {TIPOS_VEHICULO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Marca</span>
              <input required value={form.marca} onChange={(e) => set('marca', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Modelo</span>
              <input required value={form.modelo} onChange={(e) => set('modelo', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Año</span>
              <input type="number" value={form.anio} onChange={(e) => set('anio', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Kilometraje inicial</span>
              <input type="number" min="0" value={form.kilometraje} onChange={(e) => set('kilometraje', e.target.value)} className="input" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 text-white font-medium">Registrar vehículo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehiculoDrawer({ vehiculo, onClose, onChanged }) {
  const tecnicos = useMemo(() => getEmpleados().filter((e) => e.estado === 'Activo' && e.departamento === 'Operaciones / Técnica'), []);
  const [tecnicoElegido, setTecnicoElegido] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [km, setKm] = useState('');

  const nextEstados = getNextEstados(vehiculo.estado);

  function handleAsignar(e) {
    e.preventDefault();
    if (!tecnicoElegido) return;
    asignarVehiculo(vehiculo.id, tecnicoElegido);
    setTecnicoElegido('');
    onChanged();
  }

  function handleEstado(e) {
    e.preventDefault();
    if (!nuevoEstado) return;
    cambiarEstadoVehiculo(vehiculo.id, nuevoEstado, motivo);
    setNuevoEstado('');
    setMotivo('');
    onChanged();
  }

  function handleMantencion(e) {
    e.preventDefault();
    if (!km) return;
    registrarMantencion(vehiculo.id, km, '');
    setKm('');
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{vehiculo.patente}</h2>
            <p className="text-xs text-slate-500">{vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className="font-medium text-slate-800">{vehiculo.estado}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Técnico asignado</span><span className="font-medium text-slate-800">{vehiculo.tecnico ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Kilometraje</span><span className="font-medium text-slate-800">{vehiculo.kilometraje.toLocaleString('es-CL')} km</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Próxima mantención</span><span className="font-medium text-slate-800">{vehiculo.proximaMantencionKm.toLocaleString('es-CL')} km</span></div>
          </div>

          {vehiculo.estado === 'Disponible' && (
            <form onSubmit={handleAsignar} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Asignar a técnico</p>
              <select value={tecnicoElegido} onChange={(e) => setTecnicoElegido(e.target.value)} className="input">
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              <button type="submit" disabled={!tecnicoElegido} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">Asignar</button>
            </form>
          )}

          {nextEstados.length > 0 && (
            <form onSubmit={handleEstado} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Cambiar estado</p>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className="input">
                <option value="">Seleccionar nuevo estado...</option>
                {nextEstados.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)" className="input" />
              <button type="submit" disabled={!nuevoEstado} className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">Confirmar</button>
            </form>
          )}

          <form onSubmit={handleMantencion} className="space-y-2 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registrar mantención</p>
            <input type="number" min={vehiculo.kilometraje} placeholder="Kilometraje actual" value={km} onChange={(e) => setKm(e.target.value)} className="input" />
            <button type="submit" disabled={!km} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">Registrar mantención</button>
          </form>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...vehiculo.bitacora].reverse().map((b, i) => (
                <li key={i} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{b.evento}</p>
                  <p className="text-xs text-slate-500">{b.fecha}</p>
                  {b.detalle && <p className="text-xs text-slate-500 mt-0.5">{b.detalle}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
