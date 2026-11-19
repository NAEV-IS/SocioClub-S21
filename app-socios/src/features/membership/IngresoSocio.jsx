import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocio } from '../../context/SocioContext';
import { calcularEdad } from '../../domain/club';
import { nombreCompleto } from '../../domain/formato';
import './membership.css';

export default function IngresoSocio() {
  const { iniciarSesion, sociosEjemplo, inscripciones } = useSocio();
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const campo = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  async function ingresar(event) {
    event.preventDefault();
    const resultado = await iniciarSesion(dni);
    if (!resultado.ok) {
      setError(resultado.mensaje);
      campo.current.focus();
      return;
    }
    // The shell supplies a local pathname, never an external navigation target.
    const desde = location.state?.desde;
    const destinoLocal = typeof desde === 'string' && /^\/(?!\/)[^\\\s?#]*$/.test(desde);
    navigate(destinoLocal ? desde : '/actividades', { replace: true });
  }

  return <div className="login">
    <section className="login__form panel" aria-labelledby="page-title">
      <h1 id="page-title">Ingresá como socio</h1>
      <p className="muted">Usá un DNI de ejemplo para explorar tu agenda.</p>
      <form onSubmit={ingresar} noValidate>
        <div className="field">
          <label htmlFor="dni">DNI, sin puntos ni espacios</label>
          <input ref={campo} id="dni" name="dni" type="text" inputMode="numeric"
            autoComplete="off" value={dni} onChange={event => setDni(event.target.value)}
            aria-invalid={Boolean(error)} aria-describedby={`dni-help${error ? ' dni-error' : ''}`} />
        </div>
        {error && <p id="dni-error" className="field-error" role="alert">{error}</p>}
        <button className="button" type="submit">Ingresar</button>
        <p id="dni-help" className="support">Solo 7 u 8 dígitos. Es una simulación de ingreso, no una autenticación real.</p>
      </form>
    </section>
    <section className="login__samples" aria-labelledby="samples-title">
      <h2 id="samples-title">Socios de ejemplo</h2>
      <p className="muted">Elegí un perfil para probar disponibilidad, edades y cuota.</p>
      {sociosEjemplo.map(socio => {
        const ejemploIds = inscripciones[socio.dni];
        return <div className="login__sample" key={socio.dni}>
          <strong>{nombreCompleto(socio)}</strong>
          <p className="support">DNI {socio.dni} · {calcularEdad(socio.fechaNacimiento)} años</p>
          <p className="support">
            {socio.estadoCuota === 'MOROSO' ? 'Cuota pendiente · MOROSO' : 'Cuota al día'}
            {ejemploIds ? ` · ${ejemploIds.length} actividades en esta demostración` : ''}
          </p>
        </div>;
      })}
    </section>
  </div>;
}
