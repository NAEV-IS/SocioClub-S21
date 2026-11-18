# Agenda de actividades

`ListaActividades` presenta los ocho horarios de ejemplo y conserva los filtros de día, disciplina y edad en el Context compartido. `TarjetaActividad` mantiene el nombre exigido por la consigna, pero representa una fila de agenda, no una grilla de tarjetas.

- `/actividades`: filtros combinados, orden por horario y recuperación sin resultados.
- `/actividades/:id`: detalle en contexto y condiciones de inscripción; un ID desconocido ofrece volver.
- La edad de búsqueda no reemplaza la edad del socio. Las altas se realizan únicamente con la acción validada del Context.
- La introducción y el acceso duplicado retirados del artboard no se reincorporan.

Pruebas: `npm test -- --runTestsByPath src/features/agenda/agenda.test.jsx` desde `app-socios/`. Los estilos usan los tokens compartidos; no hay conexión a la base de datos ni autenticación real.
