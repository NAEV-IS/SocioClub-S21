import { useId } from 'react';
import PropTypes from 'prop-types';
import { resumenCuota } from '../../domain/club';
import { formatearMoneda } from '../../domain/formato';
import { actividadPropType } from '../../domain/tipos';
import './membership.css';

export default function ResumenCuota({ actividades = [] }) {
  const titulo = useId();
  const { base, porcentaje, bonificacion, total } = resumenCuota(actividades);

  return <aside className="membership membership__quota" aria-labelledby={titulo}>
    <h2 id={titulo}>Tu cuota mensual</h2>
    <p className="support">{actividades.length} de 3 actividades activas</p>
    <dl>
      <div><dt>Suma de actividades</dt><dd>{formatearMoneda(base)}</dd></div>
      <div className="membership__discount"><dt>Bonificación ({porcentaje}%)</dt><dd>−{formatearMoneda(bonificacion)}</dd></div>
      <div className="membership__total"><dt>Total mensual</dt><dd>{formatearMoneda(total)}</dd></div>
    </dl>
    <p className="support">2 actividades: 10% de descuento.<br />3 actividades: 15% de descuento.</p>
    <p className="support">Resumen de ejemplo, no es una liquidación ni un medio de pago.</p>
  </aside>;
}
ResumenCuota.propTypes = {
  actividades: PropTypes.arrayOf(actividadPropType).isRequired,
};
