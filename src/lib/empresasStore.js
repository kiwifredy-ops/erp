import { apiPlataforma } from './apiPlataforma';

export const ESTADOS_EMPRESA = ['Activa', 'Suspendida', 'Bloqueada', 'Eliminada'];

export function getEmpresas() {
  return apiPlataforma('/empresas');
}

export function getEmpresa(id) {
  return apiPlataforma(`/empresas/${id}`);
}

export function crearEmpresa(data) {
  return apiPlataforma('/empresas', { method: 'POST', body: data });
}

export function getUsuariosEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/usuarios`);
}

export function crearUsuarioEmpresa(id, data) {
  return apiPlataforma(`/empresas/${id}/usuarios`, { method: 'POST', body: data });
}

export function bloquearEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/bloquear`, { method: 'POST' });
}

export function suspenderEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/suspender`, { method: 'POST' });
}

export function reactivarEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/reactivar`, { method: 'POST' });
}

export function eliminarEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/eliminar`, { method: 'POST' });
}

export function getModulosEmpresa(id) {
  return apiPlataforma(`/empresas/${id}/modulos`);
}

export function toggleModuloEmpresa(id, moduloId, habilitado) {
  return apiPlataforma(`/empresas/${id}/modulos`, { method: 'PATCH', body: { moduloId, habilitado } });
}

export function actualizarLogoEmpresa(id, logo, logoMimeType) {
  return apiPlataforma(`/empresas/${id}/logo`, { method: 'PATCH', body: { logo, logoMimeType } });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
