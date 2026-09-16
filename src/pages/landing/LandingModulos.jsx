import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { MODULES } from '../../lib/modules';
import { MODULO_DETALLE } from './moduloDetalle';

function ModuloModal({ modulo, onClose }) {
  const Icon = modulo.icon;
  const detalle = MODULO_DETALLE[modulo.id];

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#101E1C] border border-white/10 rounded-2xl p-6 sm:p-7">
        <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="w-11 h-11 rounded-xl bg-[#14302F] text-[#57B4C0] flex items-center justify-center mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-white pr-8">{modulo.nombre}</h3>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">{detalle?.resumen ?? modulo.descripcion}</p>
        {detalle?.funciones && (
          <ul className="mt-5 flex flex-col gap-3">
            {detalle.funciones.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="w-4.5 h-4.5 rounded-full bg-[#14302F] text-[#57B4C0] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function LandingModulos() {
  const [seleccionado, setSeleccionado] = useState(null);

  return (
    <section id="modulos" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 border-t border-white/10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-white">Los 12 módulos del sistema</h2>
      <p className="mt-2 text-white/60 max-w-2xl">
        Cada plan habilita un subconjunto de estos módulos — haz clic en uno para ver su funcionalidad en detalle.
      </p>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setSeleccionado(m)}
              className="text-left bg-[#101E1C] border border-white/10 hover:border-[#57B4C0]/40 rounded-2xl p-5 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#14302F] text-[#57B4C0] flex items-center justify-center mb-3.5">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">{m.nombre}</h3>
              <p className="mt-1.5 text-[13px] text-white/55 leading-relaxed">{m.descripcion}</p>
            </button>
          );
        })}
      </div>

      {seleccionado && <ModuloModal modulo={seleccionado} onClose={() => setSeleccionado(null)} />}
    </section>
  );
}
