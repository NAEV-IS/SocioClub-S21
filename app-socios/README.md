# SocioClub · App de socios

Implementación React de la agenda elegida para la segunda entrega. Requiere Node.js 22.12 o superior; las dependencias están fijadas en el lockfile. React 18 conserva la validación PropTypes de los componentes funcionales exigidos.

## Ejecutar

Desde `app-socios/`:

```sh
npm ci
npm run dev
```

Abrí la dirección de loopback que imprime Vite. No habilites scripts de instalación bloqueados ni instales paquetes del sistema para ejecutar esta app.

## Recorrido

1. En `/`, ingresá un DNI de ejemplo sin puntos ni espacios.
2. En `/actividades`, combiná día, disciplina y edad. La edad de búsqueda no reemplaza la del socio.
3. Abrí `/actividades/:id` para consultar las condiciones e inscribirte cuando las reglas lo permiten.
4. En `/mis-actividades`, confirmá una baja y revisá cómo se recalcula la cuota. Cambiar de socio conserva los cambios locales de cada perfil.

| Perfil de ejemplo | DNI | Estado inicial |
| --- | --- | --- |
| Camila Ludueña | 32456789 | Al día; Natación, Funcional y Yoga |
| Bruno Castro | 35345678 | MOROSO; sin actividades |
| Thiago Molina | 45123456 | Al día; sin actividades |

Camila empieza con base de $65.000, bonificación de $9.750 (15%) y total de $55.250. Confirmar la baja de Yoga deja $43.200; inscribir Ajedrez después deja $48.450.

## Verificar y compilar

```sh
npm test
npm run build
npm run preview
```

Jest/Testing Library prueban las reglas, Context y recorridos públicos con datos aislados en memoria. `build` genera `dist/`; el host definitivo deberá servir el archivo de entrada para las rutas de la SPA.

## Límites de esta entrega

- Context y fixtures locales: sin Axios/REST ni conexión a Neon o al backoffice.
- El ingreso selecciona un perfil de ejemplo; no es autenticación ni protección de datos reales.
- Altas, bajas y cuotas son una simulación. No hay persistencia, liquidaciones ni pagos.
- Recargar restablece los ejemplos y vuelve a pedir un perfil. La integración de API pertenece a la tercera entrega.
- La agenda no recupera la introducción ni el atajo duplicado retirados del artboard.

Los módulos `features/agenda/` y `features/membership/` contienen su documentación y pruebas específicas. El trabajo del backend existente no se modifica desde esta app.
