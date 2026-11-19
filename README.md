# SocioClub — Club Social y Deportivo Los Algarrobos

Sistema integral para el **Club Social y Deportivo Los Algarrobos** (Córdoba), compuesto por un **Sitio Público** (HTML5/CSS3/JS), un **Backoffice de Secretaría** + **API REST** en **Spring Boot** (Spring MVC, Thymeleaf, JPA/MySQL) y una **App de Socios en React** conectada mediante **Axios**.

## Integrantes del equipo

| Apellido y nombre |
| :--- |
| Carrara, Francisco |
| Demarchi, Facundo |
| Robledo, Thomas |
| Rosso, Gastón |
| Tamagusuku, Agustín |

---

## Arquitectura en capas y flujo completo del sistema

Todo el sistema comparte una **única base de datos MySQL** (`socioclub`) y un **único backend Spring Boot** que expone tanto las pantallas Thymeleaf de Secretaría como la API REST `/api` consumida por React.

```text
[ Navegador Vecino ]        [ Navegador Secretaría ]         [ Browser Socio ]
Sitio Público (:8081)       Thymeleaf SSR (:8080)            React + Axios (:3000)
HTML5 + CSS3 + JS           /actividades /socios             /  /actividades
                                /inscripciones               /actividades/:id
                                      |                      /mis-actividades
                                      |                             | JSON + CORS
                                      v                             v
                     +-------------------------------------------------------+
                     |            BACKEND SPRING BOOT (:8080)                |
                     |  MVC: Home / Actividad / Socio / Inscripcion          |
                     |  REST: ActividadRest / SocioRest / InscripcionRest    |
                     +-------------------------------------------------------+
                     |  SERVICIO (único lugar de reglas RN1 a RN5):          |
                     |   ActividadService · SocioService · InscripcionService|
                     +-------------------------------------------------------+
                     |  REPOSITORIO (Spring Data JPA + @Query + @Lock):      |
                     |   ActividadRepo · SocioRepo · InscripcionRepo         |
                     +-------------------------------------------------------+
                     |  MODELO (JPA sin Lombok, getters/setters manuales):   |
                     |   Socio · Actividad · Inscripcion                     |
                     +---------------------------+---------------------------+
                                                 v
                                       [ MySQL 8.0 (:3306) ]
```

### Cómo viaja la información en cada módulo

1. **Parte A — Sitio Público (`sitio-publico/`, puerto `8081`):**
   - Páginas semánticas (`index.html`, `actividades.html`, `preinscripcion.html`) con CSS responsivo (`css/estilos.css`, media query móvil `@media (max-width: 600px)`) y JavaScript puro (`js/script.js`).
   - En `script.js`, la clase `Actividad` modela las 8 actividades con el método `esAptaParaEdad(edad)` y genera las tarjetas en el DOM (`renderCatalogo`). Los filtros por disciplina y edad escuchan eventos con `addEventListener` (`aplicarFiltros`). El formulario valida campos obligatorios, correo y formato DNI **RN7** sin `alert()`, y el botón volver utiliza `window.history.back()`.
2. **Parte B — Backoffice de Secretaría (`backend/`, puerto `8080`):**
   - Controladores MVC (`HomeController`, `ActividadController`, `SocioController`, `InscripcionController`) renderizan vistas Thymeleaf reutilizando los fragmentos `templates/fragments/header.html` y `footer.html`.
   - Ningún controlador accede directo a un repositorio: siempre delegan en `ActividadService`, `SocioService` e `InscripcionService`.
   - `SocioController` (`/socios`) usa paginación de 10 registros por página y búsqueda por apellido insensible a mayúsculas (`findByApellidoContainingIgnoreCase`).
   - `InscripcionService.inscribir(...)` ejecuta validaciones **RN1–RN5** dentro de una transacción `@Transactional(isolation = READ_COMMITTED)` con bloqueos pesimistas (`buscarParaInscripcion`, siempre en orden socio → actividad) y lanza `ReglaNegocioException(regla, mensaje)` cuando una regla no se cumple. La baja (`darDeBaja`) es siempre lógica (`estado = BAJA`).
