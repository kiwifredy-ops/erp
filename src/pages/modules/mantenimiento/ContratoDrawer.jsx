import { useState } from 'react';
import { X, History, CalendarClock, Pencil } from 'lucide-react';
import { editarContrato, cancelarContrato, estadoVigencia, TIPOS_MANTENIMIENTO, PERIODICIDADES } from '../../../lib/mantenimientoStore';
import { formatCLP, VIGENCIA_STYLES } from './ContratosTab';

const ESTADO_VISITA_STYLES = {
  Programada: 'bg-slate-100 text-slate-600',
  'En curso': 'bg-amber-50 text-amber-700',
  Realizada: 'bg-emerald-50 text-emerald-700',
  Cancelada: 'bg-red-50 text-red-700',
};

export default function ContratoDrawer({ contrato, onClose, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const vigencia = estadoVigencia(contrato);

  async function handleEdit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setError('');
    setSaving(true);
    try {
      await editarContrato(contrato.id, {
        tipoMantenimiento: form.get('tipoMantenimiento'),
        periodicidad: form.get('periodicidad'),
        fechaTermino: form.get('fechaTermino'),
        valorMensual: form.get('valorMensual') || null,
        alcance: form.get('alcance'),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cambio.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelar() {
    if (!confirm('¿Cancelar este contrato de mantención?')) return;
    setSaving(true);
    try {
      await cancelarContrato(contrato.id, 'Cancelado manualmente');
      onChanged();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{contrato.folio}</h2>
            <p className="text-xs text-slate-500">{contrato.cliente}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${VIGENCIA_STYLES[vigencia] ?? ''}`}>{vigencia}</span>

          {!editing ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <Row label="Tipo de mantenimiento" value={contrato.tipoMantenimiento} />
              <Row label="Periodicidad" value={contrato.periodicidad} />
              <Row label="Vigente desde" value={new Date(contrato.fechaInicio).toISOString().slice(0, 10)} />
              <Row label="Vigente hasta" value={new Date(contrato.fechaTermino).toISOString().slice(0, 10)} />
              <Row label="Valor mensual" value={contrato.valorMensual ? formatCLP(contrato.valorMensual) : '—'} />
              {contrato.alcance && <Row label="Alcance" value={contrato.alcance} />}
              {contrato.estado !== 'Cancelado' && (
                <div className="flex items-center justify-between pt-1">
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={handleCancelar} disabled={saving} className="text-xs font-medium text-red-600 hover:underline">
                    Cancelar contrato
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleEdit} className="bg-slate-50 rounded-lg p-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Tipo de mantenimiento</span>
                <select name="tipoMantenimiento" defaultValue={contrato.tipoMantenimiento} className="input">
                  {TIPOS_MANTENIMIENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Periodicidad</span>
                <select name="periodicidad" defaultValue={contrato.periodicidad} className="input">
                  {PERIODICIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Vigente hasta (caducidad)</span>
                <input type="date" name="fechaTermino" defaultValue={new Date(contrato.fechaTermino).toISOString().slice(0, 10)} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Valor mensual (CLP)</span>
                <input type="number" min="0" name="valorMensual" defaultValue={contrato.valorMensual ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Alcance</span>
                <textarea name="alcance" rows={2} defaultValue={contrato.alcance ?? ''} className="input" />
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          )}

          {contrato.visitas?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <CalendarClock className="w-3.5 h-3.5" /> Visitas de la agenda
              </p>
              <ul className="space-y-1.5">
                {contrato.visitas.map((v) => (
                  <li key={v.id} className="bg-slate-50 rounded-md px-3 py-2 text-sm flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700">{v.folio}</p>
                      <p className="text-xs text-slate-500">{new Date(v.fechaProgramada).toISOString().slice(0, 10)} · {v.tecnico ?? 'Sin asignar'}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ESTADO_VISITA_STYLES[v.estado] ?? ''}`}>{v.estado}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...contrato.bitacora].reverse().map((b) => (
                <li key={b.id ?? `${b.evento}-${b.fecha}`} className="text-sm border-l-2 border-slate-200 pl-3">
                  <p className="font-medium text-slate-700">{b.evento}</p>
                  <p className="text-xs text-slate-500">{new Date(b.fecha).toISOString().slice(0, 10)}</p>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value}</span>
    </div>
  );
}
