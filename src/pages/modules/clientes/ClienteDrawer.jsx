import { useEffect, useState } from 'react';
import { X, Mail, Phone, Pencil, Ticket, Receipt } from 'lucide-react';
import { getCliente, editarCliente, toggleClienteActivo, TIPOS_CLIENTE } from '../../../lib/clientesStore';
import { formatCLP } from '../../../lib/contabilidadStore';

const ESTADO_TICKET_STYLES = {
  Abierto: 'bg-slate-100 text-slate-600',
  Asignado: 'bg-sky-50 text-sky-700',
  'En curso': 'bg-amber-50 text-amber-700',
  Completado: 'bg-emerald-50 text-emerald-700',
  Cerrado: 'bg-slate-100 text-slate-500',
  Cancelado: 'bg-red-50 text-red-700',
};

const ESTADO_FACTURA_STYLES = {
  Pendiente: 'bg-amber-50 text-amber-700',
  Pagada: 'bg-emerald-50 text-emerald-700',
  Anulada: 'bg-slate-100 text-slate-500',
};

export default function ClienteDrawer({ clienteId, onClose, onChanged }) {
  const [cliente, setCliente] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setCliente(await getCliente(clienteId));
  }

  useEffect(() => {
    refresh();
  }, [clienteId]);

  async function handleEdit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const cambios = Object.fromEntries(form.entries());
    setError('');
    setSaving(true);
    try {
      await editarCliente(clienteId, cambios);
      setEditing(false);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cambio.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setSaving(true);
    try {
      await toggleClienteActivo(clienteId);
      await refresh();
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  if (!cliente) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{cliente.nombre}</h2>
            <p className="text-xs text-slate-500">{cliente.tipo} · {cliente.rut ?? 'Sin RUT registrado'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {cliente.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{cliente.email}</span>}
            {cliente.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{cliente.telefono}</span>}
          </div>

          {!editing ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <Row label="Dirección" value={[cliente.direccion, cliente.comuna, cliente.ciudad].filter(Boolean).join(', ') || '—'} />
              <Row label="Contacto" value={cliente.contactoNombre ? `${cliente.contactoNombre}${cliente.contactoCargo ? ' — ' + cliente.contactoCargo : ''}` : '—'} />
              <Row label="Teléfono contacto" value={cliente.contactoTelefono ?? '—'} />
              {cliente.notas && <Row label="Notas" value={cliente.notas} />}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={handleToggle} disabled={saving} className="text-xs font-medium text-slate-500 hover:underline">
                  {cliente.activo ? 'Marcar inactivo' : 'Reactivar'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEdit} className="bg-slate-50 rounded-lg p-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Nombre / Razón social</span>
                <input name="nombre" defaultValue={cliente.nombre} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Tipo</span>
                <select name="tipo" defaultValue={cliente.tipo} className="input">
                  {TIPOS_CLIENTE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">RUT</span>
                <input name="rut" defaultValue={cliente.rut ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Dirección</span>
                <input name="direccion" defaultValue={cliente.direccion ?? ''} className="input" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Comuna</span>
                  <input name="comuna" defaultValue={cliente.comuna ?? ''} className="input" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Ciudad</span>
                  <input name="ciudad" defaultValue={cliente.ciudad ?? ''} className="input" />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Teléfono</span>
                <input name="telefono" defaultValue={cliente.telefono ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Correo</span>
                <input name="email" defaultValue={cliente.email ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Contacto — nombre</span>
                <input name="contactoNombre" defaultValue={cliente.contactoNombre ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Contacto — cargo</span>
                <input name="contactoCargo" defaultValue={cliente.contactoCargo ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Contacto — teléfono</span>
                <input name="contactoTelefono" defaultValue={cliente.contactoTelefono ?? ''} className="input" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Notas</span>
                <textarea name="notas" rows={2} defaultValue={cliente.notas ?? ''} className="input" />
              </label>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-md text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={saving} className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          )}

          {cliente.tickets?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <Ticket className="w-3.5 h-3.5" /> Tickets de servicio
              </p>
              <ul className="space-y-1.5">
                {cliente.tickets.map((t) => (
                  <li key={t.id} className="bg-slate-50 rounded-md px-3 py-2 text-sm flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700">{t.folio}</p>
                      <p className="text-xs text-slate-500 truncate">{t.descripcion}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ESTADO_TICKET_STYLES[t.estado] ?? ''}`}>{t.estado}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cliente.facturasVenta?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <Receipt className="w-3.5 h-3.5" /> Facturas de venta
              </p>
              <ul className="space-y-1.5">
                {cliente.facturasVenta.map((f) => (
                  <li key={f.id} className="bg-slate-50 rounded-md px-3 py-2 text-sm flex items-center justify-between">
                    <p className="font-medium text-slate-700">{f.folio}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{formatCLP(f.montoTotal)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_FACTURA_STYLES[f.estado] ?? ''}`}>{f.estado}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(!cliente.tickets || cliente.tickets.length === 0) && (!cliente.facturasVenta || cliente.facturasVenta.length === 0) && (
            <p className="text-xs text-slate-400">Sin tickets ni facturas vinculados todavía.</p>
          )}
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
