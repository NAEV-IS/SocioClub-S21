# Entrega 2: recorridos para la exposición

Secretaría y la app de socios son dos aplicaciones distintas. Secretaría guarda los cambios en MySQL. En esta semana la app React usa datos locales: recargar la página restablece sus ejemplos. Una inscripción en React **no** aparece en Secretaría.

## Qué mostrar

1. **Sitio público:** abrir el catálogo, combinar disciplina y edad, y enviar el formulario con un DNI inválido para ver el mensaje junto al campo.
2. **Secretaría:** buscar un apellido en `/socios`, paginar y editar un socio de prueba. En `/inscripciones`, elegir socio y actividad. Mostrar cómo cambia el listado de activos y el cupo después del alta y de la baja confirmada.
3. **App de socios:** en `app-socios/`, usar Node ≥22.12, `npm ci --ignore-scripts` y `npm start`. Abrir `http://localhost:3000`, ingresar con `32456789` y navegar desde la agenda hasta Mis actividades. Camila comienza con tres actividades: $65.000 menos 15 % da $55.250.

## Casos comprobados en Secretaría

Usar una base nueva con los datos iniciales; no ejecutar estos pasos sobre la demo compartida si se quiere repetir el resultado exacto. Para el último lugar de Yoga hacen falta dos socios adultos nuevos, al día y sin inscripciones. Para los demás rechazos partir del estado inicial, sin mezclar reglas.

| Caso | Pasos | Resultado esperado | Resultado observado en MySQL aislado |
|---|---|---|---|
| Alta válida | Con Yoga en 14/15, inscribir al primer adulto | Alta persistida y cero lugares | Yoga quedó en 15/15 |
| RN1: cupo | Intentar inscribir al segundo adulto en Yoga | Rechazo sin sumar otra fila | Se informó falta de cupo; no hubo sobrecupo |
| RN2: duplicado | Con Yoga en 14/15, intentar inscribir de nuevo a Roberto Funes | Rechazo por inscripción activa previa | Mensaje de duplicado; datos sin cambios |
| RN3: edad | Intentar inscribir a Thiago Molina en Vóley mixto | Rechazo indicando el rango de 13 a 60 años | Rango informado; datos sin cambios |
| RN4: cuota | Intentar inscribir a Bruno Castro en Vóley mixto | Rechazo por cuota pendiente | Se pidió regularizar la cuota; datos sin cambios |
| RN5: máximo | Intentar inscribir a Camila Ludueña en Vóley mixto | Rechazo porque ya tiene tres actividades activas | Se informó el máximo de tres; datos sin cambios |

**Baja lógica:** confirmar la baja del primer adulto. Yoga vuelve a 14/15 y la inscripción histórica conserva el estado `BAJA`. Una nueva inscripción obtiene otro identificador.

## Evidencia y límites

- React: instalación limpia desde el lockfile, 85 pruebas y compilación de producción. En Chromium se comprobó el recorrido DNI → `/actividades` → «Agenda semanal».
- Secretaría: 5 pruebas HTTP de socios, 9 de inscripciones y 4 comprobaciones independientes de concurrencia e historial. Los dos primeros grupos están en `backend/src/test/http/`; las cuatro comprobaciones adicionales se ejecutaron como verificación independiente, no forman parte de esas suites. Las pruebas que escriben datos requieren una base descartable.
- API REST, Axios, Postman e informe final no forman parte de este hito. No usar datos personales reales en las demos.
