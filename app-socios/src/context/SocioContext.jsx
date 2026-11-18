import { createContext, useCallback, useContext, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { ACTIVIDADES, SOCIOS } from '../data/fixtures';
import { cupoDisponible, esDniValido, obtenerMotivosInscripcion } from '../domain/club';
import { actividadPropType, socioPropType } from '../domain/tipos';

const SocioContext = createContext(null);
const filtrosIniciales = () => ({ dia: 0, disciplina: '', edad: '' });
const avisoVacio = { tipo: 'exito', mensaje: '' };

export function SocioProvider({ children, actividades = ACTIVIDADES, socios = SOCIOS, dniInicial = null }) {
  function reducir(estado, accion) {
    if (accion.tipo === 'INGRESAR') return { ...estado, dni: accion.dni, aviso: avisoVacio };
    if (accion.tipo === 'LIMPIAR_AVISO') return estado.aviso.mensaje ? { ...estado, aviso: avisoVacio } : estado;

    const socio = socios.find(persona => persona.dni === estado.dni);
    const actividad = actividades.find(item => item.id === accion.id);
    if (!socio || !actividad) {
      return { ...estado, aviso: { tipo: 'error', mensaje: 'Seleccioná un socio y una actividad de ejemplo válidos.' } };
    }
    const activas = estado.inscripciones[socio.dni] || [];
    if (accion.tipo === 'INSCRIBIR') {
      // Validate against the reducer's current state, including queued actions.
      const motivos = obtenerMotivosInscripcion(socio, actividad, estado.inscripciones, new Date(), socios);
      if (motivos.length) return { ...estado, aviso: { tipo: 'error', mensaje: motivos.map(motivo => motivo.mensaje).join(' ') } };
      return {
        ...estado,
        inscripciones: { ...estado.inscripciones, [socio.dni]: [...activas, actividad.id] },
        aviso: { tipo: 'exito', mensaje: `Te inscribiste a ${actividad.nombre}. La cuota se actualizó sólo en esta sesión de ejemplo.` },
      };
    }
    if (accion.tipo === 'BAJA' && activas.includes(actividad.id)) {
      return {
        ...estado,
        inscripciones: { ...estado.inscripciones, [socio.dni]: activas.filter(id => id !== actividad.id) },
        aviso: { tipo: 'exito', mensaje: `Cancelaste tu inscripción a ${actividad.nombre}. La cuota se recalculó sólo para esta sesión de ejemplo.` },
      };
    }
    return estado;
  }

  const [estado, dispatch] = useReducer(reducir, null, () => ({
    dni: esDniValido(dniInicial) && socios.some(socio => socio.dni === dniInicial) ? dniInicial : null,
    inscripciones: Object.fromEntries(socios.map(socio => [socio.dni, [...socio.actividadesIniciales]])),
    aviso: avisoVacio,
  }));
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const socio = socios.find(persona => persona.dni === estado.dni) || null;
  const idsActivos = socio ? estado.inscripciones[socio.dni] || [] : [];
  const misActividades = actividades.filter(actividad => idsActivos.includes(actividad.id));

  const iniciarSesion = useCallback(dni => {
    if (!esDniValido(dni)) return { ok: false, mensaje: 'El DNI debe tener 7 u 8 dígitos, sin puntos ni espacios.' };
    if (!socios.some(persona => persona.dni === dni)) return { ok: false, mensaje: 'No encontramos ese DNI entre los socios de ejemplo.' };
    dispatch({ tipo: 'INGRESAR', dni });
    return { ok: true };
  }, [socios]);
  const inscribir = useCallback(id => dispatch({ tipo: 'INSCRIBIR', id: Number(id) }), []);
  const darDeBaja = useCallback(id => dispatch({ tipo: 'BAJA', id: Number(id) }), []);
  const limpiarAviso = useCallback(() => dispatch({ tipo: 'LIMPIAR_AVISO' }), []);
  const limpiarFiltros = useCallback(() => setFiltros(filtrosIniciales()), []);
  const obtenerCupo = actividad => cupoDisponible(actividad, estado.inscripciones, socios);
  const obtenerMotivos = actividad => obtenerMotivosInscripcion(socio, actividad, estado.inscripciones, new Date(), socios);

  return <SocioContext.Provider value={{
    socio, actividades, sociosEjemplo: socios, misActividades,
    inscripciones: estado.inscripciones, filtros, setFiltros, limpiarFiltros,
    aviso: estado.aviso, limpiarAviso, iniciarSesion, inscribir, darDeBaja,
    obtenerCupo, obtenerMotivos,
  }}>{children}</SocioContext.Provider>;
}
SocioProvider.propTypes = {
  children: PropTypes.node.isRequired,
  actividades: PropTypes.arrayOf(actividadPropType),
  socios: PropTypes.arrayOf(socioPropType),
  dniInicial: PropTypes.string,
};

export function useSocio() {
  const contexto = useContext(SocioContext);
  if (!contexto) throw new Error('useSocio requiere SocioProvider.');
  return contexto;
}
