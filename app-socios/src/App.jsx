import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSocio } from './context/SocioContext';
import Encabezado from './components/Encabezado';
import Pie from './components/Pie';
import IngresoSocio from './features/membership/IngresoSocio';
import MisActividades from './features/membership/MisActividades';
import ListaActividades from './features/agenda/ListaActividades';
import './styles/shell.css';

function RequiereSocio({ children }) {
  const { socio, cargando, sesionCerrada } = useSocio();
  const location = useLocation();
  if (cargando) {
    return <section className="panel"><p>Cargando datos del club...</p></section>;
  }
  return socio ? children : <Navigate to="/" replace state={sesionCerrada ? null : { desde: location.pathname }} />;
}
RequiereSocio.propTypes = { children: PropTypes.node.isRequired };

function PaginaNoEncontrada() {
  const { socio } = useSocio();
  return <section className="panel empty-state">
    <h1 id="page-title" tabIndex="-1">No encontramos esta página</h1>
    <p>Podés volver a un recorrido conocido sin perder tus cambios de ejemplo.</p>
    <Link className="button" to={socio ? '/actividades' : '/'}>{socio ? 'Volver a actividades' : 'Ingresar como socio'}</Link>
  </section>;
}

export default function App() {
  const { pathname } = useLocation();
  const anterior = useRef(pathname);
  const { aviso, limpiarAviso } = useSocio();

  useEffect(() => {
    limpiarAviso();
    const detalleAnterior = /^\/actividades\/(\d+)$/.exec(anterior.current);
    const retorno = pathname === '/actividades' && detalleAnterior
      ? document.querySelector(`[data-activity-id="${detalleAnterior[1]}"] a[data-detail-link]`) : null;
    const destino = retorno || document.getElementById('activity-detail') || document.getElementById('page-title');
    if (destino) {
      // Restoring an anchor must not remove it from the keyboard tab order.
      if (!retorno) destino.tabIndex = -1;
      destino.focus();
    }
    const titulo = document.getElementById('page-title')?.textContent || 'App de socios';
    document.title = `${titulo} · SocioClub`;
    anterior.current = pathname;
  }, [pathname, limpiarAviso]);

  useEffect(() => {
    // Confirmed cancellation removes its focused button; restore useful context.
    if (aviso.mensaje && document.activeElement === document.body) {
      const destino = document.getElementById('activity-detail') || document.getElementById('page-title');
      if (destino) { destino.tabIndex = -1; destino.focus(); }
    }
  }, [aviso.mensaje]);

  return <div className="app-shell">
    <a className="shell__skip" href="#app-main">Saltar al contenido</a>
    <Encabezado />
    <main id="app-main" className="container page-content" tabIndex="-1">
      <div role={aviso.tipo === 'error' ? 'alert' : 'status'} aria-label="Mensajes de la aplicación" aria-atomic="true">
        {aviso.mensaje && <div className={`notice shell__notice${aviso.tipo === 'error' ? ' notice--error' : ''}`}>
          <p>{aviso.mensaje}</p><button type="button" className="button button--secondary" onClick={limpiarAviso}>Cerrar aviso</button>
        </div>}
      </div>
      <Routes>
        <Route path="/" element={<IngresoSocio />} />
        <Route path="/actividades" element={<RequiereSocio><ListaActividades /></RequiereSocio>} />
        <Route path="/actividades/:id" element={<RequiereSocio><ListaActividades /></RequiereSocio>} />
        <Route path="/mis-actividades" element={<RequiereSocio><MisActividades /></RequiereSocio>} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </main>
    <Pie />
  </div>;
}