3. **Partes C y D — API REST + App React (`app-socios/`, puerto `3000`):**
   - **Ingreso y cierre de sesión:** en `/` (`IngresoSocio.jsx`), el usuario ingresa su DNI validado localmente con `esDniValido` (**RN7** en `src/utils/club.js`). `SocioContext.jsx` consulta `GET /api/socios/dni/{dni}` vía Axios (`src/servicios/api.js`, sin `fetch()`), guarda el DNI en `localStorage` (`socioclub_dni`) y carga sus inscripciones activas (`GET /api/socios/{id}/inscripciones`). Al presionar **`"Cerrar sesión"`** en `Encabezado.jsx`, `cerrarSesion()` borra `socioclub_dni` y limpia el contexto (marcando `sesionCerrada` para que `RequiereSocio` en `App.jsx` no reenvíe al próximo socio a la ruta privada anterior).
   - **Catálogo y cupos en tiempo real:** `ListaActividades.jsx` lee `GET /api/actividades` (calculado en `ActividadService` mediante `@Transient cupoDisponible`). Cuando `cupoDisponible === 0`, `TarjetaActividad.jsx` muestra `"Sin cupo"`, agrega la clase CSS dinámica `agenda__entry--sin-cupo` y deshabilita la inscripción.
   - **Inscripción y manejo de errores `409 Conflict`:** desde `/actividades/:id` (`DetalleActividad.jsx`), `POST /api/inscripciones` pasa por `InscripcionRestController` → `InscripcionService.inscribir(...)`. Si se viola alguna regla `RN1`–`RN5`, el backend responde HTTP `409 Conflict` con `{ "error": "...", "regla": "RNx" }` y React muestra ese mensaje exacto al socio.
   - **Baja lógica, cuota mensual (RN6) y sincronización cruzada:** desde `/mis-actividades` (`MisActividades.jsx`), confirmar la baja envía `PUT /api/inscripciones/{id}/baja`, actualiza `estado = BAJA` en MySQL, refresca los cupos disponibles y `ResumenCuota.jsx` recalcula el total con `calcularCuotaMensual` (**RN6**: 10 % de descuento con 2 actividades y 15 % con 3). Todo cambio realizado en React se ve al instante en Secretaría (`http://localhost:8080/inscripciones/actividad/{id}` y `/actividades`) y viceversa.
   - **Ciclo infinito JSON y CORS:** se evitó la recursión `Socio ↔ Inscripcion ↔ Actividad` anotando con `@JsonIgnore` las listas `@OneToMany inscripciones` en `Socio.java` y `Actividad.java`, y habilitando `@CrossOrigin(origins = "http://localhost:3000")` en los `@RestController`.

---

## Paquetes incluidos (solo los estrictamente necesarios)

| Módulo | Dependencias instaladas | Qué se excluyó intencionalmente |
|---|---|---|
| `backend/pom.xml` | `spring-boot-starter-web`, `spring-boot-starter-thymeleaf`, `spring-boot-starter-data-jpa`, `mysql-connector-j` (Java 17) | Sin Lombok (getters/setters manuales), sin MapStruct/ModelMapper, sin Spring Security/JWT |
| `app-socios/package.json` | `react`, `react-dom`, `react-scripts` (Create React App), `react-router-dom`, `prop-types`, `axios`, `@testing-library/*` | Sin Vite, sin Redux/Zustand, sin Tailwind/Bootstrap, sin `fetch()` nativo |

---

## Levantar el proyecto

Requisitos en la máquina local: **Docker Compose**, **Git** y **Node.js 22.12** (o superior).

1. **Levantar MySQL, Backend (Secretaría + API REST) y Sitio Público:**

```sh
git clone https://github.com/NAEV-IS/SocioClub-S21.git
cd SocioClub-S21
docker compose up -d --build
docker compose ps
```

En el primer arranque con volumen vacío, MySQL ejecuta [db/init/02-data.sql](db/init/02-data.sql) cargando las **8 actividades oficiales**, **22 socios** e inscripciones de prueba.

2. **Iniciar la App React (`app-socios/`):**

En otra terminal desde la raíz del repositorio:

```sh
cd app-socios
npm ci --ignore-scripts
npm start
```

| Aplicación | URL local | Qué probar |
|---|---|---|
| Sitio Público | http://localhost:8081 | Catálogo JS, filtros por disciplina/edad y formulario validado |
| Secretaría | http://localhost:8080/socios | Listado paginado (10 por página), búsqueda por apellido, alta/edición |
| Inscripciones Secretaría | http://localhost:8080/inscripciones | Alta validada, inscriptos por actividad y confirmación de baja lógica |
| API REST | http://localhost:8080/api/actividades | Catálogo JSON con `cupoDisponible` y endpoints `/api/*` |
| App React (Socios) | http://localhost:3000 | Ingreso por DNI, filtros, inscripción, errores 409, baja lógica y `"Cerrar sesión"` |

---

## Endpoints REST implementados (Anexo A)

| Método | Ruta | Descripción | Respuestas HTTP |
|---|---|---|---|
| `GET` | `/api/actividades` | Lista actividades (acepta `?disciplina=`) con `cupoDisponible` | `200 OK` |
| `GET` | `/api/actividades/{id}` | Detalle de actividad con `cupoDisponible` | `200 OK` / `404 Not Found` |
| `POST` | `/api/actividades` | Alta de actividad | `201 Created` / `409 Conflict` |
| `PUT` | `/api/actividades/{id}` | Edición de actividad | `200 OK` / `404 Not Found` / `409 Conflict` |
| `DELETE` | `/api/actividades/{id}` | Baja de actividad sin inscripciones activas | `204 No Content` / `404 Not Found` / `409 Conflict` |
| `GET` | `/api/socios/dni/{dni}` | Busca un socio por DNI (ingreso App React) | `200 OK` / `404 Not Found` |
| `GET` | `/api/socios/{id}/inscripciones` | Inscripciones `ACTIVA` del socio | `200 OK` / `404 Not Found` |
| `POST` | `/api/inscripciones` | Inscribe socio (`{ "socioId", "actividadId" }`), aplica RN1–RN5 | `201 Created` / `404 Not Found` / `409 Conflict` |
| `PUT` | `/api/inscripciones/{id}/baja` | Baja lógica (`estado = BAJA`) | `200 OK` / `404 Not Found` |

