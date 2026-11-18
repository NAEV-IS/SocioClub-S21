export function esDniValido(dni) {
  return typeof dni === 'string' && /^[0-9]{7,8}$/.test(dni);
}

export function resumenCuota(actividades = []) {
  const base = actividades.reduce((suma, actividad) => suma + actividad.cuotaMensual, 0);
  const porcentaje = actividades.length === 3 ? 15 : actividades.length === 2 ? 10 : 0;
  const bonificacion = Math.round(base * porcentaje) / 100;
  return { base, porcentaje, bonificacion, total: Math.round((base - bonificacion) * 100) / 100 };
}

export function calcularCuotaMensual(actividades = []) {
  return resumenCuota(actividades).total;
}
