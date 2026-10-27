# 🟢 SocioClub - Sistema de Gestión de Club Deportivo

Sistema web para gestión de socios, actividades e inscripciones del **Club Social y Deportivo Los Algarrobos** (Córdoba Capital). Desarrollado como Trabajo Práctico Integrador de la materia **Taller de Construcción de Software** — Universidad Siglo 21.

### 🛠️ Tecnologías utilizadas
- **Backend:** Java 17, Spring Boot 3.x, Spring Data JPA (Hibernate)
- **Motor de plantillas (Backoffice):** Thymeleaf
- **Base de datos:** MySQL 8.0
- **Frontend Público:** HTML5, CSS3, JavaScript Vanilla (ES6+)
- **Infraestructura y Despliegue:** Docker & Docker Compose, Nginx, Maven 3.9

---

## 👥 Integrantes del equipo

| Nombre | Rol | Email |
| :--- | :--- | :--- |
| `[Nombre 1]` | `[Rol / Responsabilidad]` | `[email1@ejemplo.com]` |
| `[Nombre 2]` | `[Rol / Responsabilidad]` | `[email2@ejemplo.com]` |
| `[Nombre 3]` | `[Rol / Responsabilidad]` | `[email3@ejemplo.com]` |
| `[Nombre 4]` | `[Rol / Responsabilidad]` | `[email4@ejemplo.com]` |

---

## 📊 Estado actual del proyecto (Semana 1 - 40%)

### ✅ Parte A - Sitio Público (COMPLETA)
- **`index.html`:** Presentación institucional del club con historia, valores, ubicación, horarios y llamada a la acción.
- **`actividades.html`:** Catálogo dinámico con filtros combinados por disciplina y edad.
- **`preinscripcion.html`:** Formulario de preinscripción validado en el cliente con JavaScript (sin uso de `alert()`).
- **CSS3 responsivo (`css/estilos.css`):** Uso de selectores de tipo, clase, ID y atributo, junto con media queries para dispositivos móviles.
- **JavaScript Vanilla (`js/script.js`):** Implementación de la clase `Actividad` con método `esAptaParaEdad(edad)`, manipulación del DOM, `addEventListener` y navegación con `history.back()`.

### ✅ Parte B - Backend Spring Boot (PARCIAL)
- **Proyecto Maven** estructurado bajo arquitectura en capas estricta (`model` → `repository` → `service` → `controller`).
- **Entidades JPA:** `Socio`, `Actividad`, `Inscripcion` junto con los enums `EstadoCuota` (`AL_DIA`, `MOROSO`) y `EstadoInscripcion` (`ACTIVA`, `BAJA`), con getters y setters manuales (sin Lombok).
- **Repositorios Spring Data JPA:** Métodos de consulta derivados del nombre y consulta personalizada con `@Query` (`countActivasByActividadId`).
- **Servicio de Actividades (`ActividadService`):** Operaciones CRUD y cálculo dinámico de cupo disponible.
- **Controladores MVC (`ActividadController`, `HomeController`):** Gestión completa de alta, baja, modificación y listado de actividades.
- **Vistas Thymeleaf:** Plantillas reutilizando fragmentos (`header` y `footer`) y selector interactivo de días en el formulario.
- **Base de datos MySQL:** Script de inicialización automática con las **8 actividades oficiales** y **15 socios de prueba** (incluyendo socios al día y morosos).

### ⏳ Pendiente para Semana 2
- ABM de Socios con listado paginado (`Pageable`) y búsqueda por apellido.
- Módulo de Inscripciones aplicando las reglas de negocio **RN1 a RN5** en `InscripcionService`.
- Aplicación de autogestión para socios en **React** con componentes, rutas y Context usando datos locales.

### ⏳ Pendiente para Semana 3
- API REST completa (`@RestController`) reutilizando la capa de servicios y configuración de CORS.
- Integración de la aplicación React con el backend mediante **Axios**.
- Pruebas unitarias con **Jest** (RN6 y RN7), pruebas de componentes con **React Testing Library (RTL)**, colección Postman y pruebas de sistema.

---

## ⚙️ Requisitos previos

Para ejecutar el proyecto mediante contenedores (opción recomendada):
- **Docker Desktop:** versión 20.10 o superior
- **Docker Compose:** versión 2.0 o superior
- **Git:** versión 2.30 o superior
- **Navegador web moderno:** Chrome, Firefox o Edge

**Opcional (para ejecución local sin Docker):**
- **JDK:** 17 o superior
- **Apache Maven:** 3.8 o superior
- **MySQL Server:** 8.x
- **Node.js:** 18+ (para la aplicación React en las próximas entregas)

