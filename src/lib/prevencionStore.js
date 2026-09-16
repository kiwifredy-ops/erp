import { api } from './api';

export const TIPOS_DOCUMENTO_EMPRESA = [
  'Reglamento Interno de Higiene y Seguridad',
  'Matriz de Identificación de Peligros (IPER)',
  'Programa de Prevención Anual',
  'Certificado de Afiliación a Mutualidad',
  'Acta Comité Paritario',
  'Otro',
];

export const TIPOS_DOCUMENTO_PERSONAL = [
  'Obligación de Informar (ODI)',
  'Entrega de EPP',
  'Examen Ocupacional',
  'Capacitación',
  'Otro',
];

export const TIPOS_ACCIDENTE = ['Accidente del Trabajo', 'Accidente de Trayecto', 'Incidente sin lesión', 'Enfermedad Profesional'];

export const GRAVEDADES = ['Leve', 'Grave', 'Fatal'];

const NEXT_ESTADO_ACCIDENTE = { 'En investigación': ['Cerrado'], Cerrado: [] };
export function getNextEstadosAccidente(estado) {
  return NEXT_ESTADO_ACCIDENTE[estado] ?? [];
}

// --- Documentos de la empresa ---------------------------------------------

export function getDocumentosEmpresa() {
  return api('/prevencion/documentos-empresa');
}

export function subirDocumentoEmpresa(data) {
  return api('/prevencion/documentos-empresa', { method: 'POST', body: data });
}

export function getArchivoEmpresa(id) {
  return api(`/prevencion/documentos-empresa/${id}/archivo`);
}

export function eliminarDocumentoEmpresa(id) {
  return api(`/prevencion/documentos-empresa/${id}`, { method: 'DELETE' });
}

// --- Documentos por trabajador ---------------------------------------------

export function getDocumentosPersonal(empleado) {
  return api(`/prevencion/documentos-personal${empleado ? `?empleado=${encodeURIComponent(empleado)}` : ''}`);
}

export function subirDocumentoPersonal(data) {
  return api('/prevencion/documentos-personal', { method: 'POST', body: data });
}

export function getArchivoPersonal(id) {
  return api(`/prevencion/documentos-personal/${id}/archivo`);
}

export function eliminarDocumentoPersonal(id) {
  return api(`/prevencion/documentos-personal/${id}`, { method: 'DELETE' });
}

// --- Accidentes e incidentes ------------------------------------------------

export function getAccidentes() {
  return api('/prevencion/accidentes');
}

export function crearAccidente(data) {
  return api('/prevencion/accidentes', { method: 'POST', body: data });
}

export function getInformeAccidente(id) {
  return api(`/prevencion/accidentes/${id}/informe`);
}

export function cambiarEstadoAccidente(id, estado, motivo) {
  return api(`/prevencion/accidentes/${id}/estado`, { method: 'POST', body: { estado, motivo } });
}

// --- Alertas -----------------------------------------------------------------

export function getAlertasVencimiento() {
  return api('/prevencion/alertas');
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
