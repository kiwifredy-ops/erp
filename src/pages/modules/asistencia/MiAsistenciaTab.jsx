import { useEffect, useState } from 'react';
import { LogIn, LogOut, MapPin, CheckCircle2 } from 'lucide-react';
import { getMisMarcaciones, marcarEntrada, marcarSalida, obtenerUbicacion, mapsUrl } from '../../../lib/asistenciaStore';
import { getSession } from '../../../lib/authStore';

const ESTADO_STYLES = {
  Normal: 'bg-emerald-50 text-emerald-700',
  Atraso: 'bg-amber-50 text-amber-700',
  Ausencia: 'bg-red-50 text-red-700',
};

export default function MiAsistenciaTab() {
  const user = getSession();
  const [marcaciones, setMarcaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hoy = new Date().toISOString().slice(0, 10);

  async function refresh() {
    setLoading(true);
    try {
      setMarcaciones(await getMisMarcaciones());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const deHoy = marcaciones.find((m) => new Date(m.fecha).toISOString().slice(0, 10) === hoy);

  async function handleEntrada() {
    setError('');
    setSaving(true);
    try {
      const hora = new Date().toTimeString().slice(0, 5);
      const coords = await obtenerUbicacion();
      await marcarEntrada(user?.nombre, hoy, hora, coords);
      refresh();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la entrada.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSalida() {
    setError('');
    setSaving(true);
    try {
      const hora = new Date().toTimeString().slice(0, 5);
      const coords = await obtenerUbicacion();
      await marcarSalida(deHoy.id, hora, coords);
      refresh();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la salida.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <p className="text-sm text-slate-500">Hola,</p>
        <p className="text-lg font-semibold text-slate-800 mb-1">{user?.nombre}</p>
        <p className="text-xs text-slate-400 mb-5">
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        {loading ? (
          <p className="text-sm text-slate-400 py-6">Cargando...</p>
        ) : !deHoy ? (
          <>
            <p className="text-sm text-slate-500 mb-4">Todavía no marcas entrada hoy.</p>
            <button
              onClick={handleEntrada}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-base font-medium rounded-xl py-4"
            >
              <LogIn className="w-5 h-5" />
              {saving ? 'Registrando...' : 'Marcar entrada'}
            </button>
          </>
        ) : !deHoy.horaSalida ? (
          <>
            <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Entrada registrada a las {deHoy.horaEntrada}
            </div>
            <button
              onClick={handleSalida}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-base font-medium rounded-xl py-4"
            >
              <LogOut className="w-5 h-5" />
              {saving ? 'Registrando...' : 'Marcar salida'}
            </button>
          </>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Jornada completa
            </div>
            <p className="text-sm text-slate-600">Entrada {deHoy.horaEntrada} · Salida {deHoy.horaSalida}</p>
            <p className="text-xs text-slate-400">{deHoy.horasTrabajadas} horas trabajadas{deHoy.horasExtra > 0 ? ` (+${deHoy.horasExtra} extra)` : ''}</p>
          </div>
        )}
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Mis últimos días</p>
        <ul className="space-y-1.5">
          {marcaciones.map((m) => (
            <li key={m.id} className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-slate-700">{new Date(m.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  {m.horaEntrada ?? '—'} → {m.horaSalida ?? '—'}
                  {m.latEntrada != null && (
                    <a href={mapsUrl(m.latEntrada, m.lngEntrada)} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-700">
                      <MapPin className="w-3 h-3" />
                    </a>
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[m.estado] ?? ''}`}>{m.estado}</span>
                {m.horasTrabajadas > 0 && <p className="text-xs text-slate-400 mt-0.5">{m.horasTrabajadas} h</p>}
              </div>
            </li>
          ))}
          {!loading && marcaciones.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Sin marcaciones registradas todavía.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
