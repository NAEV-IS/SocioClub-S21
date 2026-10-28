package com.losalgarrobos.socioclub.service;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.model.EstadoInscripcion;
import com.losalgarrobos.socioclub.repository.ActividadRepository;
import com.losalgarrobos.socioclub.repository.InscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ActividadService {

    @Autowired
    private ActividadRepository actividadRepository;

    @Autowired
    private InscripcionRepository inscripcionRepository;

    public List<Actividad> listarTodas() {
        return actividadRepository.findAll();
    }

    public Optional<Actividad> buscarPorId(Long id) {
        return actividadRepository.findById(id);
    }

    public Actividad guardar(Actividad actividad) {
        validar(actividad);
        return actividadRepository.save(actividad);
    }

    /**
     * Elimina una actividad solo si no tiene inscriptos ACTIVOS.
     * Las inscripciones en estado BAJA (historial) se borran antes para no violar la clave foránea.
     */
    @Transactional
    public void eliminar(Long id) {
        long activas = inscripcionRepository.countActivasByActividadId(id);
        if (activas > 0) {
            throw new ReglaNegocioException(
                    "No se puede eliminar: la actividad tiene " + activas + " inscriptos activos.");
        }
        inscripcionRepository.deleteAll(
                inscripcionRepository.findByActividadIdAndEstado(id, EstadoInscripcion.BAJA));
        actividadRepository.deleteById(id);
    }

    public long cupoDisponible(Long actividadId) {
        Actividad actividad = actividadRepository.findById(actividadId).orElse(null);
        if (actividad == null) return 0;
        return calcularCupoDisponible(actividad);
    }

    /**
     * Devuelve el cupo disponible de cada actividad, indexado por id de actividad.
     * Lo usa el listado de la secretaría.
     */
    public Map<Long, Long> cuposDisponibles(List<Actividad> actividades) {
        Map<Long, Long> cupos = new HashMap<>();
        for (Actividad actividad : actividades) {
            cupos.put(actividad.getId(), calcularCupoDisponible(actividad));
        }
        return cupos;
    }

    private long calcularCupoDisponible(Actividad actividad) {
        int cupoMaximo = actividad.getCupoMaximo() != null ? actividad.getCupoMaximo() : 0;
        long inscriptos = inscripcionRepository.countActivasByActividadId(actividad.getId());
        return cupoMaximo - inscriptos;
    }

    private void validar(Actividad actividad) {
        if (actividad.getDias() == null || actividad.getDias().isBlank()) {
            throw new ReglaNegocioException("Seleccioná al menos un día.");
        }
        if (actividad.getEdadMinima() == null || actividad.getEdadMaxima() == null
                || actividad.getCupoMaximo() == null || actividad.getCuotaMensual() == null) {
            throw new ReglaNegocioException("Completá edades, cupo y cuota mensual.");
        }
        if (actividad.getEdadMinima() > actividad.getEdadMaxima()) {
            throw new ReglaNegocioException("La edad mínima no puede ser mayor que la edad máxima.");
        }
        if (actividad.getCupoMaximo() < 1) {
            throw new ReglaNegocioException("El cupo máximo debe ser al menos 1.");
        }
        if (actividad.getCuotaMensual() < 0) {
            throw new ReglaNegocioException("La cuota mensual no puede ser negativa.");
        }
        // Al editar, no se puede bajar el cupo por debajo de los inscriptos activos actuales
        if (actividad.getId() != null) {
            long activas = inscripcionRepository.countActivasByActividadId(actividad.getId());
            if (actividad.getCupoMaximo() < activas) {
                throw new ReglaNegocioException(
                        "El cupo no puede ser menor a los " + activas + " inscriptos activos actuales.");
            }
        }
    }
}
