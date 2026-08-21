import { useState } from 'react';
import { X, Plus, Trash2, Paperclip } from 'lucide-react';
import { crearRendicion, CATEGORIAS_GASTO, TARIFA_KM, fileToBase64 } from '../../../lib/gastosStore';

const emptyLinea = () => ({
  categoria: CATEGORIAS_GASTO[0],
  monto: '',
  kilometros: '',
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  comprobante: null,
  comprobanteNombre: '',
});

const MAX_BYTES = 6 * 1024 * 1024;

export default function RendicionModal({ empleados, onClose, onCreated }) {
  const [tecnico, setTecnico] = useState(empleados[0]?.nombre ?? '');
  const [lineas, setLineas] = useState([emptyLinea()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setLinea(i, field, value) {
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function setCategoria(i, categoria) {
    setLineas((ls) => ls.map((l, idx) => {
      if (idx !== i) return l;
      if (categoria === 'Kilometraje') return { ...l, categoria, monto: l.kilometros ? String(Number(l.kilometros) * TARIFA_KM) : '' };
      return { ...l, categoria };
    }));
  }

  function setKilometros(i, km) {
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, kilometros: km, monto: km ? String(Number(km) * TARIFA_KM) : '' } : l)));
  }

  async function setComprobante(i, file) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('El comprobante supera los 6MB permitidos.');
      return;
    }
    const contenido = await fileToBase64(file);
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, comprobante: contenido, comprobanteNombre: file.name } : l)));
  }

  function addLinea() {
    setLineas((ls) => [...ls, emptyLinea()]);
  }

  function removeLinea(i) {
    setLineas((ls) => ls.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validLineas = lineas.filter((l) => l.monto && l.descripcion);
    if (!tecnico || validLineas.length === 0) return;
    setError('');
    setSaving(true);
    try {
      await crearRendicion({ tecnico, fecha: new Date().toISOString().slice(0, 10), lineas: validLineas });
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo enviar la rendición.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva rendición de gastos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Técnico</span>
            <select value={tecnico} onChange={(e) => setTecnico(e.target.value)} className="input">
              {empleados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </label>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ítems de gasto</p>
            {lineas.map((l, i) => (
              <div key={i} className="border border-slate-200 rounded-md p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select value={l.categoria} onChange={(e) => setCategoria(i, e.target.value)} className="input">
                    {CATEGORIAS_GASTO.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {l.categoria === 'Kilometraje' ? (
                    <input type="number" min="0" placeholder="Km recorridos" value={l.kilometros} onChange={(e) => setKilometros(i, e.target.value)} className="input" />
                  ) : (
                    <input type="number" min="0" placeholder="Monto (CLP)" value={l.monto} onChange={(e) => setLinea(i, 'monto', e.target.value)} className="input" />
                  )}
                </div>
                {l.categoria === 'Kilometraje' && l.kilometros && (
                  <p className="text-xs text-slate-500">{l.kilometros} km × ${TARIFA_KM}/km = ${Number(l.monto).toLocaleString('es-CL')}</p>
                )}
                <input placeholder="Descripción" value={l.descripcion} onChange={(e) => setLinea(i, 'descripcion', e.target.value)} className="input" />
                <div className="flex items-center justify-between gap-2">
                  <input type="date" value={l.fecha} onChange={(e) => setLinea(i, 'fecha', e.target.value)} className="input w-auto" />
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700 cursor-pointer">
                      <Paperclip className="w-3.5 h-3.5" />
                      {l.comprobanteNombre ? l.comprobanteNombre.slice(0, 14) : 'Adjuntar boleta'}
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => setComprobante(i, e.target.files?.[0])} className="hidden" />
                    </label>
                    {lineas.length > 1 && (
                      <button type="button" onClick={() => removeLinea(i)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addLinea} className="flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar ítem
            </button>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Enviando...' : 'Enviar rendición'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
