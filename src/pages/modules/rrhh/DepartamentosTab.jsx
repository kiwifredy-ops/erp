import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import { getDepartamentosResumen, DEPARTAMENTOS } from '../../../lib/rrhhStore';

export default function DepartamentosTab() {
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDepartamentosResumen()
      .then(setResumen)
      .finally(() => setLoading(false));
  }, []);

  const porDepartamento = DEPARTAMENTOS.map((depto) => resumen.find((r) => r.departamento === depto) ?? { departamento: depto, total: 0, activos: 0, cargos: [] });

  if (loading) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {porDepartamento.map((r) => (
        <div key={r.departamento} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                <Users2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.departamento}</p>
                <p className="text-xs text-slate-500">{r.total} empleados · {r.activos} activos</p>
              </div>
            </div>
          </div>

          {r.cargos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.cargos.map((c) => (
                <span key={c} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}

          {r.total === 0 && (
            <p className="text-xs text-slate-400 mt-3">Sin empleados asignados actualmente.</p>
          )}
        </div>
      ))}
    </div>
  );
}
