import { SOCIOS } from '../data/fixtures';
import { formatearMoneda, formatearDias, nombreCompleto } from './formato';

test('las cuotas usan pesos argentinos sin decimales en esta muestra', () => {
  expect(formatearMoneda(55250)).toBe('$\u00a055.250');
});
test('los días mantienen las abreviaturas de la agenda', () => {
  expect(formatearDias([2, 4])).toBe('Mar · Jue');
});
test('los días en formato texto del backend se muestran sin alterarse', () => {
  expect(formatearDias('Lun y Mié')).toBe('Lun y Mié');
});
test('el nombre visible combina nombre y apellido del socio', () => {
  expect(nombreCompleto(SOCIOS[0])).toBe('Camila Ludueña');
});
