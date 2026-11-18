# Inscripciones de secretaría (S2, S3)

Abrir `/inscripciones`: seleccionar socio y actividad, inscribir y consultar los inscriptos activos. La baja requiere una pantalla de confirmación y un POST; conserva el registro en estado `BAJA` y libera el lugar. No depende de las pantallas de socios de T1.

## Recorrido

1. En `/inscripciones`, elegir socio y actividad. Cada actividad muestra edades y cupo disponible.
2. Al aceptar, se redirige al listado activo de esa actividad. Un rechazo vuelve al formulario con las selecciones y el mensaje, sin guardar cambios.
3. En el listado, elegir **Dar de baja** y luego **Confirmar baja**. Cancelar o visitar la confirmación no modifica datos.
4. Una reinscripción crea otro registro; la baja anterior sigue consultable por su ID.

| Método y ruta | Resultado |
|---|---|
| GET `/inscripciones` | Formulario y enlaces a los listados; admite `?actividadId=8` |
| POST `/inscripciones` | Campos `socioId`, `actividadId`; éxito 302 al listado, rechazo de negocio 200 con error |
| GET `/inscripciones/actividad/{id}` | Sólo ACTIVA, ordenadas por apellido, nombre e ID; cupo disponible |
| GET `/inscripciones/{id}/baja` | Confirmación o estado BAJA del registro histórico |
| POST `/inscripciones/{id}/baja` | Sólo modifica con `confirmar=true`; redirige al listado |

Los IDs inexistentes del formulario muestran un error. Los listados y bajas inexistentes responden 404. Campos requeridos ausentes o no numéricos responden 400. Falta de confirmación: `Confirmá la baja de la inscripción.` Repetir una baja confirmada es idempotente.

## Reglas y concurrencia

Se evalúan RN1–RN5 en ese orden; si coinciden varios incumplimientos, se muestra el primero.

| Regla | Mensaje |
|---|---|
| RN1: activas alcanzan cupo máximo | `La actividad no tiene cupo disponible` |
| RN2: mismo socio y actividad ya ACTIVA | `El socio ya está inscripto en esta actividad` |
| RN3: edad fuera del rango inclusivo | `La edad del socio debe estar entre {mínima} y {máxima} años` |
| RN4: cuota distinta de AL_DIA | `Debe regularizar su cuota en secretaría` |
| RN5: tres actividades activas | `Alcanzó el máximo de 3 actividades` |

La edad se calcula con la fecha de nacimiento y la fecha actual del servidor, no con un año fijo. Un rango de edades sin configurar se rechaza. Sólo las ACTIVA ocupan cupo y cuentan para el máximo de tres.

Alta y baja son transacciones `READ_COMMITTED`, con bloqueos pesimistas siempre **socio → actividad**, antes de cambiar inscripciones. Esto serializa altas del mismo socio incluso en actividades distintas y altas de distintos socios al último lugar. Las consultas de validación ven los commits anteriores después de esperar los bloqueos.

El esquema de `db/init/02-data.sql` no declara unicidad socio/actividad; las claves foráneas tienen los índices de soporte de MySQL. Se conserva cada BAJA y se inserta un nuevo registro al reinscribir. La exclusión de duplicados activos depende de pasar por este servicio, no de una restricción única. No se modifican los modelos ni las APIs existentes de actividades. Cambios externos por SQL y la coordinación concurrente del ABM de actividades quedan fuera de esta garantía.

## Prueba HTTP aislada (coordinador)

El escritor no ejecutó el build ni las pruebas HTTP: el coordinador administra el servidor y debe suministrar explícitamente el origen aislado. No hay origen por defecto, acceso directo a BD, dependencias Python externas, proxies ni seguimiento automático de redirecciones.

Preparar una instancia **descartable** con el seed original, sin otros clientes, y dos socios adicionales:

- IDs distintos mayores a 22; pasar ambos al runner.
- Fecha de nacimiento `1990-01-01`, cuota `AL_DIA`, DNI distintos de ocho dígitos, sin inscripciones activas. Prepararlos en los fixtures del coordinador, sin depender del alta de socios T1.
- Conservar IDs originales: Yoga 8 con 14/15; inscripción 22 BAJA (5→4).
- Ejecutar servidor y runner con la misma fecha/zona horaria, sin cruzar medianoche.

Desde `backend/`, con `ORIGEN_AISLADO` y los IDs explícitos preparados por el coordinador:

```sh
python3 src/test/http/test_inscripciones.py \
  --base-url "$ORIGEN_AISLADO" --isolated-test-database \
  --capacity-socios 23 24
```

`23 24` corresponde a los dos fixtures adicionales si se les asignan esos IDs. El origen debe ser HTTP con IP loopback literal y puerto explícito. El indicador de aislamiento es una confirmación del operador: la IP loopback por sí sola no demuestra que la base sea descartable.

Las nueve pruebas cubren formulario, preservación de páginas/alta de actividades, RN1–RN5 aisladas, edad inclusiva y ambos extremos inválidos, rechazos sin cambios en listados/cupos, GET sin mutación, confirmación obligatoria, baja repetida, recuperación del lugar y del límite de tres, reinscripción con historial y carreras de cupo/duplicado/máximo por socio. La persistencia se observa mediante solicitudes HTTP posteriores, IDs de filas, cupos y el estado histórico público, nunca mediante almacenamiento interno.

Al terminar, el coordinador descarta **únicamente** su entorno de prueba: las actividades de prueba y el historial BAJA quedan allí deliberadamente. Cada ejecución necesita una base fresca. No usar contenedores existentes ni bases reales. La navegación compartida y la demostración integral S4 corresponden a T3.
