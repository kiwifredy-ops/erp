import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
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
import { IMPLEMENTED_MODULES } from './lib/modules';

const MODULE_COMPONENTS = {
  rrhh: RRHHModule,
  almacen: AlmacenModule,
  gastos: GastosModule,
  asistencia: AsistenciaModule,
  flota: FlotaModule,
  abastecimiento: AbastecimientoModule,
};

function ModuleRoute() {
  const { moduleId } = useParams();
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
