import { screen, within } from '@testing-library/react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { ACTIVIDADES } from '../../data/fixtures';
import { renderConClub } from '../../test/renderClub';
import IngresoSocio from './IngresoSocio';
import MisActividades from './MisActividades';
import ResumenCuota from './ResumenCuota';

// Observe shared state only through the public Context API, never reducer storage.
function EstadoPublico() {
  const { socio, misActividades, actividades, obtenerCupo, filtros, setFiltros } = useSocio();
  const location = useLocation();
  return <div>
    <output aria-label="Ruta actual">{location.pathname}</output>
    <output aria-label="Socio seleccionado">{socio?.dni || 'Ninguno'}</output>
    <output aria-label="Actividades seleccionadas">{misActividades.map(item => item.nombre).join(', ') || 'Ninguna'}</output>
    <output aria-label="Lugares libres">{actividades.map(item => `${item.nombre}: ${obtenerCupo(item)}`).join(', ')}</output>
    <output aria-label="Filtros actuales">{filtros.disciplina || 'Todas'}</output>
    <button onClick={() => setFiltros(actual => ({ ...actual, disciplina: 'Natación' }))}>Elegir filtro</button>
    <Link to="/">Cambiar socio</Link>
    <Link to="/mis-actividades">Abrir mis actividades</Link>
  </div>;
}

function Vistas() {
  return <>
    <EstadoPublico />
    <Routes>
      <Route path="/" element={<IngresoSocio />} />
      <Route path="/mis-actividades" element={<MisActividades />} />
      <Route path="/actividades/*" element={<p>Agenda de destino</p>} />
    </Routes>
  </>;
}

function campoDni() {
  return screen.getByRole('textbox', { name: 'DNI, sin puntos ni espacios' });
}

