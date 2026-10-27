# 📅 Plan de Trabajo - SocioClub

Roadmap detallado de desarrollo para el proyecto **SocioClub** del Club Social y Deportivo Los Algarrobos.

---

## Estado actual: Semana 1 (40% completado)

### ✅ Completado

#### Parte A - Sitio Público
- [x] Estructura HTML5 semántica (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`)
- [x] CSS responsivo con selectores de tipo, clase, ID y atributo
- [x] Media query para diseño móvil (`@media (max-width: 600px)`)
- [x] JavaScript vanilla con clase `Actividad` y método `esAptaParaEdad(edad)`
- [x] Filtros por disciplina y edad con `addEventListener`
- [x] Validación de formulario sin `alert()` (mensajes de error en el DOM y regla RN7)
- [x] Uso de `history.back()` en botón Volver

#### Parte B - Backend (Parcial)
- [x] Proyecto Maven con Spring Boot 3.x y Java 17
- [x] Arquitectura en capas: `model`, `repository`, `service`, `controller`
- [x] Entidades JPA: `Socio`, `Actividad`, `Inscripcion` (sin Lombok, con getters/setters manuales)
- [x] Enums: `EstadoCuota` (`AL_DIA`, `MOROSO`), `EstadoInscripcion` (`ACTIVA`, `BAJA`)
- [x] Repositorios con `JpaRepository`
- [x] Métodos derivados: `findByDisciplina`, `findByNombreContainingIgnoreCase`, `findByApellidoContainingIgnoreCase`, `findByDni`
- [x] Consulta `@Query`: `countActivasByActividadId`
- [x] `ActividadService` con cálculo de cupo disponible
- [x] `ActividadController` con ABM completo
- [x] Vistas Thymeleaf con fragmentos reutilizables (`header` y `footer`) y selector de días por botones
- [x] Base de datos MySQL en Docker con las 8 actividades y 15 socios iniciales

### 🔄 En progreso
- [ ] Pruebas manuales integrales del ABM de actividades
- [ ] Verificación de persistencia de datos tras reinicio de contenedores

---

## ⏳ Pendiente

## Semana 2 (70% - Entrega: `[FECHA SEMANA 2]`)

### Parte B - Backend (Completar)
- [ ] `SocioService` y `SocioController` con ABM completo
- [ ] Listado paginado de socios con `Pageable`
- [ ] Búsqueda de socios por apellido (`findByApellidoContainingIgnoreCase`)
- [ ] Formulario Thymeleaf de alta y edición de socios
- [ ] `InscripcionService` con implementación de las reglas de negocio:
  - [ ] **RN1:** Validación de cupo disponible
  - [ ] **RN2:** Validación de inscripciones duplicadas
  - [ ] **RN3:** Validación de rango de edad permitido por la actividad
  - [ ] **RN4:** Validación de estado de cuota (`MOROSO` no puede inscribirse)
  - [ ] **RN5:** Validación de máximo 3 actividades activas por socio
- [ ] Formulario Thymeleaf de inscripción (selección de socio + actividad)
- [ ] Listado de inscriptos activos por actividad y baja lógica
- [ ] Vista de detalle de inscripción

### Parte D - App React (Iniciar)
- [ ] Inicializar proyecto en carpeta `app-socios/`
- [ ] Configurar React Router con 4 rutas:
  - [ ] `/` → Ingreso de socio por DNI
  - [ ] `/actividades` → Catálogo de actividades con filtros
  - [ ] `/actividades/:id` → Detalle de actividad con botón "Inscribirme"
  - [ ] `/mis-actividades` → Inscripciones activas del socio y resumen de cuota
- [ ] Desarrollar componentes funcionales:
  - [ ] `Encabezado`
  - [ ] `Pie`
  - [ ] `TarjetaActividad`
  - [ ] `ListaActividades`
  - [ ] `DetalleActividad`
  - [ ] `MisActividades`
  - [ ] `ResumenCuota`
- [ ] Implementar `Context` para el estado global del socio logueado
- [ ] Prueba inicial con datos locales (previo a la conexión con la API REST)
- [ ] Validación de propiedades con `PropTypes` en `TarjetaActividad` y `ResumenCuota`

---

## Semana 3 (90% - Entrega: `[FECHA SEMANA 3]`)

### Parte C - API REST
- [ ] `ActividadRestController` con endpoints:
  - [ ] `GET /api/actividades` (con filtro opcional `?disciplina=`)
  - [ ] `GET /api/actividades/{id}`
  - [ ] `POST /api/actividades`
  - [ ] `PUT /api/actividades/{id}`
  - [ ] `DELETE /api/actividades/{id}`
- [ ] `SocioRestController` con endpoints:
  - [ ] `GET /api/socios/dni/{dni}`
  - [ ] `GET /api/socios/{id}/inscripciones`
- [ ] `InscripcionRestController` con endpoints:
  - [ ] `POST /api/inscripciones` (aplicando RN1–RN5 y formato de error 409 `{ "error": "...", "regla": "RNx" }`)
  - [ ] `PUT /api/inscripciones/{id}/baja`
- [ ] Configuración de CORS habilitada para `http://localhost:3000`
- [ ] Manejo de errores HTTP (`404 Not Found`, `409 Conflict`)
- [ ] Colección Postman documentando todos los endpoints y casos de prueba

### Parte D - App React (Conectar con API)
- [ ] Crear servicio HTTP `src/servicios/api.js` utilizando **Axios** (sin `fetch()` nativo)
- [ ] Conectar vistas con la API REST:
  - [ ] Ingreso por DNI → `GET /api/socios/dni/{dni}`
  - [ ] Catálogo → `GET /api/actividades`
  - [ ] Inscripción → `POST /api/inscripciones`
  - [ ] Baja lógica → `PUT /api/inscripciones/{id}/baja`
- [ ] Manejo de errores HTTP `409` mostrando al socio el mensaje específico de la regla de negocio violada
- [ ] Renderizado condicional:
  - [ ] Etiqueta `"Sin cupo"` cuando `cupoDisponible === 0`
  - [ ] Botón de inscripción deshabilitado cuando no hay cupo
  - [ ] Mensaje informativo cuando el socio aún no posee actividades activas
- [ ] Clase CSS dinámica para diferenciar visualmente las tarjetas sin cupo

### Parte E - Pruebas
- [ ] **Jest** — Pruebas unitarias (mínimo 6 tests):
  - [ ] Función `calcularCuotaMensual` con 0, 1, 2 (10% dto.) y 3 (15% dto.) actividades (RN6)
  - [ ] Función `esDniValido` con casos válidos e inválidos (RN7)
- [ ] **React Testing Library (RTL)** — Pruebas de componentes (mínimo 2 tests):
  - [ ] `TarjetaActividad` renderiza correctamente el nombre de la actividad
  - [ ] `TarjetaActividad` con cupo 0 muestra el indicador `"Sin cupo"`
- [ ] Pruebas de integración de API con Postman
- [ ] Ejecución y documentación de la prueba de sistema (6 casos de prueba)

---

## Entrega Final (100% - Fecha: `[FECHA ENTREGA FINAL]`)

### Documentación y Entregables
- [ ] `README.md` final actualizado con instrucciones completas
- [ ] Informe técnico en PDF (8 a 12 páginas):
  - [ ] Descripción general de la solución
  - [ ] Diagrama de arquitectura en capas
  - [ ] Modelo entidad-relación de la base de datos
  - [ ] Tabla detallada de endpoints MVC y REST
  - [ ] Capturas de pantalla de las 3 interfaces (Sitio Público, Backoffice Thymeleaf y App React)
  - [ ] Evidencia de resultados de pruebas (Jest, RTL, Postman y Sistema)
  - [ ] Conclusiones del equipo
- [ ] Bitácora de uso de IA (Anexo D — mínimo 5 entradas documentadas)
- [ ] Colección Postman exportada (`.json`)
- [ ] Script SQL final de base de datos (`db/init/02-data.sql`)

### Preparación para la Defensa Oral
- [ ] Ensayo general de exposición (20 minutos)
- [ ] Repaso técnico individual de cada capa del proyecto
- [ ] Verificación de todos los contenedores Docker corriendo antes del turno de defensa
