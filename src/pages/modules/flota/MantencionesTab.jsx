import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getVehiculos } from '../../../lib/flotaStore';

export default function MantencionesTab() {
  const vehiculos = useMemo(() => getVehiculos(), []);

  const ordenados = [...vehiculos]
    .filter((v) => v.estado !== 'Fuera de servicio')
    .map((v) => ({ ...v, kmRestantes: v.proximaMantencionKm - v.kilometraje }))
    .sort((a, b) => a.kmRestantes - b.kmRestantes);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Vehículo</th>
            <th className="text-left font-medium px-4 py-2.5">Kilometraje actual</th>
            <th className="text-left font-medium px-4 py-2.5">Próxima mantención</th>
            <th className="text-left font-medium px-4 py-2.5">Km restantes</th>
            <th className="text-left font-medium px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ordenados.map((v) => {
            const urgente = v.kmRestantes <= 2000;
            return (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{v.patente} · {v.marca} {v.modelo}</td>
                <td className="px-4 py-2.5 text-slate-600">{v.kilometraje.toLocaleString('es-CL')} km</td>
                <td className="px-4 py-2.5 text-slate-600">{v.proximaMantencionKm.toLocaleString('es-CL')} km</td>
                <td className="px-4 py-2.5 text-slate-600">{v.kmRestantes.toLocaleString('es-CL')} km</td>
                <td className="px-4 py-2.5">
                  {urgente && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded w-fit">
                      <AlertTriangle className="w-3 h-3" /> Próxima
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
