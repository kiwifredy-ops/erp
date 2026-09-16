import { MODULES } from '../../lib/modules';

export default function LandingModulos() {
  return (
    <section id="modulos" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 border-t border-white/10">
      <h2 className="text-2xl sm:text-3xl font-semibold text-white">Los 11 módulos del sistema</h2>
      <p className="mt-2 text-white/60 max-w-2xl">
        Cada plan habilita un subconjunto de estos módulos — ver la comparación completa más abajo.
      </p>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="bg-[#101E1C] border border-white/10 rounded-2xl p-5">
              <div className="w-9 h-9 rounded-lg bg-[#14302F] text-[#57B4C0] flex items-center justify-center mb-3.5">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-white">{m.nombre}</h3>
              <p className="mt-1.5 text-[13px] text-white/55 leading-relaxed">{m.descripcion}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
