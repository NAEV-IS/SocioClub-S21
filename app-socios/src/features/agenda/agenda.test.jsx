import PropTypes from 'prop-types';
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { ACTIVIDADES, SOCIOS } from '../../data/fixtures';
import { useSocio } from '../../context/SocioContext';
import { renderConClub } from '../../test/renderClub';
import ListaActividades from './ListaActividades';
import TarjetaActividad from './TarjetaActividad';

function Probe() {
  const { misActividades, aviso } = useSocio();
  return <><output aria-label="Actividades seleccionadas">{misActividades.length}</output>
    <output aria-label="Mensaje local">{aviso.mensaje}</output></>;
}
function montar(options) {
  return renderConClub(<><Routes>
    <Route path="/actividades" element={<ListaActividades />} />
    <Route path="/actividades/:id" element={<ListaActividades />} />
  </Routes><Probe /></>, options);
}
const filas = () => screen.getAllByRole('article');
const detalle = nombre => screen.getByRole('region', { name: nombre, exact: true });

test('la agenda muestra las ocho actividades ordenadas por horario, sin la introducción retirada', () => {
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Agenda semanal' })).toHaveAttribute('id', 'page-title');
  expect(filas().map(fila => fila.getAttribute('aria-label'))).toEqual([
    'Yoga', 'Ajedrez', 'Natación', 'Patín artístico', 'Fútbol infantil', 'Vóley mixto', 'Básquet juvenil', 'Funcional adultos',
  ]);
  expect(screen.queryByText('Tu semana en el club')).not.toBeInTheDocument();
  expect(screen.queryByText('Elegí un día, compará horarios y encontrá tu próxima actividad.')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /^Ver mis/ })).not.toBeInTheDocument();
});

test('el filtro de día conserva la opción Todos los días', async () => {
  const { user } = montar();
  await user.click(screen.getByRole('button', { name: 'Lunes', exact: true }));
  expect(filas()).toHaveLength(3);
  expect(screen.queryByRole('article', { name: 'Yoga', exact: true })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Todos los días' }));
  expect(filas()).toHaveLength(8);
});

test('disciplina y edad se combinan; sin resultados conserva los filtros y permite recuperarse', async () => {
  const { user } = montar();
  await user.selectOptions(screen.getByLabelText('Disciplina'), 'Bienestar');
  await user.type(screen.getByLabelText('Edad (opcional)'), '15');
  expect(screen.getByText('No hay actividades con estos filtros')).toBeInTheDocument();
  expect(screen.getByLabelText('Disciplina')).toHaveValue('Bienestar');
  expect(screen.getByLabelText('Edad (opcional)')).toHaveValue(15);
  expect(screen.getByLabelText('Actividades seleccionadas')).toHaveTextContent('3');
  await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]);
  expect(screen.getByLabelText('Disciplina')).toHaveValue('');
  expect(screen.getByLabelText('Edad (opcional)')).toHaveValue(null);
  expect(filas()).toHaveLength(8);
});

test.each([[13, 1], [60, 1], [12, 0]])('el filtro respeta los límites de Vóley a los %i años', async (edad, cantidad) => {
  const { user } = montar();
  await user.selectOptions(screen.getByLabelText('Disciplina'), 'Vóley');
  await user.type(screen.getByLabelText('Edad (opcional)'), String(edad));
  expect(screen.queryAllByRole('article')).toHaveLength(cantidad);
});

test('abrir y cerrar el detalle mantiene los filtros y explica una inscripción duplicada', async () => {
  const { user } = montar();
  await user.selectOptions(screen.getByLabelText('Disciplina'), 'Bienestar');
  await user.click(screen.getByRole('link', { name: 'Ver detalle de Yoga' }));
  const region = await screen.findByRole('region', { name: 'Yoga', exact: true });
  expect(region).toHaveAttribute('id', 'activity-detail');
  expect(within(region).getByRole('button', { name: 'Inscribirme' })).toBeDisabled();
  expect(within(region).getByText(/Ya tenés una inscripción activa/)).toBeInTheDocument();
  await user.click(within(region).getByRole('link', { name: 'Cerrar detalle' }));
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Yoga', exact: true })).not.toBeInTheDocument());
  expect(screen.getByLabelText('Disciplina')).toHaveValue('Bienestar');
  expect(filas()).toHaveLength(1);
});

