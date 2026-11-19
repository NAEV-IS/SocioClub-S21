import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
});

export async function obtenerActividades(disciplina = '') {
  const params = disciplina ? { disciplina } : undefined;
  const { data } = await api.get('/actividades', { params });
  return data;
}

export async function obtenerActividadPorId(id) {
  const { data } = await api.get(`/actividades/${id}`);
  return data;
}

export async function buscarSocioPorDni(dni) {
  const { data } = await api.get(`/socios/dni/${encodeURIComponent(dni)}`);
  return data;
}

export async function obtenerInscripcionesSocio(socioId) {
  const { data } = await api.get(`/socios/${socioId}/inscripciones`);
  return data;
}

export async function inscribirSocio(socioId, actividadId) {
  const { data } = await api.post('/inscripciones', { socioId, actividadId });
  return data;
}

export async function darDeBajaInscripcion(inscripcionId) {
  const { data } = await api.put(`/inscripciones/${inscripcionId}/baja`);
  return data;
}

export function extraerMensajeError(error, mensajePorDefecto) {
  return error?.response?.data?.error || mensajePorDefecto;
}

export default api;
