import { useState } from 'react';
import { FileText, Upload, Trash2, Eye } from 'lucide-react';
import { subirDocumento, eliminarDocumento, getDocumento, fileToBase64, TIPOS_DOCUMENTO } from '../../../lib/rrhhStore';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export default function DocumentosSection({ empleado, onChanged }) {
  const [tipo, setTipo] = useState(TIPOS_DOCUMENTO[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El archivo supera los 8MB permitidos.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const contenido = await fileToBase64(file);
      await subirDocumento(empleado.id, { tipo, nombreArchivo: file.name, mimeType: file.type || 'application/octet-stream', contenido });
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo subir el archivo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleView(docId) {
    setViewingId(docId);
    try {
      const doc = await getDocumento(empleado.id, docId);
      const win = window.open();
      if (win) {
        if (doc.mimeType.startsWith('image/')) {
          win.document.write(`<title>${doc.nombreArchivo}</title><img src="${doc.contenido}" style="max-width:100%" />`);
        } else {
          win.location.href = doc.contenido;
        }
      }
    } finally {
      setViewingId(null);
    }
  }

  async function handleDelete(docId) {
    await eliminarDocumento(empleado.id, docId);
    onChanged();
  }

  const documentos = empleado.documentos ?? [];

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        <FileText className="w-3.5 h-3.5" /> Documentos
      </p>

      {documentos.length > 0 ? (
        <ul className="space-y-1.5">
          {documentos.map((d) => (
            <li key={d.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-700 truncate">{d.tipo}</p>
                <p className="text-xs text-slate-500 truncate">{d.nombreArchivo}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleView(d.id)} disabled={viewingId === d.id} className="text-slate-500 hover:text-sky-700 p-1">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400">Sin documentos adjuntos.</p>
      )}

      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input">
          {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-md py-2 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-700 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          {saving ? 'Subiendo...' : 'Seleccionar archivo (máx. 8MB)'}
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} disabled={saving} className="hidden" />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
