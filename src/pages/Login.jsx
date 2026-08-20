import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { login } from '../lib/authStore';

const DEMO_USERS = [
  'admin@empresa.com',
  'carolina.reyes@empresa.com',
  'marcelo.soto@empresa.com',
  'fernanda.vidal@empresa.com',
  'diego.herrera@empresa.com',
  'pablo.contreras@empresa.com',
  'gerencia@empresa.com',
];
const DEMO_PASSWORD = 'Demo2026!';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-sky-500 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">ERP · Sistemas de Seguridad</h1>
          <p className="text-sm text-slate-500 mt-1">Administración, almacén, gastos, asistencia, flota y abastecimiento.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-md py-2 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 mb-2">Usuarios de ejemplo (contraseña: {DEMO_PASSWORD})</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {DEMO_USERS.map((u) => (
              <li key={u}>
                <button
                  type="button"
                  onClick={() => { setEmail(u); setPassword(DEMO_PASSWORD); }}
                  className="text-[11px] text-sky-700 hover:underline"
                >
                  {u}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