async function ingresar(user, dni) {
  await user.clear(campoDni());
  if (dni) await user.type(campoDni(), dni);
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

function partida(region, etiqueta, importe) {
  const termino = within(region).getByText(etiqueta, { selector: 'dt' });
  expect(termino.nextElementSibling.textContent.replace(/\s/g, ' ')).toBe(importe);
}

function cuota({ cantidad, base, porcentaje, bonificacion, total }) {
  const resumen = screen.getByRole('complementary', { name: 'Tu cuota mensual' });
  expect(within(resumen).getByText(`${cantidad} de 3 actividades activas`)).toBeInTheDocument();
  partida(resumen, 'Suma de actividades', base);
  partida(resumen, `Bonificación (${porcentaje}%)`, `−${bonificacion}`);
  partida(resumen, 'Total mensual', total);
  return resumen;
}

const cuotaTres = { cantidad: 3, base: '$ 65.000', porcentaje: 15, bonificacion: '$ 9.750', total: '$ 55.250' };
const cuotaDos = { cantidad: 2, base: '$ 39.000', porcentaje: 10, bonificacion: '$ 3.900', total: '$ 35.100' };
const cuotaUna = { cantidad: 1, base: '$ 22.000', porcentaje: 0, bonificacion: '$ 0', total: '$ 22.000' };
const cuotaCero = { cantidad: 0, base: '$ 0', porcentaje: 0, bonificacion: '$ 0', total: '$ 0' };

describe('Ingreso local por DNI', () => {
  test('labels the string input, bypasses native validation, and honestly lists the three profiles', () => {
    renderConClub(<Vistas />, { ruta: '/', dniInicial: null });
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresá como socio' })).toHaveAttribute('id', 'page-title');
    expect(campoDni()).toHaveAttribute('type', 'text');
    expect(campoDni()).toHaveAttribute('inputmode', 'numeric');
    expect(campoDni()).not.toHaveAttribute('maxlength');
    expect(campoDni().closest('form')).toHaveAttribute('novalidate');
    expect(screen.getByText(/no una autenticación real/)).toBeInTheDocument();
    const ejemplos = screen.getByRole('region', { name: 'Socios de ejemplo' });
    for (const nombre of ['Camila Ludueña', 'Bruno Castro', 'Thiago Molina']) {
      expect(within(ejemplos).getByText(nombre)).toBeInTheDocument();
    }
    for (const dni of ['32456789', '35345678', '45123456']) {
      expect(within(ejemplos).getByText(new RegExp(`DNI ${dni}`))).toBeInTheDocument();
    }
    expect(within(ejemplos).getByText(/Cuota pendiente · MOROSO/)).toBeInTheDocument();
  });

  test.each(['', '123456', '324567890', ' 32456789', '32456789 ', '32.456.789', '32a56789', '１２３４５６７８', '1234567', '99999999'])(
    'retains rejected input %j, shows the exact shared error, and preserves member, selections, places and route', async dni => {
      const { user } = renderConClub(<Vistas />, { ruta: '/' });
      const actividades = screen.getByLabelText('Actividades seleccionadas').textContent;
      const lugares = screen.getByLabelText('Lugares libres').textContent;
      await user.click(screen.getByRole('button', { name: 'Elegir filtro' }));
      await ingresar(user, dni);
      expect(campoDni()).toHaveValue(dni);
      expect(campoDni()).toHaveAttribute('aria-invalid', 'true');
      const desconocido = ['1234567', '99999999'].includes(dni);
      expect(screen.getByRole('alert')).toHaveTextContent(desconocido
        ? 'No encontramos ese DNI entre los socios de ejemplo.'
        : 'El DNI debe tener 7 u 8 dígitos, sin puntos ni espacios.');
      expect(campoDni()).toHaveAttribute('aria-describedby', expect.stringContaining(screen.getByRole('alert').id));
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/$/);
      expect(screen.getByLabelText('Socio seleccionado')).toHaveTextContent('32456789');
      expect(screen.getByLabelText('Actividades seleccionadas').textContent).toBe(actividades);
      expect(screen.getByLabelText('Lugares libres').textContent).toBe(lugares);
      expect(screen.getByLabelText('Filtros actuales')).toHaveTextContent('Natación');
    },
  );

  test.each(['32456789', '35345678', '45123456'])(
    'selects the existing profile %s and navigates to the agenda', async dni => {
      const { user } = renderConClub(<Vistas />, { ruta: '/', dniInicial: null });
      await ingresar(user, dni);
      expect(screen.getByLabelText('Socio seleccionado')).toHaveTextContent(dni);
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/actividades$/);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  test.each(['/actividades/4', '/mis-actividades'])(
    'returns to the local requested pathname %s after selection', async desde => {
      const { user } = renderConClub(<Vistas />, { ruta: { pathname: '/', state: { desde } }, dniInicial: null });
      await ingresar(user, '32456789');
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(desde);
    },
  );

  test.each(['https://example.test', '//example.test', '/\\example.test'])(
    'never treats %s as a local return target', async desde => {
      const { user } = renderConClub(<Vistas />, { ruta: { pathname: '/', state: { desde } }, dniInicial: null });
      await ingresar(user, '32456789');
      expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/actividades$/);
    },
  );

  test('recovers from an invalid DNI without clearing it before a successful correction', async () => {
    const { user } = renderConClub(<Vistas />, { ruta: '/', dniInicial: null });
    await ingresar(user, '99999999');
    expect(campoDni()).toHaveValue('99999999');
    expect(screen.getByLabelText('Socio seleccionado')).toHaveTextContent('Ninguno');
    await ingresar(user, '45123456');
    expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/actividades$/);
    expect(screen.getByLabelText('Actividades seleccionadas')).toHaveTextContent('Ninguna');
  });
});

