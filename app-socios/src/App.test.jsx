import { screen, within, waitFor } from '@testing-library/react';
import { renderConClub } from './test/renderClub';
import App from './App';

const montar = options => renderConClub(<App />, options);
const cuota = () => screen.getByRole('complementary', { name: 'Tu cuota mensual' });
async function ingresar(user, dni) {
  await user.type(screen.getByLabelText('DNI, sin puntos ni espacios'), dni);
  await user.click(screen.getByRole('button', { name: 'Ingresar', exact: true }));
}
async function cancelarYoga(user) {
  const yoga = screen.getByRole('article', { name: 'Yoga', exact: true });
  await user.click(within(yoga).getByRole('button', { name: 'Cancelar inscripción', exact: true }));
  await user.click(within(yoga).getByRole('button', { name: 'Sí, cancelar inscripción', exact: true }));
}

test('sin un perfil seleccionado exige DNI y retoma el detalle solicitado', async () => {
  const { user } = montar({ ruta: '/actividades/6', dniInicial: null });
  expect(await screen.findByRole('heading', { name: 'Ingresá como socio' })).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Ajedrez', exact: true })).not.toBeInTheDocument();
  await ingresar(user, '32456789');
  expect(await screen.findByRole('region', { name: 'Ajedrez', exact: true })).toBeInTheDocument();
  expect(within(screen.getByRole('banner')).getByText('Camila Ludueña')).toBeInTheDocument();
});

test('el shell conserva navegación, un único main y un pie honesto sobre los datos', async () => {
  const { user } = montar();
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(screen.getByRole('main')).toHaveAttribute('id', 'app-main');
  expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#app-main');
  expect(within(screen.getByRole('contentinfo')).getByText(/Los cambios se pierden al recargar/)).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Mis actividades', exact: true }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Mis actividades' })).toBeInTheDocument();
  expect(within(cuota()).getByText(/^\$\s*55\.250$/)).toBeInTheDocument();
});

test('navegar entre agenda y mis actividades mantiene los filtros', async () => {
  const { user } = montar();
  await user.click(screen.getByRole('button', { name: 'Lunes', exact: true }));
  await user.click(screen.getByRole('link', { name: 'Mis actividades', exact: true }));
  await user.click(screen.getByRole('link', { name: 'Actividades', exact: true }));
  expect(screen.getByRole('button', { name: 'Lunes', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(3);
});

test('confirmar Yoga y dar de alta Ajedrez actualiza cupo, contador, avisos y cuota', async () => {
  const { user } = montar({ ruta: '/mis-actividades' });
  const yoga = screen.getByRole('article', { name: 'Yoga', exact: true });
  await user.click(within(yoga).getByRole('button', { name: 'Cancelar inscripción', exact: true }));
  expect(within(cuota()).getByText(/^\$\s*55\.250$/)).toBeInTheDocument();
  expect(screen.getByLabelText('Actividades activas')).toHaveTextContent('3 actividades');
  await user.click(within(yoga).getByRole('button', { name: 'Sí, cancelar inscripción', exact: true }));
  expect(within(cuota()).getByText(/^\$\s*43\.200$/)).toBeInTheDocument();
  expect(screen.getByLabelText('Actividades activas')).toHaveTextContent('2 actividades');
  expect(screen.getByRole('status', { name: 'Mensajes de la aplicación' })).toHaveTextContent('Cancelaste tu inscripción a Yoga');
  await user.click(screen.getByRole('link', { name: 'Actividades', exact: true }));
  expect(within(screen.getByRole('article', { name: 'Yoga', exact: true })).getByText('2 lugares libres')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Ver detalle de Ajedrez' }));
  await user.click(within(screen.getByRole('region', { name: 'Ajedrez', exact: true })).getByRole('button', { name: 'Inscribirme' }));
  expect(screen.getByLabelText('Actividades activas')).toHaveTextContent('3 actividades');
  expect(screen.getByRole('status', { name: 'Mensajes de la aplicación' })).toHaveTextContent('Te inscribiste a Ajedrez');
  expect(within(screen.getByRole('article', { name: 'Ajedrez', exact: true })).getByText('9/16 ocupados')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Mis actividades', exact: true }));
  expect(within(cuota()).getByText(/^\$\s*48\.450$/)).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Yoga', exact: true })).not.toBeInTheDocument();
});

test('cambiar de socio aísla sus actividades y conserva las modificaciones de Camila', async () => {
  const { user } = montar({ ruta: '/mis-actividades' });
  await cancelarYoga(user);
  await user.click(screen.getByRole('link', { name: 'Cambiar socio', exact: true }));
  await ingresar(user, '35345678');
  expect(within(screen.getByRole('banner')).getByText('Bruno Castro')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Ver detalle de Ajedrez' }));
  const boton = within(screen.getByRole('region', { name: 'Ajedrez', exact: true })).getByRole('button', { name: 'Inscribirme' });
  expect(boton).toBeDisabled();
  await user.click(boton);
  expect(screen.getByLabelText('Actividades activas')).toHaveTextContent('0 actividades');
  await user.click(screen.getByRole('link', { name: 'Mis actividades', exact: true }));
  expect(screen.getByText('Todavía no tenés actividades activas')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Cambiar socio', exact: true }));
  await ingresar(user, '32456789');
  await user.click(screen.getByRole('link', { name: 'Mis actividades', exact: true }));
  expect(within(cuota()).getByText(/^\$\s*43\.200$/)).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Yoga', exact: true })).not.toBeInTheDocument();
});

test('cerrar un detalle devuelve el foco al enlace que lo abrió', async () => {
  const { user } = montar();
  await user.click(screen.getByRole('link', { name: 'Ver detalle de Ajedrez' }));
  const region = await screen.findByRole('region', { name: 'Ajedrez', exact: true });
  expect(region).toHaveFocus();
  await user.click(within(region).getByRole('link', { name: 'Cerrar detalle' }));
  await waitFor(() => expect(screen.getByRole('link', { name: 'Ver detalle de Ajedrez' })).toHaveFocus());
  expect(screen.getByRole('link', { name: 'Ver detalle de Ajedrez' })).toHaveProperty('tabIndex', 0);
});

test('una página desconocida ofrece recuperación sin otro main', () => {
  montar({ ruta: '/no-existe' });
  expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toHaveAttribute('id', 'page-title');
  expect(screen.getByRole('link', { name: 'Volver a actividades' })).toHaveAttribute('href', '/actividades');
  expect(screen.getAllByRole('main')).toHaveLength(1);
});
