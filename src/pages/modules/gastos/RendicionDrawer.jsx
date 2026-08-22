import { useState } from 'react';
import { X, History, Receipt, Paperclip } from 'lucide-react';
import { getTotal, getNextEstados, cambiarEstadoRendicion, getComprobante } from '../../../lib/gastosStore';
import { puedeEditar } from '../../../lib/authStore';
import { formatCLP, ESTADO_STYLES } from './GastosModule';

export default function RendicionDrawer({ rendicion, onClose, onChanged }) {
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const nextEstados = getNextEstados(rendicion.estado);

  async function handleVerComprobante(lineaId) {
    setViewingId(lineaId);
    try {
      const { comprobante, comprobanteNombre } = await getComprobante(rendicion.id, lineaId);
      const win = window.open();
      if (win) {
        if (comprobante.startsWith('data:image/')) {
          win.document.write(`<title>${comprobanteNombre}</title><img src="${comprobante}" style="max-width:100%" />`);
        } else {
          win.location.href = comprobante;
        }
      }
    } finally {
      setViewingId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nuevoEstado) return;
    setError('');
    setSaving(true);
    try {
      await cambiarEstadoRendicion(rendicion.id, nuevoEstado, motivo);
      setNuevoEstado('');
      setMotivo('');
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado.');
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
            <h2 className="text-sm font-semibold text-slate-800">{rendicion.folio}</h2>
            <p className="text-xs text-slate-500">{rendicion.tecnico} · {new Date(rendicion.fecha).toISOString().slice(0, 10)}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[rendicion.estado] ?? ''}`}>{rendicion.estado}</span>
            <span className="text-sm font-semibold text-slate-800">{formatCLP(getTotal(rendicion))}</span>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <Receipt className="w-3.5 h-3.5" /> Ítems
            </p>
            <ul className="space-y-2">
              {rendicion.lineas.map((l) => (
                <li key={l.id} className="bg-slate-50 rounded-md p-3 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{l.categoria}</p>
                      <p className="text-xs text-slate-500">{l.descripcion}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(l.fecha).toISOString().slice(0, 10)}
                        {l.kilometros ? ` · ${l.kilometros} km` : ''}
                      </p>
                    </div>
                    <p className="font-medium text-slate-800">{formatCLP(l.monto)}</p>
                  </div>
                  {l.comprobanteNombre && (
                    <button
                      onClick={() => handleVerComprobante(l.id)}
                      disabled={viewingId === l.id}
                      className="flex items-center gap-1 text-xs text-sky-700 hover:underline mt-1.5"
                    >
                      <Paperclip className="w-3 h-3" /> Ver comprobante
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {puedeEditar('gastos') && nextEstados.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-2 border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Actualizar estado</p>
              <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} className="input">
                <option value="">Seleccionar nuevo estado...</option>
                {nextEstados.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Observación (opcional)" className="input" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={!nuevoEstado || saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Confirmar'}</button>
            </form>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...rendicion.bitacora].reverse().map((b) => (
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
