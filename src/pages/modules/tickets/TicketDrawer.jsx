import { useState } from 'react';
import { X, MapPin, History, Camera, Upload, Eye, Trash2, Star, PenLine } from 'lucide-react';
import {
  asignarTicket,
  iniciarServicio,
  finalizarServicio,
  firmarTicket,
  responderEncuesta,
  cerrarTicket,
  cancelarTicket,
  subirArchivo,
  getArchivo,
  eliminarArchivo,
  fileToBase64,
  getUbicacionActual,
  getNextEstados,
} from '../../../lib/ticketsStore';
import { ESTADO_STYLES, PRIORIDAD_STYLES } from './TicketsModule';
import SignaturePad from './SignaturePad';
import { puedeVer } from '../../../lib/authStore';

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

export default function TicketDrawer({ ticket, tecnicos = [], onClose, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nextEstados = getNextEstados(ticket.estado);
  // Cerrar, cancelar y (re)asignar son acciones de mesa de ayuda/gestión —
  // en la vista de autoservicio del técnico no se muestran, aunque el
  // backend igual las bloquearía si se intentaran.
  const esGestion = puedeVer('tickets');

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
    await withSaving(() => asignarTicket(ticket.id, tecnico));
  }

  async function handleIniciar() {
    await withSaving(async () => {
      const { lat, lng } = await getUbicacionActual();
      await iniciarServicio(ticket.id, { lat, lng });
    });
  }

  async function handleFinalizar(e) {
    e.preventDefault();
    const observaciones = new FormData(e.target).get('observaciones');
    if (!observaciones) return;
    await withSaving(async () => {
      const { lat, lng } = await getUbicacionActual();
      await finalizarServicio(ticket.id, { lat, lng, observaciones });
    });
  }

  async function handleFirma(dataUrl) {
    await withSaving(() => firmarTicket(ticket.id, dataUrl));
  }

  async function handleEncuesta(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    await withSaving(() => responderEncuesta(ticket.id, { calificacion: form.get('calificacion'), comentario: form.get('comentario') }));
  }

  async function handleCerrar() {
    await withSaving(() => cerrarTicket(ticket.id));
  }

  async function handleCancelar() {
    if (!confirm('¿Cancelar este ticket?')) return;
    await withSaving(() => cancelarTicket(ticket.id, 'Cancelado manualmente'));
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{ticket.folio} · {ticket.cliente}</h2>
            <p className="text-xs text-slate-500">{ticket.direccion}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[ticket.estado] ?? ''}`}>{ticket.estado}</span>
            <span className={`text-xs ${PRIORIDAD_STYLES[ticket.prioridad] ?? ''}`}>Prioridad: {ticket.prioridad}</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Descripción del servicio</p>
            <p className="text-slate-700">{ticket.descripcion}</p>
          </div>

          {esGestion && ticket.estado === 'Abierto' && (
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

          {ticket.estado === 'Asignado' && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Técnico asignado</p>
              <p className="text-sm text-slate-800">{ticket.tecnico}</p>
              <button onClick={handleIniciar} disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Obteniendo ubicación...' : 'Iniciar servicio'}
              </button>
            </div>
          )}

          {(ticket.fechaInicio || ticket.fechaFin) && (
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-2">
              {ticket.fechaInicio && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 font-medium">Inicio: {new Date(ticket.fechaInicio).toLocaleString('es-CL')}</p>
                    <p className="text-xs text-slate-500">{ticket.latInicio != null ? `${ticket.latInicio.toFixed(5)}, ${ticket.lngInicio.toFixed(5)}` : 'Ubicación no disponible'}</p>
                  </div>
                </div>
              )}
              {ticket.fechaFin && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700 font-medium">Fin: {new Date(ticket.fechaFin).toLocaleString('es-CL')}</p>
                    <p className="text-xs text-slate-500">{ticket.latFin != null ? `${ticket.latFin.toFixed(5)}, ${ticket.lngFin.toFixed(5)}` : 'Ubicación no disponible'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {['En curso', 'Completado', 'Cerrado'].includes(ticket.estado) && (
            <ArchivosSection ticket={ticket} onChanged={onChanged} />
          )}

          {ticket.estado === 'En curso' && (
            <form onSubmit={handleFinalizar} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Finalizar servicio</p>
              <textarea name="observaciones" required rows={3} placeholder="Observaciones del servicio realizado..." className="input" />
              <button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Obteniendo ubicación...' : 'Finalizar servicio'}
              </button>
            </form>
          )}

          {['Completado', 'Cerrado'].includes(ticket.estado) && ticket.observaciones && (
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Observaciones del técnico</p>
              <p className="text-slate-700">{ticket.observaciones}</p>
            </div>
          )}

          {ticket.estado === 'Completado' && !ticket.firmaCliente && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <PenLine className="w-3.5 h-3.5" /> Firma del cliente
              </p>
              <SignaturePad onSave={handleFirma} saving={saving} />
            </div>
          )}

          {ticket.firmaCliente && (
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Firma del cliente</p>
              <img src={ticket.firmaCliente} alt="Firma del cliente" className="border border-slate-200 rounded-md bg-white max-w-full" />
            </div>
          )}

          {ticket.estado === 'Completado' && !ticket.encuesta && (
            <form onSubmit={handleEncuesta} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Encuesta de satisfacción (para el cliente)</p>
              <EstrellasInput />
              <textarea name="comentario" rows={2} placeholder="Comentario (opcional)" className="input" />
              <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
                {saving ? 'Guardando...' : 'Enviar encuesta'}
              </button>
            </form>
          )}

          {ticket.encuesta && (
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Encuesta de satisfacción</p>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= ticket.encuesta.calificacion ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              {ticket.encuesta.comentario && <p className="text-sm text-slate-600 mt-2">{ticket.encuesta.comentario}</p>}
            </div>
          )}

          {esGestion && ticket.estado === 'Completado' && (
            <button onClick={handleCerrar} disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
              {saving ? 'Guardando...' : 'Cerrar ticket'}
            </button>
          )}

          {esGestion && nextEstados.includes('Cancelado') && (
            <button onClick={handleCancelar} disabled={saving} className="w-full text-xs font-medium text-red-600 border border-red-200 rounded-md py-1.5 hover:bg-red-50">
              Cancelar ticket
            </button>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" /> Bitácora
            </p>
            <ul className="space-y-3">
              {[...ticket.bitacora].reverse().map((b) => (
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

function EstrellasInput() {
  const [valor, setValor] = useState(5);
  return (
    <div>
      <input type="hidden" name="calificacion" value={valor} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setValor(n)}>
            <Star className={`w-6 h-6 ${n <= valor ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ArchivosSection({ ticket, onChanged }) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState(null);
  const archivos = ticket.archivos ?? [];
  const esGestion = puedeVer('tickets');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El archivo supera los 20MB permitidos.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const contenido = await fileToBase64(file);
      const tipo = file.type.startsWith('video/') ? 'Video' : 'Foto';
      await subirArchivo(ticket.id, { tipo, nombreArchivo: file.name, mimeType: file.type || 'application/octet-stream', contenido });
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo subir el archivo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleView(archivoId) {
    setViewingId(archivoId);
    try {
      const archivo = await getArchivo(ticket.id, archivoId);
      const win = window.open();
      if (win) {
        if (archivo.mimeType.startsWith('image/')) {
          win.document.write(`<title>${archivo.nombreArchivo}</title><img src="${archivo.contenido}" style="max-width:100%" />`);
        } else if (archivo.mimeType.startsWith('video/')) {
          win.document.write(`<title>${archivo.nombreArchivo}</title><video src="${archivo.contenido}" controls autoplay style="max-width:100%"></video>`);
        } else {
          win.location.href = archivo.contenido;
        }
      }
    } finally {
      setViewingId(null);
    }
  }

  async function handleDelete(archivoId) {
    await eliminarArchivo(ticket.id, archivoId);
    onChanged();
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        <Camera className="w-3.5 h-3.5" /> Fotos y video del servicio
      </p>

      {archivos.length > 0 ? (
        <ul className="space-y-1.5">
          {archivos.map((a) => (
            <li key={a.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-700">{a.tipo}</p>
                <p className="text-xs text-slate-500 truncate">{a.nombreArchivo}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleView(a.id)} disabled={viewingId === a.id} className="text-slate-500 hover:text-sky-700 p-1">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {esGestion && (
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">Sin fotos ni video adjuntos.</p>
      )}

      {ticket.estado !== 'Cerrado' && (
        <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-md py-2 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-700 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          {saving ? 'Subiendo...' : 'Tomar foto / video (máx. 20MB)'}
          <input type="file" accept="image/*,video/*" capture="environment" onChange={handleFile} disabled={saving} className="hidden" />
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