---

## 🚀 Instalación y ejecución

### Opción A: Con Docker (RECOMENDADO)

```bash
# 1. Clonar el repositorio
git clone https://github.com/NAEV-IS/SocioClub-S21.git
cd SocioClub-S21

# 2. Levantar todos los servicios (MySQL + Backend + Sitio Público)
docker compose up -d

# 3. Verificar que los contenedores estén corriendo
docker compose ps
```

#### 🔗 Accesos una vez iniciados los contenedores:
- **Backend (Backoffice Secretaría - Marta):** [http://localhost:8080](http://localhost:8080)
- **Sitio Público Institucional:** [http://localhost:8081](http://localhost:8081)
- **Base de datos MySQL:** `localhost:3306` (Base: `socioclub` | Usuario: `root` | Contraseña: `root123`)

**Para detener los servicios:**
```bash
docker compose down
```

**Para resetear por completo la base de datos (volver a cargar los datos iniciales):**
```bash
docker compose down -v
docker compose up -d
```

---

### Opción B: Sin Docker (Desarrollo local)

#### Paso 1: Base de datos MySQL
```bash
# Conectarse a MySQL y crear la base de datos
mysql -u root -p
CREATE DATABASE socioclub;
EXIT;

# Importar tablas y datos iniciales
mysql -u root -p socioclub < db/init/02-data.sql
```

#### Paso 2: Backend Spring Boot
```bash
cd backend
# Editar src/main/resources/application.properties con tu contraseña local de MySQL
mvn spring-boot:run
```
El backend quedará disponible en [http://localhost:8080](http://localhost:8080).

#### Paso 3: Sitio Público
```bash
# Abrir sitio-publico/index.html directamente en el navegador
# O levantar un servidor HTTP local:
cd sitio-publico
python -m http.server 8081
# Acceder a http://localhost:8081
```

---

## 🗂️ Estructura del proyecto

```text
SocioClub-S21/
├── backend/                    # Aplicación Spring Boot (Backoffice + futura API REST)
│   ├── src/main/java/
│   │   └── com/losalgarrobos/socioclub/
│   │       ├── model/          # Entidades JPA y Enums
│   │       ├── repository/     # Interfaces de repositorio (Spring Data JPA)
│   │       ├── service/        # Lógica de negocio
│   │       └── controller/     # Controladores MVC
│   ├── src/main/resources/
│   │   ├── templates/          # Vistas Thymeleaf y fragmentos reutilizables
│   │   ├── static/css/         # Hoja de estilos del backoffice
│   │   ├── application.properties
│   │   └── application-docker.properties
│   ├── pom.xml
│   └── Dockerfile
├── sitio-publico/              # Sitio web público (HTML5, CSS3, JS Vanilla)
│   ├── index.html
│   ├── actividades.html
│   ├── preinscripcion.html
│   ├── css/estilos.css
│   ├── js/script.js
│   └── Dockerfile
├── db/init/
│   └── 02-data.sql             # Script SQL con esquema y datos iniciales
├── docs/
│   └── plan-trabajo.md         # Roadmap detallado por semana
├── docker-compose.yml          # Orquestación de servicios
├── .env.example                # Plantilla de variables de entorno
├── MASTER_DEV.md               # Guía maestra de desarrollo
└── README.md
```

---

## 🧪 Datos de prueba iniciales

### Socios destacados (de los 15 precargados en `02-data.sql`)

| DNI | Nombre | Fecha de Nacimiento | Estado de Cuota |
| :--- | :--- | :--- | :--- |
| `45123456` | Thiago Molina | 2018-04-12 | `AL_DIA` |
| `35345678` | Bruno Castro | 2008-02-19 | `MOROSO` |
| `41789012` | Franco Sosa | 2010-09-08 | `MOROSO` |
| `32456789` | Camila Ludueña | 1995-11-25 | `AL_DIA` |

### Actividades iniciales (8 disciplinas)

| ID | Actividad | Disciplina | Profesor/a | Días y Horario | Edades | Cupo | Cuota Mensual |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Fútbol infantil | Fútbol | Diego Ferreyra | Lun y Mié · 18:00 | 6 a 12 años | 40 | $18.000 |
| 2 | Vóley mixto | Vóley | Laura Ceballos | Mar y Jue · 19:00 | 13 a 60 años | 24 | $20.000 |
| 3 | Básquet juvenil | Básquet | Martín Oviedo | Lun y Vie · 19:30 | 12 a 17 años | 20 | $19.000 |
| 4 | Natación | Natación | Sofía Bustos | Mar y Jue · 17:00 | 5 a 70 años | 30 | $26.000 |
| 5 | Patín artístico | Patín | Carla Peralta | Mié y Vie · 17:30 | 5 a 15 años | 25 | $21.000 |
| 6 | Ajedrez | Ajedrez | Raúl Giménez | Sáb · 10:00 | 8 a 99 años | 16 | $9.000 |
| 7 | Funcional adultos | Fitness | Paula Luna | Lun, Mié y Vie · 20:30 | 18 a 65 años | 30 | $22.000 |
| 8 | Yoga | Bienestar | Inés Arguello | Mar y Jue · 09:00 | 16 a 99 años | 15 | $17.000 |

---

## 📋 Reglas de negocio

### Implementadas en Semana 1
- **RN7 (Validación de DNI en cliente):** El DNI debe contener 7 u 8 dígitos numéricos sin puntos (`/^[0-9]{7,8}$/`). Implementada en JavaScript dentro del formulario de preinscripción del sitio público.

### Pendientes para Semana 2 (`InscripcionService` y Frontend)
- **RN1 (Cupo disponible):** No se permiten más inscripciones `ACTIVAS` que el cupo máximo de la actividad.
- **RN2 (Sin duplicados):** Un socio no puede poseer dos inscripciones `ACTIVAS` en la misma actividad.
- **RN3 (Edad permitida):** La edad del socio debe encontrarse entre la edad mínima y máxima de la actividad.
- **RN4 (Control de morosidad):** Un socio con estado `MOROSO` no puede inscribirse a nuevas actividades.
- **RN5 (Límite por socio):** Un socio puede tener como máximo 3 inscripciones `ACTIVAS` en simultáneo.
- **RN6 (Bonificación en cuota mensual):** Suma de cuotas activas con 10% de descuento al cursar 2 actividades y 15% de descuento al cursar 3 actividades.

---

## 🌐 Endpoints disponibles

### Backend MVC (Thymeleaf — Activos en Semana 1)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Panel principal de secretaría (Dashboard) |
| `GET` | `/actividades` | Listado de actividades con cupo disponible |
| `GET` | `/actividades/nueva` | Formulario de alta de nueva actividad |
| `POST` | `/actividades` | Creación o actualización de una actividad |
| `GET` | `/actividades/editar/{id}` | Formulario de edición de actividad existente |
| `GET` | `/actividades/eliminar/{id}` | Eliminación de actividad por ID |

### API REST (Planificados para Semana 3)
| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/actividades` | Lista actividades y cupo disponible (admite `?disciplina=`) |
| `GET` | `/api/actividades/{id}` | Obtiene el detalle de una actividad |
| `POST` | `/api/actividades` | Crea una nueva actividad |
| `PUT` | `/api/actividades/{id}` | Modifica una actividad existente |
| `DELETE` | `/api/actividades/{id}` | Elimina una actividad (si no posee inscriptos activos) |
| `GET` | `/api/socios/dni/{dni}` | Busca un socio por su DNI (ingreso a la app de socios) |
| `GET` | `/api/socios/{id}/inscripciones` | Lista las inscripciones `ACTIVAS` de un socio |
| `POST` | `/api/inscripciones` | Registra una inscripción validando RN1–RN5 |
| `PUT` | `/api/inscripciones/{id}/baja` | Realiza la baja lógica de una inscripción (`estado` → `BAJA`) |

---

## 🛠️ Troubleshooting (Solución de problemas comunes)

- **Problema: `"Bind for 0.0.0.0:3306 failed: port is already allocated"`**
  - **Solución:** Detener el servicio local de MySQL en tu sistema operativo o cambiar el mapeo de puertos en `docker-compose.yml` a `"3307:3306"`.

- **Problema: `"Cannot connect to the Docker daemon"`**
  - **Solución:** Verificar que la aplicación **Docker Desktop** esté iniciada y en estado *Running*.

- **Problema: El backend no se conecta a MySQL al levantar**
  - **Solución:** Comprobar que el contenedor de base de datos haya superado el healthcheck mediante `docker compose ps mysql`. Si no está en estado `healthy`, reiniciar los contenedores con `docker compose down && docker compose up -d`.

- **Problema: Los datos iniciales no aparecen en las tablas**
  - **Solución:** El script en `/docker-entrypoint-initdb.d` solo se ejecuta cuando el volumen se crea por primera vez. Para recargarlo desde cero, ejecutar:
    ```bash
    docker compose down -v && docker compose up -d
    ```

---

## 📄 Licencia

Proyecto de uso exclusivamente académico — **Universidad Siglo 21** — Materia: *Taller de Construcción de Software*.
