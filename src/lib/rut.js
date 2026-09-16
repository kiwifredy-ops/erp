// Validación de RUT chileno (dígito verificador módulo 11) — misma lógica
// que server/src/lib/rut.js, usada aquí solo para feedback inline en el
// formulario; la validación autoritativa ocurre en el backend.
export function validarRut(rut) {
  const limpio = String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvCalculado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dvCalculado === dv;
}

export function normalizarRut(rut) {
  const limpio = String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}