---

## Datos y DNI de prueba (para la defensa)

| Socio | DNI | Estado | Qué demuestra en la demo |
|---|---|---|---|
| Roberto Funes (`id=5`) | `28567890` | `AL_DIA` · Inscripto en Yoga | Inscripción válida en Natación (`id=4`), baja lógica, recálculo RN6 (2 act.: $ 38.700 → 1 act.: $ 17.000) y persistencia al recargar |
| Camila Ludueña (`id=4`) | `32456789` | `AL_DIA` · 3 actividades activas | **RN2** al intentar inscribirse nuevamente en Yoga / **RN5** (máximo 3) al intentar Ajedrez |
| Bruno Castro (`id=3`) | `35345678` | `MOROSO` | **RN4** (`"Debe regularizar su cuota en secretaría"`) |
| Thiago Molina (`id=1`) | `45123456` | `AL_DIA` · 8 años | **RN3** fuera de rango de edad al intentar Vóley mixto o Yoga |

> **Para demostrar RN1 (sin cupo):** `Yoga` (`id=8`) inicia con **14 inscripciones activas sobre 15**. Un socio adulto `AL_DIA` sin Yoga (ej. DNI `31901234` o dando de baja una prueba anterior) ocupa el último lugar (15/15); el siguiente socio adulto recibe `409 Conflict` con `"La actividad no tiene cupo disponible"`.

---

## Prueba de sistema (6 casos de punta a punta)

| Caso | Pasos | Resultado esperado | Resultado verificado |
|---|---|---|---|
| **1. Alta válida + Baja lógica** | Ingresar con `28567890` (Roberto Funes) en `:3000`, inscribirse en Natación, recargar y confirmar baja; consultar Secretaría `:8080/inscripciones/actividad/4`. | `201 Created`, cupo Natación pasa de `29/30` a `28/30`, cuota baja 10 % (`$ 38.700`), persiste al recargar y Secretaría muestra a Funes; tras baja vuelve a `29/30` y `$ 17.000`. | Aprobado en Chromium E2E y script de sincronización cruzada contra MySQL. |
| **2. RN1 — Sin cupo** | Ocupar el último lugar de Yoga (`15/15`) e intentar inscribir otro socio adulto `AL_DIA` en Yoga vía Postman / UI. | Rechazo `409 Conflict` (`regla: "RN1"`): `"La actividad no tiene cupo disponible"`. | Aprobado en Postman / backend (`409`). |
| **3. RN2 — Sin duplicados** | Con Camila Ludueña (`32456789`), intentar inscribirla en Yoga (ya activa). | Rechazo `409 Conflict` (`regla: "RN2"`): `"El socio ya está inscripto en esta actividad"`. | Aprobado en verificación API (`409`). |
| **4. RN3 — Rango de edad** | Ingresar con Thiago Molina (`45123456`, 8 años) e intentar inscribirse en Vóley mixto (13 a 60 años) o Yoga (16 a 99 años). | Rechazo `409 Conflict` (`regla: "RN3"`): `"La edad del socio debe estar entre ..."` visible en UI. | Aprobado en Chromium E2E y API (`409`). |
| **5. RN4 — Cuota morosa** | Ingresar con Bruno Castro (`35345678`, `MOROSO`) e intentar inscribirse en cualquier actividad. | Rechazo `409 Conflict` (`regla: "RN4"`): `"Debe regularizar su cuota en secretaría"` visible en UI. | Aprobado en Chromium E2E y API (`409`). |
| **6. RN5 — Máximo 3 actividades** | Ingresar con Camila Ludueña (`32456789`, 3 activas) e intentar inscribirse en Ajedrez. | Rechazo `409 Conflict` (`regla: "RN5"`): `"Alcanzó el máximo de 3 actividades"` visible en UI. | Aprobado en Chromium E2E y API (`409`). |

---

## Verificación de pruebas y referencias

- **Pruebas React (Jest + RTL + Axios mock):** desde `app-socios/`, ejecutar `npm test` (**9 suites aprobadas, 104 tests aprobados**).
- **Compilación de producción React:** desde `app-socios/`, ejecutar `npm run build` (`app-socios/build/` generado sin errores).
- **Informe técnico (Grupo 7):** [docs/TPI_SocioClub_Grupo7.pdf](docs/TPI_SocioClub_Grupo7.pdf)
- **Colección Postman completa:** [docs/postman/SocioClub.postman_collection.json](docs/postman/SocioClub.postman_collection.json)
- **Base de datos inicial:** [db/init/02-data.sql](db/init/02-data.sql)

## Licencia

Proyecto de uso exclusivamente académico — **Universidad Siglo 21** — Materia: *Taller de Construcción de Software*.
