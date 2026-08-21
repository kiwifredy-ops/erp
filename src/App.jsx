import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModulePlaceholder from './pages/ModulePlaceholder';
import RRHHModule from './pages/modules/rrhh/RRHHModule';
import AlmacenModule from './pages/modules/almacen/AlmacenModule';
import GastosModule from './pages/modules/gastos/GastosModule';
import AsistenciaModule from './pages/modules/asistencia/AsistenciaModule';
import FlotaModule from './pages/modules/flota/FlotaModule';
import AbastecimientoModule from './pages/modules/abastecimiento/AbastecimientoModule';
import ContabilidadModule from './pages/modules/contabilidad/ContabilidadModule';
import TicketsModule from './pages/modules/tickets/TicketsModule';
import ClientesModule from './pages/modules/clientes/ClientesModule';
import UsuariosModule from './pages/modules/usuarios/UsuariosModule';
import { IMPLEMENTED_MODULES } from './lib/modules';
import { puedeVer } from './lib/authStore';

const MODULE_COMPONENTS = {
  rrhh: RRHHModule,
  almacen: AlmacenModule,
  gastos: GastosModule,
  asistencia: AsistenciaModule,
  flota: FlotaModule,
  abastecimiento: AbastecimientoModule,
  contabilidad: ContabilidadModule,
  tickets: TicketsModule,
  clientes: ClientesModule,
  usuarios: UsuariosModule,
};

function AccesoDenegado() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-24">
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
        <ShieldOff className="w-6 h-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-800">Sin acceso</h1>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">No tienes permiso para ver este módulo. Si crees que deberías tenerlo, contacta a un administrador.</p>
    </div>
  );
}

function ModuleRoute() {
  const { moduleId } = useParams();
  if (!puedeVer(moduleId)) return <AccesoDenegado />;
  const Component = IMPLEMENTED_MODULES.includes(moduleId) ? MODULE_COMPONENTS[moduleId] : null;
  return Component ? <Component /> : <ModulePlaceholder />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/modulos/:moduleId" element={<ModuleRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
