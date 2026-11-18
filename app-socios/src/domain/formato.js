import { DIAS } from '../data/fixtures';

const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
});

export function formatearMoneda(importe) {
  return pesos.format(importe);
}

export function formatearDias(dias) {
  return dias.map(id => DIAS.find(dia => dia.id === id)?.corto).filter(Boolean).join(' · ');
}

export function nombreCompleto(socio) {
  return `${socio.nombre} ${socio.apellido}`;
}
