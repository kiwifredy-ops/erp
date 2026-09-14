import { useState } from 'react';
import { X, History, MapPin, CalendarClock } from 'lucide-react';
import {
  asignarVisita,
  reprogramarVisita,
  cancelarVisita,
  iniciarVisita,
  completarVisita,
  getNextEstadosVisita,
} from '../../../lib/mantenimientoStore';
import { puedeVer } from '../../../lib/authStore';
import { ESTADO_VISITA_STYLES, esAtrasada } from './AgendaTab';

export default function VisitaDrawer({ visita, tecnicos = [], onClose, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nextEstados = getNextEstadosVisita(visita.estado);
  // Asignar, reprogramar y cancelar son acciones de gestión de la agenda —
  // en la vista de autoservicio del técnico no se muestran.
  const esGestion = puedeVer('mantenimiento');

  async function withSaving(fn) {
    setError('');
    setSaving(true);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAsignar(e) {
    e.preventDefault();
    const tecnico = new FormData(e.target).get('tecnico');
    if (!tecnico) return;
    await withSaving(() => asignarVisita(visita.id, tecnico));
  }

  async function handleReprogramar(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const fecha = form.get('fechaProgramada');
    if (!fecha) return;
    await withSaving(() => reprogramarVisita(visita.id, fecha, form.get('motivo')));
    e.target.reset();
  }

  async function handleIniciar() {
    await withSaving(() => iniciarVisita(visita.id));
  }

  async function handleCompletar(e) {
    e.preventDefault();
    const observaciones = new FormData(e.target).get('observaciones');
    if (!observaciones) return;
    await withSaving(() => completarVisita(visita.id, observaciones));
  }

  async function handleCancelar() {
    if (!confirm('¿Cancelar esta visita?')) return;
    await withSaving(() => cancelarVisita(visita.id, 'Cancelada manualmente'));
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{visita.folio} · {visita.cliente}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {visita.direccion}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_VISITA_STYLES[visita.estado] ?? ''}`}>{esAtrasada(visita) ? 'Atrasada' : visita.estado}</span>
            <span className="text-xs text-slate-500">{visita.tipoMantenimiento}</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Fecha programada</span><span className="font-medium text-slate-800">{new Date(visita.fechaProgramada).toISOString().slice(0, 10)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Técnico asignado</span><span className="font-medium text-slate-800">{visita.tecnico ?? '—'}</span></div>
            {visita.fechaRealizada && (
              <div className="flex justify-between"><span className="text-slate-500">Fecha realizada</span><span className="font-medium text-slate-800">{new Date(visita.fechaRealizada).toISOString().slice(0, 10)}</span></div>
            )}
          </div>

          {esGestion && !visita.tecnico && ['Programada'].includes(visita.estado) && (
            <form onSubmit={handleAsignar} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Asignar técnico</p>
              <select name="tecnico" required className="input">
                <option value="">Seleccionar técnico...</option>
                {tecnicos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
              <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Guardando...' : 'Asignar'}
              </button>
            </form>
          )}

          {visita.estado === 'Programada' && (
            <button onClick={handleIniciar} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
              {saving ? 'Guardando...' : 'Iniciar servicio'}
            </button>
          )}

          {visita.estado === 'En curso' && (
            <form onSubmit={handleCompletar} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Completar servicio</p>
              <textarea name="observaciones" required rows={3} placeholder="Observaciones del servicio realizado..." className="input" />
              <button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Guardando...' : 'Completar servicio'}
              </button>
            </form>
          )}

          {['Realizada', 'Cancelada'].includes(visita.estado) && visita.observaciones && (
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observaciones del técnico</p>
              <p className="text-slate-700">{visita.observaciones}</p>
            </div>
          )}

          {esGestion && nextEstados.includes('Cancelada') && (
            <form onSubmit={handleReprogramar} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <CalendarClock className="w-3.5 h-3.5" /> Reprogramar
              </p>
              <input type="date" name="fechaProgramada" required className="input" />
              <input name="motivo" placeholder="Motivo (opcional)" className="input" />
              <button type="submit" disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Guardando...' : 'Reprogramar visita'}
              </button>
            </form>
          )}

          {esGestion && nextEstados.includes('Cancelada') && (
            <button onClick={handleCancelar} disabled={saving} className="w-full text-xs font-medium text-red-600 border border-red-200 rounded-md py-1.5 hover:bg-red-50">
              Cancelar visita
            </button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...visita.bitacora].reverse().map((b) => (
                <li key={b.id} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{b.evento}</p>
                  <p className="text-xs text-slate-500">{new Date(b.fecha).toLocaleString('es-CL')}</p>
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
