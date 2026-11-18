import { calcularCuotaMensual, esDniValido, resumenCuota } from './club';

const muestra = [
  { id: 4, nombre: 'Natación', cuotaMensual: 26000 },
  { id: 7, nombre: 'Funcional adultos', cuotaMensual: 22000 },
  { id: 8, nombre: 'Yoga', cuotaMensual: 17000 },
];

describe('RN6: calcularCuotaMensual en src/utils', () => {
  test('con 0 actividades devuelve 0', () => {
    expect(calcularCuotaMensual([])).toBe(0);
  });

  test('con 1 actividad no aplica descuento', () => {
    expect(calcularCuotaMensual(muestra.slice(0, 1))).toBe(26000);
  });

  test('con 2 actividades aplica 10% de descuento', () => {
    expect(calcularCuotaMensual(muestra.slice(0, 2))).toBe(43200);
  });

  test('con 3 actividades aplica 15% de descuento', () => {
    expect(calcularCuotaMensual(muestra)).toBe(55250);
    expect(resumenCuota(muestra)).toEqual({
      base: 65000,
      porcentaje: 15,
      bonificacion: 9750,
      total: 55250,
    });
  });
});

describe('RN7: esDniValido en src/utils', () => {
  test.each(['1234567', '32456789'])('acepta DNI válido de 7 u 8 dígitos: %s', dni => {
    expect(esDniValido(dni)).toBe(true);
  });

  test('rechaza DNI con puntos', () => {
    expect(esDniValido('12.345.678')).toBe(false);
  });

  test('rechaza DNI con letras', () => {
    expect(esDniValido('abc12345')).toBe(false);
  });

  test('rechaza DNI con 6 dígitos', () => {
    expect(esDniValido('123456')).toBe(false);
  });

  test('rechaza DNI con 9 dígitos', () => {
    expect(esDniValido('123456789')).toBe(false);
  });

  test('rechaza cadena vacía o con espacios', () => {
    expect(esDniValido('')).toBe(false);
    expect(esDniValido(' 32456789')).toBe(false);
  });
});
