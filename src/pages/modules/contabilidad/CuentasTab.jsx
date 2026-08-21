import { useEffect, useState } from 'react';
import { Plus, X, Landmark, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { getCuentas, crearCuenta, registrarMovimiento, formatCLP, TIPOS_CUENTA, CATEGORIAS_MOVIMIENTO } from '../../../lib/contabilidadStore';

export default function CuentasTab() {
  const [cuentas, setCuentas] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  async function refresh() {
    setCuentas(await getCuentas());
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = cuentas.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md px-3 py-2">
          <Plus className="w-4 h-4" /> Nueva cuenta bancaria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuentas.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Landmark className="w-4 h-4" />
              <p className="text-xs font-medium text-slate-500">{c.banco} · {c.tipo}</p>
            </div>
            <p className="text-sm font-semibold text-slate-800">{c.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.numeroCuenta}</p>
            <p className="text-xl font-semibold text-slate-800 mt-3">{formatCLP(c.saldoActual)}</p>
          </button>
        ))}
        {cuentas.length === 0 && <p className="text-sm text-slate-400">Sin cuentas bancarias registradas.</p>}
      </div>

      {showCreate && (
        <CreateCuentaModal onClose={() => setShowCreate(false)} onCreated={() => { refresh(); setShowCreate(false); }} />
      )}

      {selected && (
        <CuentaDrawer cuenta={selected} onClose={() => setSelectedId(null)} onChanged={refresh} />
      )}
    </div>
  );
}

function CreateCuentaModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', banco: '', numeroCuenta: '', tipo: TIPOS_CUENTA[0], saldoInicial: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await crearCuenta(form);
      onCreated();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la cuenta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">Nueva cuenta bancaria</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nombre de la cuenta</span>
            <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} className="input" placeholder="Ej. Cuenta Corriente Principal" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Banco</span>
            <input required value={form.banco} onChange={(e) => set('banco', e.target.value)} className="input" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">N° de cuenta</span>
              <input required value={form.numeroCuenta} onChange={(e) => set('numeroCuenta', e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Tipo</span>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                {TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Saldo inicial (CLP)</span>
            <input type="number" min="0" value={form.saldoInicial} onChange={(e) => set('saldoInicial', e.target.value)} className="input" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded-md text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-medium">{saving ? 'Guardando...' : 'Registrar cuenta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CuentaDrawer({ cuenta, onClose, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    setError('');
    setSaving(true);
    try {
      await registrarMovimiento(cuenta.id, {
        fecha: form.get('fecha'),
        tipo: form.get('tipo'),
        categoria: form.get('categoria'),
        descripcion: form.get('descripcion'),
        monto: form.get('monto'),
      });
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(err.message || 'No se pudo registrar el movimiento.');
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
            <h2 className="text-sm font-semibold text-slate-800">{cuenta.nombre}</h2>
            <p className="text-xs text-slate-500">{cuenta.banco} · {cuenta.numeroCuenta}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500">Saldo actual</p>
            <p className="text-2xl font-semibold text-slate-800">{formatCLP(cuenta.saldoActual)}</p>
          </div>

          <button onClick={() => setShowForm((v) => !v)} className="w-full text-xs font-medium text-sky-700 border border-sky-200 rounded-md py-1.5 hover:bg-sky-50">
            Registrar movimiento manual
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <input type="date" name="fecha" required defaultValue={new Date().toISOString().slice(0, 10)} className="input" />
              <select name="tipo" className="input">
                <option value="Egreso">Egreso</option>
                <option value="Ingreso">Ingreso</option>
              </select>
              <select name="categoria" className="input">
                {CATEGORIAS_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input name="descripcion" required placeholder="Descripción" className="input" />
              <input type="number" name="monto" min="1" required placeholder="Monto" className="input" />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button type="submit" disabled={saving} className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2">{saving ? 'Guardando...' : 'Registrar'}</button>
            </form>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Movimientos</p>
            <ul className="space-y-1.5">
              {cuenta.movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {m.tipo === 'Ingreso' ? <ArrowUpCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate">{m.descripcion}</p>
                      <p className="text-xs text-slate-500">{new Date(m.fecha).toISOString().slice(0, 10)} · {m.categoria}</p>
                    </div>
                  </div>
                  <span className={`font-medium shrink-0 ${m.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.tipo === 'Ingreso' ? '+' : '-'}{formatCLP(m.monto)}
                  </span>
                </li>
              ))}
              {cuenta.movimientos.length === 0 && <p className="text-xs text-slate-400">Sin movimientos registrados.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
