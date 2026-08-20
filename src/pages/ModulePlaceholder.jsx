import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { getModule } from '../lib/modules';

export default function ModulePlaceholder() {
  const { moduleId } = useParams();
  const mod = getModule(moduleId);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-24">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
        <Clock className="w-6 h-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-800">{mod?.nombre ?? 'Módulo'}</h1>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        Este módulo está planificado y se construirá en una próxima etapa del desarrollo.
      </p>
    </div>
  );
}
