import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { formatearDias, formatearMoneda } from '../../domain/formato';
import { actividadPropType } from '../../domain/tipos';

export default function DetalleActividad({ actividad, fueraDeFiltros = false }) {
  const { obtenerCupo, obtenerMotivos, inscribir, misActividades } = useSocio();
  const motivos = obtenerMotivos(actividad);
  const inscripto = misActividades.some(actual => actual.id === actividad.id);
  return <section className="agenda__detail" id="activity-detail" tabIndex="-1" aria-labelledby="detail-title">
    <div className="agenda__detail-heading"><h3 id="detail-title">{actividad.nombre}</h3>
      <Link to="/actividades">Cerrar detalle</Link></div>
    {fueraDeFiltros && <p className="support">Esta actividad no coincide con tus filtros actuales. El detalle sigue abierto para conservar tu contexto.</p>}
    <div className="agenda__detail-layout">
      <dl className="agenda__facts">
        <div><dt>Días y horario</dt><dd>{formatearDias(actividad.dias)} · {actividad.horario}</dd></div>
        <div><dt>Disciplina</dt><dd>{actividad.disciplina}</dd></div>
        <div><dt>Profesor/a</dt><dd>{actividad.profesor}</dd></div>
        <div><dt>Edad permitida</dt><dd>{actividad.edadMinima} a {actividad.edadMaxima} años</dd></div>
        <div><dt>Disponibilidad de ejemplo</dt><dd>{obtenerCupo(actividad)} lugares libres de {actividad.cupoMaximo}</dd></div>
        <div><dt>Tu situación</dt><dd>{inscripto ? 'Inscripción activa' : 'Sin inscripción en esta actividad'}</dd></div>
      </dl>
      <div className="agenda__detail-action">
        <p className="agenda__fee amount">{formatearMoneda(actividad.cuotaMensual)} / mes</p>
        <p className="support">La bonificación depende de tus actividades activas.</p>
        <button className="button" type="button" disabled={motivos.length > 0} aria-describedby="eligibility-reasons"
          onClick={() => inscribir(actividad.id)}>Inscribirme</button>
        {motivos.length > 0 ? <ul className="agenda__reasons" id="eligibility-reasons">
          {motivos.map(motivo => <li key={motivo.regla}>{motivo.mensaje}</li>)}
        </ul> : <p className="support" id="eligibility-reasons">Podés inscribirte: hay cupo, tu edad está permitida y estás al día.</p>}
        {(inscripto || misActividades.length >= 3) && <Link to="/mis-actividades">Administrar mis actividades</Link>}
      </div>
    </div>
  </section>;
}
DetalleActividad.propTypes = { actividad: actividadPropType.isRequired, fueraDeFiltros: PropTypes.bool };