test('la edad de búsqueda no sustituye la edad real para inscribirse', async () => {
  const { user } = montar();
  await user.selectOptions(screen.getByLabelText('Disciplina'), 'Fútbol');
  await user.type(screen.getByLabelText('Edad (opcional)'), '10');
  await user.click(screen.getByRole('link', { name: 'Ver detalle de Fútbol infantil' }));
  const region = await screen.findByRole('region', { name: 'Fútbol infantil', exact: true });
  expect(within(region).getByRole('button', { name: 'Inscribirme' })).toBeDisabled();
  expect(within(region).getByText(/Tenés .* años/)).toBeInTheDocument();
  expect(screen.getByLabelText('Actividades seleccionadas')).toHaveTextContent('3');
});

test('un alta válida usa la acción compartida y no permite duplicarla', async () => {
  const { user } = montar({ ruta: '/actividades/6', socios: [{ ...SOCIOS[0], actividadesIniciales: [4, 7] }] });
  const region = detalle('Ajedrez');
  await user.click(within(region).getByRole('button', { name: 'Inscribirme' }));
  expect(screen.getByLabelText('Actividades seleccionadas')).toHaveTextContent('3');
  expect(screen.getByLabelText('Mensaje local')).toHaveTextContent('Te inscribiste a Ajedrez');
  expect(within(region).getByRole('button', { name: 'Inscribirme' })).toBeDisabled();
});

test('cupo completo permanece visible y no modifica las selecciones', () => {
  montar({ ruta: '/actividades/6', socios: [{ ...SOCIOS[0], actividadesIniciales: [] }],
    actividades: [{ ...ACTIVIDADES[5], cupoMaximo: 8, ocupadosIniciales: 8 }] });
  const tarjeta = screen.getByRole('article', { name: 'Ajedrez', exact: true });
  expect(tarjeta).toHaveClass('agenda__entry--sin-cupo');
  expect(within(tarjeta).getByText('Sin cupo', { exact: true })).toBeInTheDocument();
  expect(within(detalle('Ajedrez')).getByRole('button', { name: 'Inscribirme' })).toBeDisabled();
  expect(screen.getByLabelText('Actividades seleccionadas')).toHaveTextContent('0');
});

test('un ID desconocido ofrece recuperación sin romper la agenda', () => {
  montar({ ruta: '/actividades/99' });
  expect(screen.getByRole('alert')).toHaveTextContent('No encontramos esta actividad');
  expect(screen.getByRole('link', { name: 'Volver a la agenda' })).toHaveAttribute('href', '/actividades');
  expect(filas()).toHaveLength(8);
});

test('TarjetaActividad registra validación PropTypes del modelo real', () => {
  const warning = jest.spyOn(console, 'error').mockImplementation(() => {});
  PropTypes.resetWarningCache();
  try {
    PropTypes.checkPropTypes(TarjetaActividad.propTypes, { actividad: { ...ACTIVIDADES[0], cuotaMensual: 'incorrecta' } }, 'prop', 'TarjetaActividad');
    expect(warning.mock.calls.flat().join(' ')).toContain('cuotaMensual');
  } finally { warning.mockRestore(); }
});

describe('Pruebas de componente sobre TarjetaActividad (Parte E)', () => {
  test('muestra el nombre de la actividad y permite inscribirse con fireEvent cuando hay cupo', () => {
    const onInscribir = jest.fn();
    renderConClub(<TarjetaActividad actividad={ACTIVIDADES[5]} onInscribir={onInscribir} />, {
      socios: [{ ...SOCIOS[0], actividadesIniciales: [] }],
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Ajedrez' })).toBeInTheDocument();
    const boton = screen.getByRole('button', { name: 'Inscribirme' });
    expect(boton).toBeEnabled();
    fireEvent.click(boton);
    expect(onInscribir).toHaveBeenCalledWith(ACTIVIDADES[5].id);
  });

  test('con cupo 0 muestra "Sin cupo", aplica clase dinámica y deshabilita el botón', () => {
    const onInscribir = jest.fn();
    const actividadSinCupo = { ...ACTIVIDADES[5], cupoMaximo: 8, ocupadosIniciales: 8 };
    renderConClub(<TarjetaActividad actividad={actividadSinCupo} onInscribir={onInscribir} />, {
      socios: [{ ...SOCIOS[0], actividadesIniciales: [] }],
      actividades: [actividadSinCupo],
    });
    const tarjeta = screen.getByRole('article', { name: 'Ajedrez', exact: true });
    expect(tarjeta).toHaveClass('agenda__entry--sin-cupo');
    expect(within(tarjeta).getByText('Sin cupo', { exact: true })).toBeInTheDocument();
    const boton = within(tarjeta).getByRole('button', { name: 'Inscribirme' });
    expect(boton).toBeDisabled();
    fireEvent.click(boton);
    expect(onInscribir).not.toHaveBeenCalled();
  });
});
