import { useEffect, useState } from 'react';
import { Upload, Trash2, Eye, FileText } from 'lucide-react';
import {
  getDocumentosPersonal,
  subirDocumentoPersonal,
  eliminarDocumentoPersonal,
  getArchivoPersonal,
  fileToBase64,
  TIPOS_DOCUMENTO_PERSONAL,
} from '../../../lib/prevencionStore';
import { getEmpleados } from '../../../lib/rrhhStore';
import { puedeCrear, puedeEliminar } from '../../../lib/authStore';

const MAX_BYTES = 8 * 1024 * 1024;

const emptyForm = (empleado) => ({
  empleado: empleado ?? '',
  tipo: TIPOS_DOCUMENTO_PERSONAL[0],
  fecha: new Date().toISOString().slice(0, 10),
  fechaVencimiento: '',
  notas: '',
  nombreArchivo: '',
  mimeType: '',
  contenido: null,
});

export default function DocumentosPersonalTab({ onChanged }) {
  const [documentos, setDocumentos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setDocumentos(await getDocumentosPersonal());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    getEmpleados().then((emps) => {
      const activos = emps.filter((e) => e.estado === 'Activo');
      setEmpleados(activos);
      setForm(emptyForm(activos[0]?.nombre));
    });
  }, []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El archivo supera los 8MB permitidos.');
      return;
    }
    const contenido = await fileToBase64(file);
    setForm((f) => ({ ...f, contenido, nombreArchivo: file.name, mimeType: file.type || 'application/octet-stream' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.empleado || !form.contenido) {
      setError('Selecciona un trabajador y adjunta un archivo.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await subirDocumentoPersonal({ ...form, fechaVencimiento: form.fechaVencimiento || null });
      setForm(emptyForm(form.empleado));
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo subir el documento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleView(id) {
    setViewingId(id);
    try {
      const doc = await getArchivoPersonal(id);
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

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este documento?')) return;
    await eliminarDocumentoPersonal(id);
    await refresh();
    onChanged();
  }

  const filtrados = documentos.filter((d) => !filtroEmpleado || d.empleado === filtroEmpleado);
  const trabajadores = [...new Set(documentos.map((d) => d.empleado))];

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-3">
        <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los trabajadores</option>
          {trabajadores.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Trabajador</th>
                <th className="text-left font-medium px-4 py-2.5">Tipo</th>
                <th className="text-left font-medium px-4 py-2.5">Fecha</th>
                <th className="text-left font-medium px-4 py-2.5">Vencimiento</th>
                <th className="text-left font-medium px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{d.empleado}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.tipo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{new Date(d.fecha).toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{d.fechaVencimiento ? new Date(d.fechaVencimiento).toISOString().slice(0, 10) : '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => handleView(d.id)} disabled={viewingId === d.id} className="text-slate-500 hover:text-sky-700 p-1">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {puedeEliminar('prevencion') && (
                        <button onClick={() => handleDelete(d.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtrados.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">Sin documentos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {puedeCrear('prevencion') && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5 h-fit">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5" /> Nuevo documento
          </p>
          <select value={form.empleado} onChange={(e) => setForm((f) => ({ ...f, empleado: e.target.value }))} className="input">
            {empleados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
          </select>
          <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className="input">
            {TIPOS_DOCUMENTO_PERSONAL.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Fecha</span>
            <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="input" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Vencimiento (opcional)</span>
            <input type="date" value={form.fechaVencimiento} onChange={(e) => setForm((f) => ({ ...f, fechaVencimiento: e.target.value }))} className="input" />
          </label>
          <textarea rows={2} placeholder="Notas (opcional)" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} className="input resize-none" />
          <label className="flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-md py-2 text-xs text-slate-500 hover:border-sky-400 hover:text-sky-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            {form.nombreArchivo || 'Seleccionar archivo (máx. 8MB)'}
            <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">
            {saving ? 'Guardando...' : 'Guardar documento'}
          </button>
        </form>
      )}
    </div>
  );
}
