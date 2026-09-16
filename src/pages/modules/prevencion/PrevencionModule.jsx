import { useState } from 'react';
import DocumentosEmpresaTab from './DocumentosEmpresaTab';
import DocumentosPersonalTab from './DocumentosPersonalTab';
import AccidentesTab from './AccidentesTab';
import AlertasVencimientoBanner from './AlertasVencimientoBanner';

const TABS = [
  { id: 'empresa', label: 'Documentos de la Empresa' },
  { id: 'personal', label: 'Documentos del Personal' },
  { id: 'accidentes', label: 'Accidentes e Incidentes' },
];

export default function PrevencionModule() {
  const [tab, setTab] = useState('empresa');
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Prevención de Riesgos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Documentos legales de higiene y seguridad, documentación del personal y registro de accidentes e incidentes.</p>
      </div>

      <AlertasVencimientoBanner refreshKey={refreshKey} />

      <div className="border-b border-slate-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'empresa' && <DocumentosEmpresaTab onChanged={bump} />}
      {tab === 'personal' && <DocumentosPersonalTab onChanged={bump} />}
      {tab === 'accidentes' && <AccidentesTab onChanged={bump} />}
    </div>
  );
}