describe('Mis actividades', () => {
  test('renders active weekly schedules, item fees and links, in time order', () => {
    renderConClub(<Vistas />, { ruta: '/mis-actividades' });
    expect(screen.getByRole('heading', { level: 1, name: 'Mis actividades' })).toHaveAttribute('id', 'page-title');
    expect(screen.getByRole('link', { name: 'Explorar agenda' })).toHaveAttribute('href', '/actividades');
    const entradas = screen.getAllByRole('article');
    expect(entradas.map(item => within(item).getByRole('heading').textContent)).toEqual(['Yoga', 'Natación', 'Funcional adultos']);
    for (const [indice, nombre, horario, dias, profesor, importe, id] of [
      [0, 'Yoga', '09:00', 'Mar · Jue', 'Inés Arguello', /17\.000/, 8],
      [1, 'Natación', '17:00', 'Mar · Jue', 'Sofía Bustos', /26\.000/, 4],
      [2, 'Funcional adultos', '20:30', 'Lun · Mié · Vie', 'Paula Luna', /22\.000/, 7],
    ]) {
      const entrada = within(entradas[indice]);
      expect(entrada.getByRole('link', { name: nombre })).toHaveAttribute('href', `/actividades/${id}`);
      expect(entrada.getByText(horario)).toHaveAttribute('datetime', horario);
      expect(entrada.getByText(new RegExp(dias))).toBeInTheDocument();
      expect(entrada.getByText(new RegExp(profesor))).toBeInTheDocument();
      expect(entrada.getByText(importe)).toBeInTheDocument();
    }
    cuota(cuotaTres);
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
  });

  test('requires inline confirmation, keeps all data until confirmed, and lets the member keep the enrollment', async () => {
    const { user } = renderConClub(<Vistas />, { ruta: '/mis-actividades' });
    const natacion = screen.getByRole('article', { name: 'Natación' });
    const lugares = screen.getByLabelText('Lugares libres').textContent;
    await user.click(within(natacion).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(within(natacion).getByText('¿Cancelar Natación?')).toBeInTheDocument();
    expect(within(natacion).getByRole('button', { name: 'Mantener inscripción' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByLabelText('Lugares libres').textContent).toBe(lugares);
    cuota(cuotaTres);
    await user.click(within(natacion).getByRole('button', { name: 'Mantener inscripción' }));
    expect(within(natacion).queryByText('¿Cancelar Natación?')).not.toBeInTheDocument();
    expect(within(natacion).getByRole('button', { name: 'Cancelar inscripción' })).toHaveFocus();
    expect(screen.getByLabelText('Lugares libres').textContent).toBe(lugares);
    cuota(cuotaTres);
  });

  test('switches inline confirmation to an earlier schedule without moving focus back to the old trigger', async () => {
    const { user } = renderConClub(<Vistas />, { ruta: '/mis-actividades' });
    const lugares = screen.getByLabelText('Lugares libres').textContent;
    const natacion = screen.getByRole('article', { name: 'Natación' });
    const yoga = screen.getByRole('article', { name: 'Yoga' });
    await user.click(within(natacion).getByRole('button', { name: 'Cancelar inscripción' }));
    await user.click(within(yoga).getByRole('button', { name: 'Cancelar inscripción' }));
    expect(within(yoga).getByRole('button', { name: 'Mantener inscripción' })).toHaveFocus();
    expect(within(natacion).queryByText('¿Cancelar Natación?')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByLabelText('Lugares libres').textContent).toBe(lugares);
    cuota(cuotaTres);
  });

  test('confirmed cancellations update active schedules, capacity and the 3/2/1/0 fee states with empty recovery', async () => {
    const { user } = renderConClub(<Vistas />, { ruta: '/mis-actividades' });
    for (const [nombre, siguiente, cantidad] of [['Natación', cuotaDos, 2], ['Yoga', cuotaUna, 1], ['Funcional adultos', cuotaCero, 0]]) {
      const entrada = screen.getByRole('article', { name: nombre });
      await user.click(within(entrada).getByRole('button', { name: 'Cancelar inscripción' }));
      await user.click(within(entrada).getByRole('button', { name: 'Sí, cancelar inscripción' }));
      expect(screen.queryByRole('article', { name: nombre })).not.toBeInTheDocument();
      expect(screen.queryAllByRole('article')).toHaveLength(cantidad);
      cuota(siguiente);
    }
    expect(screen.getByLabelText('Lugares libres')).toHaveTextContent('Natación: 11');
    expect(screen.getByLabelText('Lugares libres')).toHaveTextContent('Yoga: 2');
    expect(screen.getByLabelText('Lugares libres')).toHaveTextContent('Funcional adultos: 15');
    expect(screen.getByRole('heading', { name: 'Todavía no tenés actividades activas' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Ver la agenda' }));
    expect(screen.getByLabelText('Ruta actual')).toHaveTextContent(/^\/actividades$/);
  });

  test('preserves member-specific changes and filters across navigation without transferring a pending cancellation', async () => {
    const { user } = renderConClub(<Vistas />, { ruta: '/mis-actividades' });
    await user.click(screen.getByRole('button', { name: 'Elegir filtro' }));
    let natacion = screen.getByRole('article', { name: 'Natación' });
    await user.click(within(natacion).getByRole('button', { name: 'Cancelar inscripción' }));
    await user.click(within(natacion).getByRole('button', { name: 'Sí, cancelar inscripción' }));
    await user.click(within(screen.getByRole('article', { name: 'Yoga' })).getByRole('button', { name: 'Cancelar inscripción' }));
    await user.click(screen.getByRole('link', { name: 'Cambiar socio' }));
    await ingresar(user, '35345678');
    await user.click(screen.getByRole('link', { name: 'Abrir mis actividades' }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    cuota(cuotaCero);
    await user.click(screen.getByRole('link', { name: 'Cambiar socio' }));
    await ingresar(user, '32456789');
    await user.click(screen.getByRole('link', { name: 'Abrir mis actividades' }));
    expect(screen.queryByRole('article', { name: 'Natación' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByText('¿Cancelar Yoga?')).not.toBeInTheDocument();
    cuota(cuotaDos);
    expect(screen.getByLabelText('Filtros actuales')).toHaveTextContent('Natación');
  });

  test('shows the existing empty member without borrowing another member’s activities', () => {
    renderConClub(<Vistas />, { ruta: '/mis-actividades', dniInicial: '45123456' });
    expect(screen.getByRole('heading', { name: 'Todavía no tenés actividades activas' })).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Ver la agenda' })).toHaveAttribute('href', '/actividades');
    cuota(cuotaCero);
  });
});

describe('ResumenCuota', () => {
  test.each([
    [[], cuotaCero],
    [[ACTIVIDADES[6]], cuotaUna],
    [[ACTIVIDADES[6], ACTIVIDADES[7]], cuotaDos],
    [[ACTIVIDADES[3], ACTIVIDADES[6], ACTIVIDADES[7]], cuotaTres],
  ])('itemizes the shared calculation for %j', (actividades, esperado) => {
    renderConClub(<ResumenCuota actividades={actividades} />);
    const resumen = cuota(esperado);
    expect(within(resumen).getByText(/2 actividades: 10% de descuento/)).toBeInTheDocument();
    expect(within(resumen).getByText(/3 actividades: 15% de descuento/)).toBeInTheDocument();
    expect(within(resumen).getByText(/no es una liquidación ni un medio de pago/)).toBeInTheDocument();
    expect(within(resumen).queryByRole('button')).not.toBeInTheDocument();
  });

  test('uses real required PropTypes and the shared numeric activity shape', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const vista = renderConClub(<ResumenCuota actividades={[ACTIVIDADES[3]]} />);
      expect(error).not.toHaveBeenCalled();
      vista.rerender(<ResumenCuota actividades={[{ ...ACTIVIDADES[3], id: '4' }]} />);
      expect(error.mock.calls.flat().join(' ')).toMatch(/Invalid prop.*actividades\[0\].id.*string.*number/);
      error.mockClear();
      vista.rerender(<ResumenCuota />);
      expect(error.mock.calls.flat().join(' ')).toMatch(/actividades.*required/);
    } finally {
      error.mockRestore();
    }
  });
});
