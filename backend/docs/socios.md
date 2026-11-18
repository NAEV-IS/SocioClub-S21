# Socios — secretaría (S1)

Entrar directamente a `/socios`. También se puede acceder desde el menú de secretaría.

- **Listado:** 10 socios por página, ordenados por apellido, nombre e ID. Buscar
  por parte del apellido sin distinguir mayúsculas; Buscar vuelve a la primera
  página y Anterior/Siguiente conservan el filtro. `page` empieza en cero;
  valores negativos, no numéricos o fuera del rango de un entero vuelven a cero.
  Una página posterior a la última se ajusta a la última disponible.
- **Alta:** `/socios/nuevo`; **edición:** enlaces del listado a
  `/socios/editar/{id}`. Ambos formularios guardan mediante `POST /socios` y
  redirigen al listado con confirmación. Un ID inválido o inexistente no da de alta
  un registro por accidente: muestra un aviso.
- **Validación:** DNI único, de 7 u 8 dígitos ASCII sin puntos;
  nombre y apellido obligatorios hasta 255 caracteres; fecha válida no futura;
  email opcional con formato de dirección y hasta 255 caracteres; teléfono opcional
  hasta 255 caracteres; estado de cuota Al día o Moroso. Se recortan espacios en
  campos de texto. Los errores conservan los valores del formulario.
- Solo se aceptan los campos escalares del formulario. Al editar se recupera el
  socio existente y no se reemplazan sus inscripciones. La restricción única de
  la base protege también contra altas simultáneas con el mismo DNI.

## Pruebas HTTP aisladas (Python estándar)

El coordinador debe compilar e iniciar esta versión contra una base **descartable**,
no la demo, una base real ni un contenedor existente. Las pruebas escriben socios
con apellidos únicos; descartar esa base al terminar. No se ofrecen valores por
omisión para conectarse y no se siguen redirecciones ni proxies del entorno.

Desde `backend/`, sustituir el origen por el puerto loopback aislado que el
coordinador haya iniciado y autorizado explícitamente:

```sh
python3 src/test/http/test_socios.py --origin http://127.0.0.1:PUERTO_AISLADO --isolated -v
```

`--origin` requiere HTTP, una IP loopback literal y puerto explícito; `--isolated`
confirma que se autoriza escribir sobre esa base descartable. No usar una URL de
un servicio ya existente. La suite comprueba altas, edición, DNI duplicado,
validación sin cambios persistidos, búsqueda, paginación, IDs inválidos y rechazo
de mass binding de asociaciones. Sin origen suministrado no se ejecuta HTTP.

Pendiente de verificación por el coordinador: compilación y ejecución de los cinco
checks HTTP. La conservación de inscripciones existentes requiere además un socio
con inscripciones en la base aislada y el recorrido público de T2/S3; S1 no agrega
endpoints para inspeccionar ni modificar asociaciones. No se ejecutaron RED/GREEN
contra servicios existentes ni se incorporaron dependencias de pruebas al POM.
