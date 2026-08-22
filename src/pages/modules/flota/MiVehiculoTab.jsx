import { useEffect, useState } from 'react';
import { Car, FileText, History } from 'lucide-react';
import { getMisVehiculos, registrarMantencion } from '../../../lib/flotaStore';

const ESTADO_STYLES = {
  Disponible: 'bg-emerald-50 text-emerald-700',
  Asignado: 'bg-sky-50 text-sky-700',
  'En mantención': 'bg-amber-50 text-amber-700',
  'Fuera de servicio': 'bg-red-50 text-red-700',
};

const DOCS_VEHICULO = [
  { campo: 'vencimientoRevisionTecnica', label: 'Revisión técnica' },
  { campo: 'vencimientoSeguro', label: 'Seguro' },
  { campo: 'vencimientoPermisoCirculacion', label: 'Permiso de circulación' },
];

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : 'Sin registrar');

function diasHasta(fecha) {
  if (!fecha) return null;
  const ms = new Date(fecha).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export default function MiVehiculoTab() {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      setVehiculos(await getMisVehiculos());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Cargando...</p>;

  if (vehiculos.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 text-center">
        <Car className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No tienes ningún vehículo asignado por el momento.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {vehiculos.map((v) => (
        <VehiculoCard key={v.id} vehiculo={v} onChanged={refresh} />
      ))}
    </div>
  );
}

function VehiculoCard({ vehiculo, onChanged }) {
  const [km, setKm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleMantencion(e) {
    e.preventDefault();
    if (!km) return;
    setError('');
    setSaving(true);
    try {
      await registrarMantencion(vehiculo.id, km, '');
      setKm('');
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la mantención.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-5 space-y-1 text-center border-b border-slate-100">
        <p className="text-lg font-semibold text-slate-800 flex items-center justify-center gap-2">
          <Car className="w-5 h-5 text-slate-400" /> {vehiculo.patente}
        </p>
        <p className="text-sm text-slate-500">{vehiculo.marca} {vehiculo.modelo} ({vehiculo.anio})</p>
        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[vehiculo.estado] ?? ''}`}>{vehiculo.estado}</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Kilometraje</span><span className="font-medium text-slate-800">{vehiculo.kilometraje.toLocaleString('es-CL')} km</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Próxima mantención</span><span className="font-medium text-slate-800">{vehiculo.proximaMantencionKm.toLocaleString('es-CL')} km</span></div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentación
          </p>
          <div className="space-y-1 text-sm">
            {DOCS_VEHICULO.map((d) => {
              const dias = diasHasta(vehiculo[d.campo]);
              const vencido = dias !== null && dias <= 30;
              return (
                <div key={d.campo} className="flex justify-between">
                  <span className="text-slate-500">{d.label}</span>
                  <span className={`font-medium ${vencido ? 'text-amber-600' : 'text-slate-800'}`}>{toDateInput(vehiculo[d.campo])}</span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleMantencion} className="space-y-2 border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registrar mantención</p>
          <input type="number" min={vehiculo.kilometraje} placeholder="Kilometraje actual" value={km} onChange={(e) => setKm(e.target.value)} className="input" />
          <button type="submit" disabled={!km || saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">
            {saving ? 'Guardando...' : 'Registrar mantención'}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            <History className="w-3.5 h-3.5" /> Bitácora
          </p>
          <ul className="space-y-2.5">
            {[...vehiculo.bitacora].reverse().slice(0, 6).map((b) => (
              <li key={b.id ?? `${b.evento}-${b.fecha}`} className="text-sm border-l-2 border-slate-200 pl-3">
                <p className="font-medium text-slate-700">{b.evento}</p>
                <p className="text-xs text-slate-500">{new Date(b.fecha).toLocaleDateString('es-CL')}</p>
                {b.detalle && <p className="text-xs text-slate-500 mt-0.5">{b.detalle}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
