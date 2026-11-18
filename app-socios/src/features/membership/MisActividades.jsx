import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { formatearDias, formatearMoneda } from '../../domain/formato';
import { actividadPropType } from '../../domain/tipos';
import ResumenCuota from './ResumenCuota';
import './membership.css';

function Inscripcion({ actividad, pendiente, solicitar, mantener, confirmar }) {
  const cancelar = useRef(null);
  const conservar = useRef(null);
  const restaurarFoco = useRef(false);

  useEffect(() => {
    if (pendiente) conservar.current.focus();
    else if (restaurarFoco.current) cancelar.current.focus();
    restaurarFoco.current = false;
  }, [pendiente]);

  return <article className="membership__entry" aria-labelledby={`enrollment-${actividad.id}`}>
    <div className="membership__entry-top">
      <div>
        <h3 id={`enrollment-${actividad.id}`}><Link to={`/actividades/${actividad.id}`}>{actividad.nombre}</Link></h3>
        <p><strong><time dateTime={actividad.horario}>{actividad.horario}</time></strong> · {formatearDias(actividad.dias)}</p>
        <p className="support">{actividad.disciplina} · {actividad.profesor}</p>
      </div>
      <span className="amount">{formatearMoneda(actividad.cuotaMensual)} / mes</span>
    </div>
    {pendiente ? <div className="membership__confirmation">
      <p><strong>¿Cancelar {actividad.nombre}?</strong></p>
      <p>Se quitará de tus actividades de ejemplo y se recalculará tu cuota. No se guarda ningún cambio real.</p>
      <div className="actions">
        <button type="button" className="button button--danger" onClick={confirmar}>Sí, cancelar inscripción</button>
        <button ref={conservar} type="button" className="button button--secondary" onClick={() => {
          restaurarFoco.current = true;
          mantener();
        }}>Mantener inscripción</button>
      </div>
    </div> : <div className="actions membership__entry-actions">
      <button ref={cancelar} type="button" className="button button--danger" onClick={solicitar}>Cancelar inscripción</button>
    </div>}
  </article>;
}
Inscripcion.propTypes = {
  actividad: actividadPropType.isRequired,
  pendiente: PropTypes.bool.isRequired,
  solicitar: PropTypes.func.isRequired,
  mantener: PropTypes.func.isRequired,
  confirmar: PropTypes.func.isRequired,
};

function AgendaPersonal() {
  const { misActividades, darDeBaja } = useSocio();
  const [pendiente, setPendiente] = useState(null);
  const horarios = [...misActividades].sort((a, b) => a.horario.localeCompare(b.horario) || a.id - b.id);

  return <div className="membership__layout">
    <section className="membership__list" aria-labelledby="my-list-title">
      <div className="membership__list-heading"><h2 id="my-list-title">Tus horarios semanales</h2></div>
      {horarios.length ? horarios.map(actividad => <Inscripcion key={actividad.id} actividad={actividad}
        pendiente={pendiente === actividad.id} solicitar={() => setPendiente(actividad.id)}
        mantener={() => setPendiente(null)} confirmar={() => {
          darDeBaja(actividad.id);
          setPendiente(null);
        }} />) : <div className="empty-state">
        <h3>Todavía no tenés actividades activas</h3>
        <p>Explorá los horarios y encontrá una actividad para vos.</p>
        <Link className="button" to="/actividades">Ver la agenda</Link>
      </div>}
    </section>
    <ResumenCuota actividades={misActividades} />
  </div>;
}

export default function MisActividades() {
  const { socio } = useSocio();
  return <div className="membership">
    <div className="page-heading">
      <div><h1 id="page-title">Mis actividades</h1><p>Tu agenda activa y la cuota que corresponde a tu selección.</p></div>
      <Link className="button button--secondary" to="/actividades">Explorar agenda</Link>
    </div>
    {/* A member switch must discard an unconfirmed cancellation, not the enrollments. */}
    <AgendaPersonal key={socio?.dni || 'sin-socio'} />
  </div>;
}
