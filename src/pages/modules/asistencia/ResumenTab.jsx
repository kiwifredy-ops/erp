import { useEffect, useState } from 'react';
import { resumenPorEmpleado } from '../../../lib/asistenciaStore';

export default function ResumenTab() {
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resumenPorEmpleado()
      .then(setResumen)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Cargando...</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Empleado</th>
            <th className="text-left font-medium px-4 py-2.5">Días registrados</th>
            <th className="text-left font-medium px-4 py-2.5">Atrasos</th>
            <th className="text-left font-medium px-4 py-2.5">Ausencias</th>
            <th className="text-left font-medium px-4 py-2.5">Horas totales</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resumen.map((r) => (
            <tr key={r.empleado} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium text-slate-800">{r.empleado}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.diasRegistrados}</td>
              <td className="px-4 py-2.5">
                {r.atrasos > 0 ? <span className="text-amber-600 font-medium">{r.atrasos}</span> : <span className="text-slate-400">0</span>}
              </td>
              <td className="px-4 py-2.5">
                {r.ausencias > 0 ? <span className="text-red-600 font-medium">{r.ausencias}</span> : <span className="text-slate-400">0</span>}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{r.horasTotales.toFixed(1)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
