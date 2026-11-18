import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { formatearDias, formatearMoneda } from '../../domain/formato';
import { actividadPropType } from '../../domain/tipos';

export default function TarjetaActividad({ actividad, seleccionada = false, onInscribir, children }) {
  const { obtenerCupo, misActividades } = useSocio();
  const disponibles = obtenerCupo(actividad);
  const inscripto = misActividades.some(actual => actual.id === actividad.id);
  return <article className={`agenda__entry${disponibles === 0 ? ' agenda__entry--sin-cupo' : ''}`}
    aria-label={actividad.nombre} data-activity-id={actividad.id}>
    <div className={`agenda__row${seleccionada ? ' agenda__row--selected' : ''}`}>
      <time className="agenda__time" dateTime={actividad.horario}>{actividad.horario}</time>
      <div className="agenda__identity">
        <h2>{actividad.nombre}</h2>
        <p className="support">{formatearDias(actividad.dias)}</p>
        <p className="support">{actividad.disciplina} · {actividad.edadMinima}–{actividad.edadMaxima} años</p>
      </div>
      <div className="agenda__availability">
        <strong className={disponibles === 0 && !inscripto ? 'agenda__full' : ''}>
          {inscripto ? 'Ya inscripta/o' : disponibles === 0 ? 'Sin cupo' : `${disponibles} ${disponibles === 1 ? 'lugar libre' : 'lugares libres'}`}
        </strong>
        <span>{actividad.cupoMaximo - disponibles}/{actividad.cupoMaximo} ocupados</span>
      </div>
      <div className="agenda__price amount">{formatearMoneda(actividad.cuotaMensual)}<span className="support"> / mes</span></div>
      {onInscribir && <button type="button" className="button" disabled={disponibles === 0}
        onClick={() => onInscribir(actividad.id)}>Inscribirme</button>}
      <Link className="agenda__open" to={`/actividades/${actividad.id}`} data-detail-link
        aria-label={`Ver detalle de ${actividad.nombre}`} aria-current={seleccionada ? 'page' : undefined}>Ver</Link>
    </div>
    {children}
  </article>;
}
TarjetaActividad.propTypes = {
  actividad: actividadPropType.isRequired,
  seleccionada: PropTypes.bool,
  onInscribir: PropTypes.func,
  children: PropTypes.node,
};
