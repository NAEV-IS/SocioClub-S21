import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ACTIVIDADES, SOCIOS } from '../data/fixtures';
import { cupoDisponible, esDniValido, obtenerMotivosInscripcion } from '../domain/club';
import { actividadPropType, socioPropType } from '../domain/tipos';
import {
  buscarSocioPorDni,
  darDeBajaInscripcion,
  extraerMensajeError,
  inscribirSocio,
  obtenerActividades,
  obtenerInscripcionesSocio,
} from '../servicios/api';

const SocioContext = createContext(null);
const filtrosIniciales = () => ({ dia: 0, disciplina: '', edad: '' });
const avisoVacio = { tipo: 'exito', mensaje: '' };
const STORAGE_DNI = 'socioclub_dni';

function leerDniGuardado() {
  try {
    return window.localStorage?.getItem(STORAGE_DNI) || null;
  } catch {
    return null;
  }
}

function guardarDni(dni) {
  try {
    if (dni) window.localStorage?.setItem(STORAGE_DNI, dni);
    else window.localStorage?.removeItem(STORAGE_DNI);
  } catch {
    // Entornos sin almacenamiento persistente siguen funcionando en memoria.
  }
}

function actualizarEstadoLocal(estado, accion, socios, actividades) {
  if (accion.tipo === 'INGRESAR') return { ...estado, dni: accion.dni, aviso: avisoVacio };
  if (accion.tipo === 'CERRAR_SESION') return { ...estado, dni: null, aviso: avisoVacio };
  if (accion.tipo === 'LIMPIAR_AVISO') return estado.aviso.mensaje ? { ...estado, aviso: avisoVacio } : estado;

  const socio = socios.find(persona => persona.dni === estado.dni);
  const actividad = actividades.find(item => item.id === accion.id);
  if (!socio || !actividad) {
    return { ...estado, aviso: { tipo: 'error', mensaje: 'Seleccioná un socio y una actividad de ejemplo válidos.' } };
  }
  const activas = estado.inscripciones[socio.dni] || [];
  if (accion.tipo === 'INSCRIBIR') {
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

export function SocioProvider({ children, actividades: actividadesProp, socios: sociosProp, dniInicial, usarApi }) {
  const tieneFixturesInyectados = actividadesProp !== undefined || sociosProp !== undefined || dniInicial !== undefined;
  const modoApi = usarApi ?? (!tieneFixturesInyectados && process.env.NODE_ENV !== 'test');

  const actividadesLocales = actividadesProp ?? ACTIVIDADES;
  const sociosLocales = sociosProp ?? SOCIOS;

  const [estado, setEstado] = useState(() => ({
    dni: esDniValido(dniInicial) && sociosLocales.some(socio => socio.dni === dniInicial) ? dniInicial : null,
    inscripciones: Object.fromEntries(sociosLocales.map(socio => [socio.dni, [...socio.actividadesIniciales]])),
    aviso: avisoVacio,
  }));

  const [actividadesApi, setActividadesApi] = useState([]);
  const [socioApi, setSocioApi] = useState(null);
  const [inscripcionesApi, setInscripcionesApi] = useState([]);
  const [avisoApi, setAvisoApi] = useState(avisoVacio);
  const [cargando, setCargando] = useState(() => modoApi);
  const [sesionCerrada, setSesionCerrada] = useState(false);
  const [filtros, setFiltros] = useState(filtrosIniciales);

  useEffect(() => {
    if (!modoApi) return undefined;
    let activo = true;

    async function cargarInicial() {
      try {
        const listaActividades = await obtenerActividades();
        if (!activo) return;
        setActividadesApi(listaActividades);

        const dniGuardado = leerDniGuardado();
        if (esDniValido(dniGuardado)) {
          try {
            const socioEncontrado = await buscarSocioPorDni(dniGuardado);
            const activas = await obtenerInscripcionesSocio(socioEncontrado.id);
            if (!activo) return;
            setSocioApi(socioEncontrado);
            setInscripcionesApi(activas);
          } catch {
            if (!activo) return;
            guardarDni(null);
            setSocioApi(null);
            setInscripcionesApi([]);
          }
        }
      } catch (error) {
        if (!activo) return;
        setAvisoApi({
          tipo: 'error',
          mensaje: extraerMensajeError(error, 'No pudimos cargar las actividades desde el servidor.'),
        });
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInicial();
    return () => { activo = false; };
  }, [modoApi]);

  const refrescarDesdeApi = useCallback(async socioId => {
    const [listaActividades, activas] = await Promise.all([
      obtenerActividades(),
      socioId ? obtenerInscripcionesSocio(socioId) : Promise.resolve([]),
    ]);
    setActividadesApi(listaActividades);
    if (socioId) {
      setInscripcionesApi(activas);
    }
  }, []);

  const iniciarSesion = useCallback(dni => {
    if (!esDniValido(dni)) return { ok: false, mensaje: 'El DNI debe tener 7 u 8 dígitos, sin puntos ni espacios.' };
    if (!modoApi) {
      if (!sociosLocales.some(persona => persona.dni === dni)) {
        return { ok: false, mensaje: 'No encontramos ese DNI entre los socios de ejemplo.' };
      }
      setEstado(actual => actualizarEstadoLocal(actual, { tipo: 'INGRESAR', dni }, sociosLocales, actividadesLocales));
      setSesionCerrada(false);
      return { ok: true };
    }
    return (async () => {
      try {
        const socioEncontrado = await buscarSocioPorDni(dni);
        const [listaActividades, activas] = await Promise.all([
          obtenerActividades(),
          obtenerInscripcionesSocio(socioEncontrado.id),
        ]);
        guardarDni(socioEncontrado.dni);
        setSocioApi(socioEncontrado);
        setActividadesApi(listaActividades);
        setInscripcionesApi(activas);
        setAvisoApi(avisoVacio);
        setSesionCerrada(false);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          mensaje: extraerMensajeError(error, 'No encontramos un socio registrado con ese DNI.'),
        };
      }
    })();
  }, [modoApi, sociosLocales, actividadesLocales]);

  const cerrarSesion = useCallback(() => {
    setSesionCerrada(true);
    if (!modoApi) {
      setEstado(actual => actualizarEstadoLocal(actual, { tipo: 'CERRAR_SESION' }, sociosLocales, actividadesLocales));
      return;
    }
    guardarDni(null);
    setSocioApi(null);
    setInscripcionesApi([]);
    setAvisoApi(avisoVacio);
  }, [modoApi, sociosLocales, actividadesLocales]);

  const inscribir = useCallback(async id => {
    const actividadId = Number(id);
    if (!modoApi) {
      setEstado(actual => actualizarEstadoLocal(
        actual,
        { tipo: 'INSCRIBIR', id: actividadId },
        sociosLocales,
        actividadesLocales,
      ));
      return;
    }
    if (!socioApi) {
      setAvisoApi({ tipo: 'error', mensaje: 'Primero ingresá con tu DNI.' });
      return;
    }
    try {
      const creada = await inscribirSocio(socioApi.id, actividadId);
      await refrescarDesdeApi(socioApi.id);
      const nombre = creada?.actividad?.nombre || 'la actividad';
      setAvisoApi({ tipo: 'exito', mensaje: `Te inscribiste a ${nombre}.` });
    } catch (error) {
      setAvisoApi({
        tipo: 'error',
        mensaje: extraerMensajeError(error, 'No pudimos completar tu inscripción.'),
      });
    }
  }, [modoApi, socioApi, refrescarDesdeApi, sociosLocales, actividadesLocales]);

  const darDeBaja = useCallback(async id => {
    const actividadId = Number(id);
    if (!modoApi) {
      setEstado(actual => actualizarEstadoLocal(
        actual,
        { tipo: 'BAJA', id: actividadId },
        sociosLocales,
        actividadesLocales,
      ));
      return;
    }
    const inscripcion = inscripcionesApi.find(item => item.actividad?.id === actividadId);
    if (!inscripcion || !socioApi) return;
    try {
      await darDeBajaInscripcion(inscripcion.id);
      await refrescarDesdeApi(socioApi.id);
      setAvisoApi({
        tipo: 'exito',
        mensaje: `Diste de baja tu inscripción a ${inscripcion.actividad?.nombre || 'la actividad'}.`,
      });
    } catch (error) {
      setAvisoApi({
        tipo: 'error',
        mensaje: extraerMensajeError(error, 'No pudimos cancelar la inscripción.'),
      });
    }
  }, [modoApi, inscripcionesApi, socioApi, refrescarDesdeApi, sociosLocales, actividadesLocales]);

  const limpiarAviso = useCallback(() => {
    if (!modoApi) {
      setEstado(actual => actualizarEstadoLocal(actual, { tipo: 'LIMPIAR_AVISO' }));
      return;
    }
    setAvisoApi(actual => (actual.mensaje ? avisoVacio : actual));
  }, [modoApi]);

  const limpiarFiltros = useCallback(() => setFiltros(filtrosIniciales()), []);

  const actividades = modoApi ? actividadesApi : actividadesLocales;
  const socio = modoApi ? socioApi : (sociosLocales.find(persona => persona.dni === estado.dni) || null);
  const idsActivosLocales = socio ? estado.inscripciones[socio.dni] || [] : [];
  const misActividades = modoApi
    ? inscripcionesApi.map(item => item.actividad)
    : actividadesLocales.filter(actividad => idsActivosLocales.includes(actividad.id));
  const inscripciones = modoApi
    ? (socioApi ? { [socioApi.dni]: inscripcionesApi.map(item => item.actividad.id) } : {})
    : estado.inscripciones;
  const aviso = modoApi ? avisoApi : estado.aviso;

  const obtenerCupo = actividad => cupoDisponible(actividad, estado.inscripciones, sociosLocales);
  const obtenerMotivos = actividad => {
    if (modoApi) {
      return obtenerCupo(actividad) === 0
        ? [{ regla: 'RN1', mensaje: 'La actividad no tiene cupo disponible' }]
        : [];
    }
    return obtenerMotivosInscripcion(socio, actividad, estado.inscripciones, new Date(), sociosLocales);
  };

  return <SocioContext.Provider value={{
    socio, actividades, sociosEjemplo: sociosLocales, misActividades,
    inscripciones, filtros, setFiltros, limpiarFiltros,
    aviso, cargando, sesionCerrada, limpiarAviso, iniciarSesion, cerrarSesion, inscribir, darDeBaja,
    obtenerCupo, obtenerMotivos,
  }}>{children}</SocioContext.Provider>;
}
SocioProvider.propTypes = {
  children: PropTypes.node.isRequired,
  actividades: PropTypes.arrayOf(actividadPropType),
  socios: PropTypes.arrayOf(socioPropType),
  dniInicial: PropTypes.string,
  usarApi: PropTypes.bool,
};

export function useSocio() {
  const contexto = useContext(SocioContext);
  if (!contexto) throw new Error('useSocio requiere SocioProvider.');
  return contexto;
}
