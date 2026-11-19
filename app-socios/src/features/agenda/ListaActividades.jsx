import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DIAS } from '../../data/fixtures';
import { useSocio } from '../../context/SocioContext';
import { incluyeDia } from '../../domain/formato';
import TarjetaActividad from './TarjetaActividad';
import DetalleActividad from './DetalleActividad';
import './agenda.css';

export default function ListaActividades() {
  const { id } = useParams();
  const { actividades, filtros, setFiltros, limpiarFiltros } = useSocio();
  const anterior = useRef(null);
  const seleccionada = actividades.find(actividad => String(actividad.id) === id);
  const visibles = actividades.filter(actividad =>
    incluyeDia(actividad.dias, filtros.dia) &&
    (!filtros.disciplina || actividad.disciplina === filtros.disciplina) &&
    (filtros.edad === '' || (Number(filtros.edad) >= actividad.edadMinima && Number(filtros.edad) <= actividad.edadMaxima))
  ).sort((a, b) => a.horario.localeCompare(b.horario) || a.id - b.id);
  const disciplinas = [...new Set(actividades.map(actividad => actividad.disciplina))];
  const fueraDeFiltros = seleccionada && !visibles.some(actividad => actividad.id === seleccionada.id);
  const criterios = [
    DIAS.find(dia => dia.id === filtros.dia)?.nombre || 'Todos los días',
    filtros.disciplina || 'Todas las disciplinas',
    filtros.edad === '' ? 'Cualquier edad' : `${filtros.edad} años`,
  ];

  useEffect(() => {
    if (seleccionada) document.getElementById('activity-detail')?.focus();
    else if (anterior.current) {
      const enlace = document.querySelector(`[data-activity-id="${anterior.current}"] a[data-detail-link]`);
      (enlace || document.getElementById('page-title'))?.focus();
    }
    anterior.current = seleccionada?.id || null;
  }, [id, seleccionada]);

  const cambiar = (campo, valor) => setFiltros(actual => ({ ...actual, [campo]: valor }));

  return <section className="agenda" aria-label="Agenda de actividades">
    <div className="agenda__tools">
      <div className="agenda__intro">
        <h1 id="page-title" tabIndex="-1">Agenda semanal</h1>
        <p className="support">Horarios de ejemplo · Se repiten cada semana</p>
      </div>
      <div className="agenda__days" role="group" aria-label="Filtrar por día">
        {DIAS.map(dia => <button className="button button--secondary" type="button" key={dia.id}
          aria-pressed={filtros.dia === dia.id} onClick={() => cambiar('dia', dia.id)}>{dia.nombre}</button>)}
      </div>
      <div className="agenda__filters">
        <div className="field"><label htmlFor="disciplina">Disciplina</label>
          <select id="disciplina" value={filtros.disciplina} onChange={event => cambiar('disciplina', event.target.value)}>
            <option value="">Todas las disciplinas</option>
            {disciplinas.map(disciplina => <option key={disciplina}>{disciplina}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="edad">Edad (opcional)</label>
          <input id="edad" type="number" inputMode="numeric" min="0" step="1" value={filtros.edad}
            placeholder="Sin filtrar" onChange={event => cambiar('edad', event.target.value)} />
        </div>
        <button className="button button--secondary" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>
    </div>
    {id && !seleccionada && <div className="notice notice--error agenda__unknown" role="alert">
      <p>No encontramos esta actividad.</p><Link to="/actividades">Volver a la agenda</Link>
    </div>}
    <div className="agenda__results-label">
      <strong>{visibles.length} {visibles.length === 1 ? 'actividad' : 'actividades'}</strong>
      <p className="support">{criterios.join(' / ')} · Por horario</p>
    </div>
    {visibles.length > 0 && <div className="agenda__columns" aria-hidden="true">
      <span>Hora</span><span>Actividad y días</span><span>Disponibilidad</span><span>Cuota / mes</span><span>Detalle</span>
    </div>}
    <div className="agenda__results">
      {visibles.map(actividad => <TarjetaActividad key={actividad.id} actividad={actividad}
        seleccionada={actividad.id === seleccionada?.id}>
        {actividad.id === seleccionada?.id && <DetalleActividad actividad={actividad} />}
      </TarjetaActividad>)}
      {visibles.length === 0 && <div className="empty-state">
        <h2>No hay actividades con estos filtros</h2>
        <p>Conservamos tu selección. Probá otro día, disciplina o edad.</p>
        <button className="button button--secondary" type="button" onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>}
      {fueraDeFiltros && <DetalleActividad actividad={seleccionada} fueraDeFiltros />}
    </div>
  </section>;
}
