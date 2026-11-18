import { screen, waitFor } from '@testing-library/react';
import { Link, useLocation } from 'react-router-dom';
import { useSocio } from '../context/SocioContext';
import { renderConClub } from './renderClub';

function Probe() {
  const { socio } = useSocio();
  const location = useLocation();
  return <>
    <output aria-label="Ruta">{location.pathname}</output>
    <output aria-label="Socio">{socio.nombre}</output>
    <Link to="/mis-actividades">Ir a mis actividades</Link>
  </>;
}

test('el harness combina Router 7, React 18 y Context sin perder la selección', async () => {
  const { user } = renderConClub(<Probe />);
  expect(screen.getByLabelText('Ruta')).toHaveTextContent('/actividades');
  expect(screen.getByLabelText('Socio')).toHaveTextContent('Camila');
  await user.click(screen.getByRole('link', { name: 'Ir a mis actividades' }));
  await waitFor(() => expect(screen.getByLabelText('Ruta')).toHaveTextContent('/mis-actividades'));
  expect(screen.getByLabelText('Socio')).toHaveTextContent('Camila');
});
