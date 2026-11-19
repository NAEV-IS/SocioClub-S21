import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SocioProvider, useSocio } from '../context/SocioContext';
import { calcularCuotaMensual } from '../utils/club';
import * as api from './api';

jest.mock('./api', () => {
  const actual = jest.requireActual('./api');
  return {
    extraerMensajeError: actual.extraerMensajeError,
    obtenerActividades: jest.fn(),
    obtenerActividadPorId: jest.fn(),
    buscarSocioPorDni: jest.fn(),
    obtenerInscripcionesSocio: jest.fn(),
    inscribirSocio: jest.fn(),
    darDeBajaInscripcion: jest.fn(),
  };
});

const ACTIVIDADES_INICIALES = [
  {
    id: 4,
    nombre: 'Natación',
    disciplina: 'Acuáticas',
    profesor: 'Lucía Morales',
    dias: 'Lunes y Miércoles',
    horario: '18:00 a 19:00',
    edadMinima: 12,
    edadMaxima: 65,
    cupoMaximo: 30,
    cupoDisponible: 10,
    cuotaMensual: 26000,
  },
  {
    id: 8,
    nombre: 'Yoga',
    disciplina: 'Bienestar',
    profesor: 'Carolina Vega',
    dias: 'Martes y Jueves',
    horario: '09:00 a 10:00',
    edadMinima: 16,
    edadMaxima: 80,
    cupoMaximo: 15,
    cupoDisponible: 1,
    cuotaMensual: 17000,
  },
];

const SOCIO_ROBERTO = {
  id: 5,
  dni: '28567890',
  nombre: 'Roberto',
  apellido: 'Funes',
  fechaNacimiento: '1981-05-12',
  email: 'roberto.funes@mail.com',
  telefono: '3515550105',
  estadoCuota: 'AL_DIA',
};

function ConsumidorApi() {
  const {
    socio,
    actividades,
    misActividades,
    aviso,
    iniciarSesion,
    cerrarSesion,
    inscribir,
    darDeBaja,
  } = useSocio();
  const [dniInput, setDniInput] = useState('28567890');
  const [errorIngreso, setErrorIngreso] = useState('');

  const natacion = actividades.find((item) => item.id === 4);
  const cuotaTotal = calcularCuotaMensual(misActividades);

  async function manejarIngreso() {
    setErrorIngreso('');
    const resultado = await iniciarSesion(dniInput);
    if (resultado && !resultado.ok) {
      setErrorIngreso(resultado.mensaje || 'Error de ingreso');
    }
  }

  return (
    <div>
      <input
        aria-label="DNI de socio"
        value={dniInput}
        onChange={(e) => setDniInput(e.target.value)}
      />
      <button type="button" onClick={manejarIngreso}>
        Ingresar
      </button>
      <button type="button" onClick={() => inscribir(4)}>
        Inscribir Natación
      </button>
      <button type="button" onClick={() => darDeBaja(4)}>
        Dar de baja Natación
      </button>
      <button type="button" onClick={cerrarSesion}>
        Cerrar sesión
      </button>

      {socio && (
        <div data-testid="socio-activo">
          {socio.nombre} {socio.apellido} ({socio.dni})
        </div>
      )}
      {errorIngreso && <div role="alert">{errorIngreso}</div>}
      {aviso && (
        <div data-testid="aviso-api" data-tipo={aviso.tipo}>
          {aviso.mensaje}
        </div>
      )}
      <div data-testid="cupo-natacion">{natacion ? natacion.cupoDisponible : 'sin-dato'}</div>
      <div data-testid="cantidad-inscripciones">{misActividades.length}</div>
      <div data-testid="cuota-total">{cuotaTotal}</div>
    </div>
  );
}

