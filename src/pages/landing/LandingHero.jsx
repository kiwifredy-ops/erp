function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingHero() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-16 pb-20">
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#82CBD3] bg-[#14302F] rounded-full px-3.5 py-1.5">
        🇨🇱 Hecho para PyMEs chilenas
      </span>
      <h1 className="mt-5 text-4xl sm:text-5xl font-semibold text-white leading-[1.08] tracking-tight max-w-2xl text-balance">
        Un ERP a la medida de <em className="italic text-[#57B4C0]">tu</em> operación, no al revés.
      </h1>
      <p className="mt-5 text-lg text-white/70 max-w-xl leading-relaxed">
        Administra personal, terreno y finanzas desde una sola plataforma. Cada empresa corre en su propia base de
        datos, con su propio logo y solo los módulos que su plan incluye.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => scrollTo('contacto')}
          className="text-sm font-semibold bg-[#C98A2E] hover:bg-[#B87A22] text-[#2A1B04] rounded-lg px-5 py-3 transition-colors"
        >
          Quiero contratar
        </button>
        <button
          onClick={() => scrollTo('planes')}
          className="text-sm font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg px-5 py-3 transition-colors"
        >
          Ver planes y precios
        </button>
      </div>
      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/50">
        <span><strong className="text-white/80 font-semibold">12</strong> módulos disponibles</span>
        <span><strong className="text-white/80 font-semibold">Base de datos propia</strong> por empresa</span>
        <span><strong className="text-white/80 font-semibold">Sin</strong> permanencia mínima</span>
      </div>
    </section>
  );
}
