import { screen, within } from '@testing-library/react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { renderConClub } from '../../test/renderClub';
import IngresoSocio from './IngresoSocio';

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
      <Route path="/mis-actividades" element={<p>Mis actividades de destino</p>} />
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
