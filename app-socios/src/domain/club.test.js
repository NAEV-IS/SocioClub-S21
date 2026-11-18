import { ACTIVIDADES, SOCIOS } from '../data/fixtures';
import { calcularEdad, esDniValido, cupoDisponible, obtenerMotivosInscripcion, calcularCuotaMensual, resumenCuota } from './club';

const hoy = new Date('2026-11-16T12:00:00');
const actividad = id => ACTIVIDADES.find(item => item.id === id);
const inscripciones = () => Object.fromEntries(SOCIOS.map(socio => [socio.dni, [...socio.actividadesIniciales]]));
const sinActividades = () => Object.fromEntries(SOCIOS.map(socio => [socio.dni, []]));
const reglas = (socio, propuesta, estado) => obtenerMotivosInscripcion(socio, propuesta, estado, hoy).map(motivo => motivo.regla);

describe('RN7: DNI de siete u ocho dígitos', () => {
  test.each(['1234567', '32456789'])('%s es válido', dni => expect(esDniValido(dni)).toBe(true));
  test.each(['', '123456', '123456789', '12.345.678', 'abc12345', ' 32456789'])('%s es inválido', dni => expect(esDniValido(dni)).toBe(false));
});

test('la edad respeta el cumpleaños, no solamente el año', () => {
  expect(calcularEdad('2010-11-17', hoy)).toBe(15);
  expect(calcularEdad('2010-11-16', hoy)).toBe(16);
});

test('el cupo cuenta sólo selecciones activas sin duplicar las iniciales', () => {
  const estado = inscripciones();
  expect(cupoDisponible(actividad(8), estado)).toBe(1);
  estado['32456789'] = [4, 7];
  expect(cupoDisponible(actividad(8), estado)).toBe(2);
});

test('RN1: rechaza una actividad con cupo completo sin alterar las selecciones', () => {
  const estado = sinActividades();
  const copia = JSON.stringify(estado);
  expect(reglas(SOCIOS[0], { ...actividad(6), ocupadosIniciales: 16 }, estado)).toEqual(['RN1']);
  expect(JSON.stringify(estado)).toBe(copia);
});

test('RN2: rechaza una segunda inscripción activa en la misma actividad', () => {
  const estado = sinActividades();
  estado['32456789'] = [6];
  expect(reglas(SOCIOS[0], actividad(6), estado)).toEqual(['RN2']);
  expect(estado['32456789']).toEqual([6]);
});

describe('RN3: los límites de edad son inclusivos', () => {
  test.each([
    ['2014-11-16', ['RN3']],
    ['2013-11-16', []],
    ['1966-11-16', []],
    ['1965-11-16', ['RN3']],
  ])('fecha de nacimiento %s', (fechaNacimiento, esperado) => {
    expect(reglas({ ...SOCIOS[0], fechaNacimiento }, actividad(2), sinActividades())).toEqual(esperado);
  });
});

test('RN4: un socio moroso no obtiene una nueva inscripción', () => {
  expect(reglas(SOCIOS[1], actividad(6), sinActividades())).toEqual(['RN4']);
});

test('RN5: tres actividades activas impiden una cuarta', () => {
  const estado = inscripciones();
  expect(reglas(SOCIOS[0], actividad(6), estado)).toEqual(['RN5']);
  expect(estado['32456789']).toEqual([4, 7, 8]);
});

describe('RN6: cuota mensual y bonificaciones', () => {
  test.each([
    [[], 0],
    [[4], 26000],
    [[4, 7], 43200],
    [[4, 7, 8], 55250],
  ])('actividades %j', (ids, esperado) => {
    expect(calcularCuotaMensual(ACTIVIDADES.filter(item => ids.includes(item.id)))).toBe(esperado);
  });
  test('el resumen permite comprobar suma, porcentaje y bonificación', () => {
    expect(resumenCuota(ACTIVIDADES.filter(item => [4, 7, 8].includes(item.id)))).toEqual({ base: 65000, porcentaje: 15, bonificacion: 9750, total: 55250 });
  });
});
