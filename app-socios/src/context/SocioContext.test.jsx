import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ACTIVIDADES, SOCIOS } from '../data/fixtures';
import { calcularCuotaMensual } from '../domain/club';
import { SocioProvider, useSocio } from './SocioContext';

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-16T12:00:00'));
});
afterAll(() => jest.useRealTimers());

function Probe() {
  const club = useSocio();
  const [error, setError] = useState('');
  function ingresar(dni) {
    const resultado = club.iniciarSesion(dni);
    setError(resultado.ok ? '' : resultado.mensaje);
  }
  return <>
    <output aria-label="Socio actual">{club.socio ? club.socio.nombre + ' ' + club.socio.apellido : 'Sin socio'}</output>
    <output aria-label="Cantidad activa">{club.misActividades.length}</output>
    <output aria-label="Actividades activas">{club.misActividades.map(item => item.nombre).join(', ')}</output>
    <output aria-label="Cuota total">{calcularCuotaMensual(club.misActividades)}</output>
    <output aria-label="Cupo Yoga">{club.obtenerCupo(ACTIVIDADES[7])}</output>
    <output aria-label="Aviso">{club.aviso.mensaje}</output>
    <output aria-label="Error de ingreso">{error}</output>
    <button onClick={() => ingresar('32456789')}>Camila</button>
    <button onClick={() => ingresar('35345678')}>Bruno</button>
    <button onClick={() => ingresar('45123456')}>Thiago</button>
    <button onClick={() => ingresar('123')}>DNI inválido</button>
    <button onClick={() => ingresar('12345678')}>DNI desconocido</button>
    <button onClick={() => club.inscribir(6)}>Inscribir Ajedrez</button>
    <button onClick={() => club.inscribir(8)}>Inscribir Yoga</button>
    <button onClick={() => club.inscribir(2)}>Inscribir Vóley</button>
    <button onClick={() => club.darDeBaja(8)}>Baja Yoga</button>
  </>;
}
function montar(props = {}) {
  render(<SocioProvider {...props}><Probe /></SocioProvider>);
}
const dato = nombre => screen.getByLabelText(nombre).textContent;
const pulsar = nombre => fireEvent.click(screen.getByRole('button', { name: nombre, exact: true }));
const snapshot = () => ({
  socio: dato('Socio actual'), cantidad: dato('Cantidad activa'),
  actividades: dato('Actividades activas'), cuota: dato('Cuota total'), cupo: dato('Cupo Yoga'),
});

test('la sesión comienza sin socio y acepta un DNI local conocido', () => {
  montar();
  expect(dato('Socio actual')).toBe('Sin socio');
  pulsar('Camila');
  expect(dato('Socio actual')).toBe('Camila Ludueña');
  expect(dato('Cantidad activa')).toBe('3');
  expect(dato('Cuota total')).toBe('55250');
});

test('DNI inválido/desconocido no cambia el socio, las actividades ni los contadores', () => {
  montar({ dniInicial: '32456789' });
  const antes = snapshot();
  pulsar('DNI inválido');
  expect(dato('Error de ingreso')).toMatch(/7 u 8 dígitos/);
  expect(snapshot()).toEqual(antes);
  pulsar('DNI desconocido');
  expect(dato('Error de ingreso')).toMatch(/No encontramos/);
  expect(snapshot()).toEqual(antes);
});

test('RN1: Context rechaza un cupo completo sin modificar el estado observable', () => {
  montar({
    dniInicial: '32456789',
    socios: [{ ...SOCIOS[0], actividadesIniciales: [] }],
    actividades: [{ ...ACTIVIDADES[5], cupoMaximo: 8, ocupadosIniciales: 8 }],
  });
  const antes = snapshot();
  pulsar('Inscribir Ajedrez');
  expect(dato('Aviso')).toMatch(/Cupo completo/);
  expect(snapshot()).toEqual(antes);
});

test('RN2: Context no duplica una inscripción activa', () => {
  montar({ dniInicial: '32456789' });
  const antes = snapshot();
  pulsar('Inscribir Yoga');
  expect(dato('Aviso')).toMatch(/Ya tenés una inscripción activa/);
  expect(snapshot()).toEqual(antes);
});

test('RN3: Context rechaza a un socio fuera del rango de edad', () => {
  montar({ dniInicial: '45123456' });
  const antes = snapshot();
  pulsar('Inscribir Vóley');
  expect(dato('Aviso')).toMatch(/años/);
  expect(snapshot()).toEqual(antes);
});

test('RN4: Context rechaza nuevas actividades para un socio moroso', () => {
  montar({ dniInicial: '35345678' });
  const antes = snapshot();
  pulsar('Inscribir Ajedrez');
  expect(dato('Aviso')).toMatch(/MOROSO/);
  expect(snapshot()).toEqual(antes);
});

test('RN5: Context no agrega una cuarta actividad', () => {
  montar({ dniInicial: '32456789' });
  const antes = snapshot();
  pulsar('Inscribir Ajedrez');
  expect(dato('Aviso')).toMatch(/máximo de 3 actividades/);
  expect(snapshot()).toEqual(antes);
});

test('baja/alta recalculan cuota y cupos; cambiar socio no transfiere selecciones', () => {
  montar({ dniInicial: '32456789' });
  pulsar('Baja Yoga');
  expect(dato('Cantidad activa')).toBe('2');
  expect(dato('Cuota total')).toBe('43200');
  expect(dato('Cupo Yoga')).toBe('2');
  pulsar('Inscribir Ajedrez');
  expect(dato('Cantidad activa')).toBe('3');
  expect(dato('Cuota total')).toBe('48450');
  expect(dato('Actividades activas')).toMatch(/Ajedrez/);
  expect(dato('Actividades activas')).not.toMatch(/Yoga/);
  pulsar('Bruno');
  expect(dato('Cantidad activa')).toBe('0');
  expect(dato('Cuota total')).toBe('0');
  pulsar('Camila');
  expect(dato('Cantidad activa')).toBe('3');
  expect(dato('Cuota total')).toBe('48450');
});
