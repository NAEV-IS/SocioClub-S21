# SocioClub — Entrega 2

Sitio público del Club Los Algarrobos, Secretaría y app de socios. Para preparar la exposición, consultá el [recorrido con los seis casos de inscripción comprobados](docs/entrega-2.md).

## 👥 Integrantes del equipo

| Apellido y nombre |
| :--- |
| Carrara, Francisco |
| Demarchi, Facundo |
| Robledo, Thomas |
| Rosso, Gastón |
| Tamagusuku, Agustín |

---

## Levantar el proyecto

En una máquina de desarrollo con Docker Compose, Git y Node.js 22.12 o superior:

```sh
git clone https://github.com/NAEV-IS/SocioClub-S21.git
cd SocioClub-S21
docker compose up -d --build
docker compose ps
```

Compose levanta **MySQL, Secretaría y el sitio público**. En el primer arranque con un volumen vacío, MySQL carga [las tablas y los datos de ejemplo](db/init/02-data.sql): ocho actividades y 22 socios. Los datos existentes se conservan. Si hay una demo en uso o puertos ocupados, usá otra máquina de desarrollo: no borres volúmenes ni detengas servicios ajenos.

La app React se inicia aparte, en otra terminal desde la raíz del repositorio:

```sh
cd app-socios
npm ci --ignore-scripts
npm start
```

| Aplicación | Dirección local | Qué probar |
|---|---|---|
| Sitio público | http://localhost:8081 | Catálogo, filtros y formulario de preinscripción |
| Secretaría | http://localhost:8080/socios | Búsqueda y paginación, alta y edición de socios |
| Inscripciones de Secretaría | http://localhost:8080/inscripciones | Inscribir, ver cupos y confirmar una baja lógica |
| App de socios | http://localhost:3000 | Ingresar con el DNI de ejemplo `32456789` y abrir la agenda |

## Alcance del hito

Secretaría usa Spring MVC, Thymeleaf, JPA y MySQL. El servicio valida cupo, duplicados, edad, cuota al día y máximo de tres actividades activas. La app usa Create React App, React Router y Context con datos locales. **Una modificación en Secretaría no aparece en React en esta entrega.** La API REST, Axios y Postman corresponden a la semana 3.

## Verificación y referencias

Desde `app-socios/`: `npm test` ejecuta la suite y `npm run build` genera la compilación de producción. Para probar el backend con escrituras, usá únicamente una base descartable.

- [Guía de la app y perfiles de ejemplo](app-socios/README.md)
- [Gestión de socios](backend/docs/socios.md) · [Inscripciones y bajas](backend/docs/inscripciones.md)
- [Plan de trabajo](docs/plan-trabajo.md)

## 📄 Licencia

Proyecto de uso exclusivamente académico — **Universidad Siglo 21** — Materia: *Taller de Construcción de Software*.
