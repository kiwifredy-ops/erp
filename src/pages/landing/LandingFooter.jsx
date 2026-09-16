import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
        <span>© {new Date().getFullYear()} OFEK Group · ERP Sistema de Gestión Empresarial</span>
        <Link to="/login" className="text-white/60 hover:text-white font-medium">¿Ya eres cliente? Ingresa aquí</Link>
      </div>
    </footer>
  );
}
