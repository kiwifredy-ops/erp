import { useEffect, useState } from 'react';
import { Plus, X, History, Receipt, FileMinus } from 'lucide-react';
import {
  getFacturasVenta,
  crearFacturaVenta,
  registrarPagoCliente,
  crearNotaCreditoVenta,
  anularFacturaVenta,
  getCuentas,
  formatCLP,
  MEDIOS_PAGO,
  ESTADOS_FACTURA,
} from '../../../lib/contabilidadStore';

const ESTADO_STYLES = {
  Pendiente: 'bg-amber-50 text-amber-700',
  Pagada: 'bg-emerald-50 text-emerald-700',
  Anulada: 'bg-slate-100 text-slate-500',
};

export default function FacturasVentaTab() {
  const [facturas, setFacturas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [estado, setEstado] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setFacturas(await getFacturasVenta());
  }

  useEffect(() => {
    refresh();
    getCuentas().then(setCuentas);
  }, []);

  const filtered = facturas.filter((f) => !estado || f.estado === estado);
  const selected = facturas.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
          <option value="">Todos los estados</option>
          {ESTADOS_FACTURA.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva factura de venta
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Folio</th>
              <th className="text-left font-medium px-4 py-2.5">Cliente</th>
              <th className="text-left font-medium px-4 py-2.5">Emisión</th>
              <th className="text-left font-medium px-4 py-2.5">Vencimiento</th>
              <th className="text-left font-medium px-4 py-2.5">Total</th>
              <th className="text-left font-medium px-4 py-2.5">Saldo</th>
              <th className="text-left font-medium px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((f) => (
              <tr key={f.id} onClick={() => setSelectedId(f.id)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-medium text-slate-800">{f.folio}</td>
                <td className="px-4 py-2.5 text-slate-600">{f.cliente}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(f.fechaEmision).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{new Date(f.fechaVencimiento).toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatCLP(f.montoTotal)}</td>
                <td className="px-4 py-2.5 text-slate-600">{formatCLP(f.saldoPendiente)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[f.estado] ?? ''}`}>{f.estado}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">Sin facturas que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateFacturaModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <FacturaDrawer factura={selected} cuentas={cuentas} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateFacturaModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ cliente: '', fechaEmision: new Date().toISOString().slice(0, 10), fechaVencimiento: '', montoNeto: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  const neto = Number(form.montoNeto) || 0;
  const iva = Math.round(neto * 0.19);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearFacturaVenta(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la factura.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva factura de venta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Cliente</span>
            <input required value={form.cliente} onChange={(e) => set('cliente', e.target.value)} className="input" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Fecha de emisión</span>
              <input type="date" required value={form.fechaEmision} onChange={(e) => set('fechaEmision', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Fecha de vencimiento</span>
              <input type="date" required value={form.fechaVencimiento} onChange={(e) => set('fechaVencimiento', e.target.value)} className="input" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Monto neto (CLP)</span>
            <input type="number" min="0" required value={form.montoNeto} onChange={(e) => set('montoNeto', e.target.value)} className="input" />
          </label>
          {neto > 0 && (
            <p className="text-xs text-slate-500">IVA (19%): {formatCLP(iva)} — Total: {formatCLP(neto + iva)}</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar factura'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FacturaDrawer({ factura, cuentas, onClose, onChanged }) {
  const [showPago, setShowPago] = useState(false);
  const [showNC, setShowNC] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handlePago(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setError('');
    setSaving(true);
    try {
      await registrarPagoCliente(factura.id, {
        fecha: form.get('fecha'),
        monto: form.get('monto'),
        medioPago: form.get('medioPago'),
        cuentaId: form.get('cuentaId') || null,
      });
      setShowPago(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  }

  async function handleNC(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setError('');
    setSaving(true);
    try {
      await crearNotaCreditoVenta(factura.id, { fecha: form.get('fecha'), motivo: form.get('motivo'), monto: form.get('monto') });
      setShowNC(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la nota de crédito.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAnular() {
    if (!confirm('¿Anular esta factura?')) return;
    setSaving(true);
    try {
      await anularFacturaVenta(factura.id, 'Anulada manualmente');
      onChanged();
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
            <h2 className="text-sm font-semibold text-slate-800">{factura.folio}</h2>
            <p className="text-xs text-slate-500">{factura.cliente}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Estado</span><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[factura.estado] ?? ''}`}>{factura.estado}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Neto</span><span className="font-medium text-slate-800">{formatCLP(factura.montoNeto)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">IVA</span><span className="font-medium text-slate-800">{formatCLP(factura.iva)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-medium text-slate-800">{formatCLP(factura.montoTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pagado</span><span className="font-medium text-slate-800">{formatCLP(factura.montoPagado)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Saldo pendiente</span><span className="font-medium text-slate-800">{formatCLP(factura.saldoPendiente)}</span></div>
          </div>

          {factura.estado === 'Pendiente' && (
            <div className="flex gap-2">
              <button onClick={() => setShowPago((v) => !v)} className="flex-1 text-xs font-medium text-sky-700 border border-sky-200 rounded-md py-1.5 hover:bg-sky-50">Registrar pago</button>
              <button onClick={() => setShowNC((v) => !v)} className="flex-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md py-1.5 hover:bg-slate-50">Nota de crédito</button>
              <button onClick={handleAnular} disabled={saving} className="flex-1 text-xs font-medium text-red-600 border border-red-200 rounded-md py-1.5 hover:bg-red-50">Anular</button>
            </div>
          )}

          {showPago && (
            <form onSubmit={handlePago} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registrar pago recibido</p>
              <input type="date" name="fecha" required defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
              <input type="number" name="monto" min="1" max={factura.saldoPendiente} required placeholder="Monto" className="input" />
              <select name="medioPago" className="input">
                {MEDIOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select name="cuentaId" className="input">
                <option value="">Sin registrar en cuenta bancaria</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Confirmar pago'}</button>
            </form>
          )}

          {showNC && (
            <form onSubmit={handleNC} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Emitir nota de crédito</p>
              <input type="date" name="fecha" required defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
              <input name="motivo" required placeholder="Motivo" className="input" />
              <input type="number" name="monto" min="1" required placeholder="Monto" className="input" />
              <button type="submit" disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Emitir nota de crédito'}</button>
            </form>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          {factura.notasCredito.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <FileMinus className="w-3.5 h-3.5" /> Notas de crédito
              </p>
              <ul className="space-y-1.5">
                {factura.notasCredito.map((n) => (
                  <li key={n.id} className="text-sm bg-slate-50 rounded-md px-3 py-2">
                    <p className="font-medium text-slate-700">{n.folio} — {formatCLP(n.monto)}</p>
                    <p className="text-xs text-slate-500">{n.motivo}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {factura.pagos.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <Receipt className="w-3.5 h-3.5" /> Pagos recibidos
              </p>
              <ul className="space-y-1.5">
                {factura.pagos.map((p) => (
                  <li key={p.id} className="text-sm bg-slate-50 rounded-md px-3 py-2 flex justify-between">
                    <span className="text-slate-600">{new Date(p.fecha).toISOString().slice(0, 10)} · {p.medioPago}</span>
                    <span className="font-medium text-slate-800">{formatCLP(p.monto)}</span>
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
              {[...factura.bitacora].reverse().map((b) => (
                <li key={b.id} className="text-sm border-l-2 border-slate-200 pl-3">
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
