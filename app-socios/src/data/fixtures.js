// Local demonstration data from the approved agenda; no database connection.
export const ACTIVIDADES = [
  { id: 1, nombre: 'Fútbol infantil', disciplina: 'Fútbol', profesor: 'Diego Ferreyra', dias: [1, 3], horario: '18:00', edadMinima: 6, edadMaxima: 12, cupoMaximo: 40, cuotaMensual: 18000, ocupadosIniciales: 18 },
  { id: 2, nombre: 'Vóley mixto', disciplina: 'Vóley', profesor: 'Laura Ceballos', dias: [2, 4], horario: '19:00', edadMinima: 13, edadMaxima: 60, cupoMaximo: 24, cuotaMensual: 20000, ocupadosIniciales: 12 },
  { id: 3, nombre: 'Básquet juvenil', disciplina: 'Básquet', profesor: 'Martín Oviedo', dias: [1, 5], horario: '19:30', edadMinima: 12, edadMaxima: 17, cupoMaximo: 20, cuotaMensual: 19000, ocupadosIniciales: 10 },
  { id: 4, nombre: 'Natación', disciplina: 'Natación', profesor: 'Sofía Bustos', dias: [2, 4], horario: '17:00', edadMinima: 5, edadMaxima: 70, cupoMaximo: 30, cuotaMensual: 26000, ocupadosIniciales: 20 },
  { id: 5, nombre: 'Patín artístico', disciplina: 'Patín', profesor: 'Carla Peralta', dias: [3, 5], horario: '17:30', edadMinima: 5, edadMaxima: 15, cupoMaximo: 25, cuotaMensual: 21000, ocupadosIniciales: 14 },
  { id: 6, nombre: 'Ajedrez', disciplina: 'Ajedrez', profesor: 'Raúl Giménez', dias: [6], horario: '10:00', edadMinima: 8, edadMaxima: 99, cupoMaximo: 16, cuotaMensual: 9000, ocupadosIniciales: 8 },
  { id: 7, nombre: 'Funcional adultos', disciplina: 'Fitness', profesor: 'Paula Luna', dias: [1, 3, 5], horario: '20:30', edadMinima: 18, edadMaxima: 65, cupoMaximo: 30, cuotaMensual: 22000, ocupadosIniciales: 16 },
  { id: 8, nombre: 'Yoga', disciplina: 'Bienestar', profesor: 'Inés Arguello', dias: [2, 4], horario: '09:00', edadMinima: 16, edadMaxima: 99, cupoMaximo: 15, cuotaMensual: 17000, ocupadosIniciales: 14 },
];

export const SOCIOS = [
  { dni: '32456789', nombre: 'Camila', apellido: 'Ludueña', fechaNacimiento: '1995-11-25', estadoCuota: 'AL_DIA', actividadesIniciales: [4, 7, 8] },
  { dni: '35345678', nombre: 'Bruno', apellido: 'Castro', fechaNacimiento: '2008-02-19', estadoCuota: 'MOROSO', actividadesIniciales: [] },
  { dni: '45123456', nombre: 'Thiago', apellido: 'Molina', fechaNacimiento: '2018-04-12', estadoCuota: 'AL_DIA', actividadesIniciales: [] },
];

export const DIAS = [
  { id: 0, nombre: 'Todos los días', corto: '' },
  { id: 1, nombre: 'Lunes', corto: 'Lun' },
  { id: 2, nombre: 'Martes', corto: 'Mar' },
  { id: 3, nombre: 'Miércoles', corto: 'Mié' },
  { id: 4, nombre: 'Jueves', corto: 'Jue' },
  { id: 5, nombre: 'Viernes', corto: 'Vie' },
  { id: 6, nombre: 'Sábado', corto: 'Sáb' },
];
