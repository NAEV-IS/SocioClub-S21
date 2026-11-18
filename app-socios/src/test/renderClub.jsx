import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SocioProvider } from '../context/SocioContext';

// Supply Routes inside ui when a test needs named URL parameters.
export function renderConClub(ui, { ruta = '/actividades', dniInicial = '32456789', socios, actividades } = {}) {
  const user = userEvent.setup();
  const view = render(<MemoryRouter initialEntries={[ruta]}>
    <SocioProvider dniInicial={dniInicial} socios={socios} actividades={actividades}>{ui}</SocioProvider>
  </MemoryRouter>);
  return { user, ...view };
}