describe('Integración API Axios en SocioProvider y api.js', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    api.obtenerActividades.mockResolvedValue(ACTIVIDADES_INICIALES);
    api.buscarSocioPorDni.mockResolvedValue(SOCIO_ROBERTO);
    api.obtenerInscripcionesSocio.mockResolvedValue([
      {
        id: 30,
        estado: 'ACTIVA',
        socio: SOCIO_ROBERTO,
        actividad: ACTIVIDADES_INICIALES[1],
      },
    ]);
  });

  test('extraerMensajeError devuelve el mensaje del backend o un texto por defecto', () => {
    expect(
      api.extraerMensajeError(
        { response: { data: { error: 'La actividad no tiene cupo disponible', regla: 'RN1' } } },
        'Error genérico'
      )
    ).toBe('La actividad no tiene cupo disponible');
    expect(api.extraerMensajeError(new Error('Network Error'), 'Error de red')).toBe('Error de red');
  });

  test('carga catálogo inicial, rechaza DNI 404 e inicia sesión con DNI válido', async () => {
    api.buscarSocioPorDni.mockRejectedValueOnce({
      response: { status: 404, data: { error: 'Socio no encontrado con DNI 99999999' } },
    });

    render(
      <SocioProvider usarApi>
        <ConsumidorApi />
      </SocioProvider>
    );

    await waitFor(() => {
      expect(api.obtenerActividades).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('cupo-natacion')).toHaveTextContent('10');
    });

    fireEvent.change(screen.getByLabelText('DNI de socio'), { target: { value: '99999999' } });
    fireEvent.click(screen.getByText('Ingresar'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Socio no encontrado con DNI 99999999');
    });
    expect(screen.queryByTestId('socio-activo')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('DNI de socio'), { target: { value: '28567890' } });
    fireEvent.click(screen.getByText('Ingresar'));

    await waitFor(() => {
      expect(screen.getByTestId('socio-activo')).toHaveTextContent('Roberto Funes (28567890)');
    });
    expect(api.buscarSocioPorDni).toHaveBeenLastCalledWith('28567890');
    expect(api.obtenerInscripcionesSocio).toHaveBeenCalledWith(5);
    expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('1');
    expect(screen.getByTestId('cuota-total')).toHaveTextContent('17000');
    expect(window.localStorage.getItem('socioclub_dni')).toBe('28567890');

    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(screen.queryByTestId('socio-activo')).not.toBeInTheDocument();
    expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('0');
    expect(window.localStorage.getItem('socioclub_dni')).toBeNull();
  });

  test('inscribirSocio válido actualiza cupo, inscripciones y aplica descuento RN6 al refrescar desde API', async () => {
    const actividadesDespues = [
      { ...ACTIVIDADES_INICIALES[0], cupoDisponible: 9 },
      ACTIVIDADES_INICIALES[1],
    ];

    api.inscribirSocio.mockResolvedValueOnce({
      id: 99,
      estado: 'ACTIVA',
      socio: SOCIO_ROBERTO,
      actividad: actividadesDespues[0],
    });
    api.obtenerActividades
      .mockResolvedValueOnce(ACTIVIDADES_INICIALES)
      .mockResolvedValueOnce(ACTIVIDADES_INICIALES)
      .mockResolvedValueOnce(actividadesDespues);
    api.obtenerInscripcionesSocio
      .mockResolvedValueOnce([
        { id: 30, estado: 'ACTIVA', socio: SOCIO_ROBERTO, actividad: ACTIVIDADES_INICIALES[1] },
      ])
      .mockResolvedValueOnce([
        { id: 30, estado: 'ACTIVA', socio: SOCIO_ROBERTO, actividad: ACTIVIDADES_INICIALES[1] },
        { id: 99, estado: 'ACTIVA', socio: SOCIO_ROBERTO, actividad: actividadesDespues[0] },
      ]);

    render(
      <SocioProvider usarApi>
        <ConsumidorApi />
      </SocioProvider>
    );

    fireEvent.click(screen.getByText('Ingresar'));
    await waitFor(() => {
      expect(screen.getByTestId('socio-activo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inscribir Natación'));

    await waitFor(() => {
      expect(screen.getByTestId('aviso-api')).toHaveTextContent('Te inscribiste a Natación.');
    });
    expect(api.inscribirSocio).toHaveBeenCalledWith(5, 4);
    expect(screen.getByTestId('cupo-natacion')).toHaveTextContent('9');
    expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('2');
    expect(screen.getByTestId('cuota-total')).toHaveTextContent('38700');
  });

  test('muestra el mensaje de rechazo 409 Conflict cuando una regla de negocio impide inscribir', async () => {
    api.inscribirSocio.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: 'Debe regularizar su cuota en secretaría', regla: 'RN4' },
      },
    });

    render(
      <SocioProvider usarApi>
        <ConsumidorApi />
      </SocioProvider>
    );

    fireEvent.click(screen.getByText('Ingresar'));
    await waitFor(() => {
      expect(screen.getByTestId('socio-activo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inscribir Natación'));

    await waitFor(() => {
      expect(screen.getByTestId('aviso-api')).toHaveTextContent(
        'Debe regularizar su cuota en secretaría'
      );
    });
    expect(screen.getByTestId('aviso-api')).toHaveAttribute('data-tipo', 'error');
    expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('1');
  });

  test('darDeBajaInscripcion ejecuta baja lógica, actualiza inscripciones y recalcula la cuota', async () => {
    const inscripcionYoga = {
      id: 30,
      estado: 'ACTIVA',
      socio: SOCIO_ROBERTO,
      actividad: ACTIVIDADES_INICIALES[1],
    };
    const inscripcionNatacion = {
      id: 99,
      estado: 'ACTIVA',
      socio: SOCIO_ROBERTO,
      actividad: { ...ACTIVIDADES_INICIALES[0], cupoDisponible: 9 },
    };

    api.obtenerInscripcionesSocio
      .mockResolvedValueOnce([inscripcionYoga, inscripcionNatacion])
      .mockResolvedValueOnce([inscripcionYoga]);
    api.darDeBajaInscripcion.mockResolvedValueOnce({
      ...inscripcionNatacion,
      estado: 'BAJA',
    });

    render(
      <SocioProvider usarApi>
        <ConsumidorApi />
      </SocioProvider>
    );

    fireEvent.click(screen.getByText('Ingresar'));
    await waitFor(() => {
      expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('2');
    });
    expect(screen.getByTestId('cuota-total')).toHaveTextContent('38700');

    fireEvent.click(screen.getByText('Dar de baja Natación'));

    await waitFor(() => {
      expect(screen.getByTestId('aviso-api')).toHaveTextContent(
        'Diste de baja tu inscripción a Natación.'
      );
    });
    expect(api.darDeBajaInscripcion).toHaveBeenCalledWith(99);
    expect(screen.getByTestId('cantidad-inscripciones')).toHaveTextContent('1');
    expect(screen.getByTestId('cuota-total')).toHaveTextContent('17000');
  });
});
