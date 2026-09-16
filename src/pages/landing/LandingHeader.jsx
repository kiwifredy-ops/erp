import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 bg-[#0A1413]/90 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F5C6B] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">OFEK Group</p>
            <p className="text-[11px] text-white/50">ERP Sistema de Gestión Empresarial</p>
          </div>
        </div>
        <Link
          to="/login"
          className="text-sm font-medium bg-[#C98A2E] hover:bg-[#B87A22] text-[#2A1B04] rounded-lg px-4 py-2 transition-colors"
        >
          Acceder
        </Link>
      </div>
    </header>
  );
}
