import { useState } from 'react';
import { Check } from 'lucide-react';
import { getModule } from '../../lib/modules';

// Mismo orden y contenido validados en la tabla de precios (pricing-plans.html).
const ORDEN_MODULOS = ['rrhh', 'asistencia', 'usuarios', 'gastos', 'flota', 'abastecimiento', 'clientes', 'prevencion', 'almacen', 'contabilidad', 'tickets', 'mantenimiento'];

const PLANES = [
  {
    id: 'basico',
    nombre: 'Básico',
    para: 'Para empezar a ordenar personal y asistencia',
    monthly: 29900,
    annual: 24900,
    seats: 'Hasta 5 usuarios incluidos · $2.000 c/u adicional',
    modulos: ['rrhh', 'asistencia', 'usuarios'],
  },
  {
    id: 'operaciones',
    nombre: 'Operaciones',
    para: 'Para equipos con gente en terreno y gastos que rendir',
    monthly: 69900,
    annual: 58300,
    seats: 'Hasta 15 usuarios incluidos · $2.500 c/u adicional',
    modulos: ['rrhh', 'asistencia', 'usuarios', 'gastos', 'flota', 'abastecimiento', 'clientes', 'prevencion'],
    featured: true,
  },
  {
    id: 'empresarial',
    nombre: 'Empresarial',
    para: 'La operación completa, de terreno a finanzas',
    monthly: 149900,
    annual: 124900,
    seats: 'Hasta 30 usuarios incluidos · $3.000 c/u adicional',
    modulos: ORDEN_MODULOS,
  },
];

function fmt(n) {
  return '$' + n.toLocaleString('es-CL');
}

function scrollToContacto() {
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingPlanes() {
  const [anual, setAnual] = useState(false);

  return (
    <section id="planes" className="max-w-6xl mx-auto px-5 sm:px-6 py-20 border-t border-white/10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Planes y precios</h2>
          <p className="mt-2 text-white/60 max-w-xl">Precios netos, no incluyen IVA. Sin costo de puesta en marcha.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-[#16302B] border border-white/10 rounded-full p-1">
            <button
              onClick={() => setAnual(false)}
              className={`text-sm font-semibold rounded-full px-4 py-1.5 transition-colors ${!anual ? 'bg-[#57B4C0] text-[#0A1413]' : 'text-white/60'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnual(true)}
              className={`text-sm font-semibold rounded-full px-4 py-1.5 transition-colors ${anual ? 'bg-[#57B4C0] text-[#0A1413]' : 'text-white/60'}`}
            >
              Anual
            </button>
          </div>
          {anual && <span className="text-xs font-semibold text-[#6FC79A]">Ahorras el equivalente a 2 meses</span>}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {PLANES.map((plan) => {
          const precio = anual ? plan.annual : plan.monthly;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col gap-5 rounded-2xl p-7 bg-[#101E1C] border ${
                plan.featured ? 'border-[#E5AC5B] ring-2 ring-[#E5AC5B]' : 'border-white/10'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-7 bg-[#E5AC5B] text-[#2A1B04] text-[11px] font-bold uppercase tracking-wide rounded-full px-3 py-1">
                  Más elegido
                </span>
              )}
              <div>
                <h3 className="text-xl font-semibold text-white">{plan.nombre}</h3>
                <p className="text-sm text-white/50 mt-1">{plan.para}</p>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-white tabular-nums">{fmt(precio)}</span>
                  <span className="text-sm text-white/50">CLP / mes</span>
                </div>
                {anual && <p className="text-[13px] text-[#6FC79A] font-semibold mt-1">Facturado anual · equivale a {fmt(precio * 12)}/año</p>}
              </div>
              <div className="text-sm text-white/70 bg-[#16302B] rounded-lg px-3.5 py-2.5">{plan.seats}</div>
              <ul className="flex flex-col gap-2.5 text-sm">
                {ORDEN_MODULOS.map((moduloId) => {
                  const incluido = plan.modulos.includes(moduloId);
                  return (
                    <li key={moduloId} className={`flex items-start gap-2.5 ${incluido ? 'text-white' : 'text-white/30'}`}>
                      <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${incluido ? 'bg-[#14302F] text-[#57B4C0]' : ''}`}>
                        {incluido ? <Check className="w-3 h-3" /> : '—'}
                      </span>
                      {getModule(moduloId)?.nombre}
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={scrollToContacto}
                className={`mt-auto text-sm font-semibold rounded-lg px-4 py-3 transition-colors ${
                  plan.featured ? 'bg-[#0F5C6B] hover:bg-[#0B4550] text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/15'
                }`}
              >
                Elegir {plan.nombre}
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          ['Usuarios adicionales', 'Se cobran prorrateados desde la fecha en que se agregan, no desde el inicio del ciclo.'],
          ['Cambiar de plan', 'Subir de plan es inmediato; bajar de plan aplica desde el próximo ciclo de facturación.'],
          ['Aislamiento de datos', 'Cada empresa corre en su propia base de datos — no hay datos compartidos entre clientes en ningún plan.'],
          ['Implementación', 'El alta de la empresa, su primer usuario administrador y la carga de logo están incluidos, sin costo de puesta en marcha.'],
        ].map(([titulo, texto]) => (
          <div key={titulo} className="bg-[#101E1C] border border-white/10 rounded-xl p-4 text-[13px] text-white/60 leading-relaxed">
            <strong className="block text-white text-sm mb-1">{titulo}</strong>
            {texto}
          </div>
        ))}
      </div>
    </section>
  );
}
