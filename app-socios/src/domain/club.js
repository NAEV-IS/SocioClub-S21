import { SOCIOS } from '../data/fixtures';

export function esDniValido(dni) {
  return typeof dni === 'string' && /^[0-9]{7,8}$/.test(dni);
}

export function calcularEdad(fechaNacimiento, hoy = new Date()) {
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  const antesDelCumpleanios = hoy.getMonth() + 1 < mes ||
    (hoy.getMonth() + 1 === mes && hoy.getDate() < dia);
  return hoy.getFullYear() - anio - Number(antesDelCumpleanios);
}

export function cupoDisponible(actividad, inscripciones, socios = SOCIOS) {
  const iniciales = socios.filter(socio => socio.actividadesIniciales.includes(actividad.id)).length;
  const actuales = Object.values(inscripciones).filter(ids => ids.includes(actividad.id)).length;
  const ocupados = Math.max(0, actividad.ocupadosIniciales - iniciales + actuales);
  return Math.max(0, actividad.cupoMaximo - ocupados);
}

export function obtenerMotivosInscripcion(socio, actividad, inscripciones, hoy = new Date(), socios = SOCIOS) {
  if (!socio) return [{ regla: 'SOCIO', mensaje: 'Primero ingresá con un DNI de ejemplo.' }];
  if (!actividad) return [{ regla: 'ACTIVIDAD', mensaje: 'No encontramos esta actividad.' }];
  const activas = inscripciones[socio.dni] || [];
  const motivos = [];
  const edad = calcularEdad(socio.fechaNacimiento, hoy);
  if (cupoDisponible(actividad, inscripciones, socios) === 0) {
    motivos.push({ regla: 'RN1', mensaje: 'Cupo completo. No hay lugares disponibles.' });
  }
  if (activas.includes(actividad.id)) {
    motivos.push({ regla: 'RN2', mensaje: 'Ya tenés una inscripción activa en esta actividad.' });
  }
  if (edad < actividad.edadMinima || edad > actividad.edadMaxima) {
    motivos.push({ regla: 'RN3', mensaje: `Tenés ${edad} años. Esta actividad es para edades de ${actividad.edadMinima} a ${actividad.edadMaxima} años.` });
  }
  if (socio.estadoCuota === 'MOROSO') {
    motivos.push({ regla: 'RN4', mensaje: 'Tu cuota figura pendiente (MOROSO). Regularizá tu situación con el club antes de una nueva inscripción.' });
  }
  if (activas.length >= 3) {
    motivos.push({ regla: 'RN5', mensaje: 'Alcanzaste el máximo de 3 actividades activas. Podés cancelar una desde Mis actividades.' });
  }
  return motivos;
}

export function resumenCuota(actividades) {
  const base = actividades.reduce((suma, actividad) => suma + actividad.cuotaMensual, 0);
  const porcentaje = actividades.length === 3 ? 15 : actividades.length === 2 ? 10 : 0;
  const bonificacion = Math.round(base * porcentaje) / 100;
  return { base, porcentaje, bonificacion, total: Math.round((base - bonificacion) * 100) / 100 };
}

export function calcularCuotaMensual(actividades) {
  return resumenCuota(actividades).total;
}
