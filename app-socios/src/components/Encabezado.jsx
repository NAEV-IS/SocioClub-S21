import { Link, NavLink } from 'react-router-dom';
import { useSocio } from '../context/SocioContext';
import { calcularEdad } from '../domain/club';
import { nombreCompleto } from '../domain/formato';

export default function Encabezado() {
  const { socio, misActividades } = useSocio();
  return <header className="shell__header">
    <div className="container shell__brand-row">
      <Link className="shell__brand" to={socio ? '/actividades' : '/'} aria-label="SocioClub, inicio">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="1" y="1" width="38" height="38" rx="7" fill="currentColor" />
          <path d="M20 7 9 23h7l-5 7h7v4h4v-4h7l-5-7h7L20 7Z" fill="#fff" />
        </svg>
        <span><strong>SocioClub</strong><small>App de socios</small></span>
      </Link>
      <nav className="shell__nav" aria-label="Navegación principal">
        <NavLink to="/actividades">Actividades</NavLink>
        <NavLink to="/mis-actividades">Mis actividades</NavLink>
      </nav>
    </div>
    {socio && <div className="shell__profile-band"><div className="container shell__profile">
      <div><strong>{nombreCompleto(socio)}</strong><p className="support">DNI {socio.dni} · {calcularEdad(socio.fechaNacimiento)} años</p></div>
      <div className="shell__account-state">
        <span className={socio.estadoCuota === 'AL_DIA' ? 'shell__current' : 'shell__overdue'}>
          {socio.estadoCuota === 'AL_DIA' ? 'Cuota al día' : 'Cuota pendiente · MOROSO'}
        </span>
        <span aria-label="Actividades activas">{misActividades.length} {misActividades.length === 1 ? 'actividad' : 'actividades'}</span>
      </div>
      <Link className="shell__change" to="/">Cambiar socio</Link>
    </div></div>}
  </header>;
}
