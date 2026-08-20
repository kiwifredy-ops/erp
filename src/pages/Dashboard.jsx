import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { MODULES, IMPLEMENTED_MODULES } from '../lib/modules';
import { getEmpleados } from '../lib/rrhhStore';

export default function Dashboard() {
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    getEmpleados().then(setEmpleados);
  }, []);

  const activos = empleados.filter((e) => e.estado === 'Activo').length;

  const stats = [
    { label: 'Empleados registrados', value: empleados.length },
    { label: 'Activos', value: activos },
    { label: 'Departamentos', value: new Set(empleados.map((e) => e.departamento)).size },
    { label: 'Módulos disponibles', value: `${IMPLEMENTED_MODULES.length} / ${MODULES.length}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Panel principal</h1>
        <p className="text-sm text-slate-500 mt-0.5">Vista general del sistema.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Módulos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const implemented = IMPLEMENTED_MODULES.includes(m.id);
            return (
              <Link
                key={m.id}
                to={`/modulos/${m.id}`}
                className="group bg-white border border-slate-200 rounded-lg p-4 hover:border-sky-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  {!implemented && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 mt-3">{m.nombre}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.descripcion}</p>
                <div className="flex items-center gap-1 text-xs text-sky-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Abrir <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
