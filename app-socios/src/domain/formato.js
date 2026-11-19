import { DIAS } from '../data/fixtures';

const pesos = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
});

export function formatearMoneda(importe) {
  return pesos.format(importe);
}

function sinTildes(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function formatearDias(dias) {
  if (typeof dias === 'string') return dias;
  return dias.map(id => DIAS.find(dia => dia.id === id)?.corto).filter(Boolean).join(' · ');
}

export function incluyeDia(dias, diaId) {
  if (!diaId) return true;
  if (Array.isArray(dias)) return dias.includes(diaId);
  if (typeof dias === 'string') {
    const corto = DIAS.find(dia => dia.id === diaId)?.corto;
    return corto ? sinTildes(dias).includes(sinTildes(corto)) : false;
  }
  return false;
}

export function nombreCompleto(socio) {
  return `${socio.nombre} ${socio.apellido}`;
}
