import PropTypes from 'prop-types';

export const actividadPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  nombre: PropTypes.string.isRequired,
  disciplina: PropTypes.string.isRequired,
  profesor: PropTypes.string.isRequired,
  dias: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.string]).isRequired,
  horario: PropTypes.string.isRequired,
  edadMinima: PropTypes.number.isRequired,
  edadMaxima: PropTypes.number.isRequired,
  cupoMaximo: PropTypes.number.isRequired,
  cuotaMensual: PropTypes.number.isRequired,
  cupoDisponible: PropTypes.number,
  ocupadosIniciales: PropTypes.number,
});

export const socioPropType = PropTypes.shape({
  id: PropTypes.number,
  dni: PropTypes.string.isRequired,
  nombre: PropTypes.string.isRequired,
  apellido: PropTypes.string.isRequired,
  fechaNacimiento: PropTypes.string.isRequired,
  estadoCuota: PropTypes.oneOf(['AL_DIA', 'MOROSO']).isRequired,
  actividadesIniciales: PropTypes.arrayOf(PropTypes.number),
});
