package com.losalgarrobos.socioclub.service;

import com.losalgarrobos.socioclub.model.*;
import com.losalgarrobos.socioclub.repository.ActividadRepository;
import com.losalgarrobos.socioclub.repository.InscripcionRepository;
import com.losalgarrobos.socioclub.repository.InscripcionSocioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
public class InscripcionService {
    private final InscripcionRepository inscripciones;
    private final InscripcionSocioRepository socios;
    private final ActividadRepository actividades;

    public InscripcionService(InscripcionRepository inscripciones, InscripcionSocioRepository socios,
                              ActividadRepository actividades) {
        this.inscripciones = inscripciones;
        this.socios = socios;
        this.actividades = actividades;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Inscripcion inscribir(Long socioId, Long actividadId) {
        if (socioId == null) {
            throw new ReglaNegocioException("El socio no existe.");
        }
        if (actividadId == null) {
            throw new ReglaNegocioException("La actividad no existe.");
        }
        // Both writes lock in the same order: member, then activity. Member locks
        // serialize the three-activity limit; activity locks serialize the last place.
        Socio socio = socios.buscarParaInscripcion(socioId)
                .orElseThrow(() -> new ReglaNegocioException("El socio no existe."));
        Actividad actividad = actividades.buscarParaInscripcion(actividadId)
                .orElseThrow(() -> new ReglaNegocioException("La actividad no existe."));
        long inscriptosActivos = inscripciones.countActivasByActividadId(actividadId);
        if (actividad.getCupoMaximo() == null || inscriptosActivos >= actividad.getCupoMaximo()) {
            throw new ReglaNegocioException("RN1", "La actividad no tiene cupo disponible");
        }
        if (inscripciones.existsBySocioIdAndActividadIdAndEstado(socioId, actividadId, EstadoInscripcion.ACTIVA)) {
            throw new ReglaNegocioException("RN2", "El socio ya está inscripto en esta actividad");
        }
        Integer minima = actividad.getEdadMinima();
        Integer maxima = actividad.getEdadMaxima();
        if (minima == null || maxima == null || minima > maxima) {
            throw new ReglaNegocioException("RN3", "La actividad no tiene un rango de edad válido.");
        }
        LocalDate hoy = LocalDate.now();
        int edad = Period.between(socio.getFechaNacimiento(), hoy).getYears();
        if (socio.getFechaNacimiento().isAfter(hoy) || edad < minima || edad > maxima) {
            throw new ReglaNegocioException(
                    "RN3", "La edad del socio debe estar entre " + minima + " y " + maxima + " años");
        }
        if (socio.getEstadoCuota() != EstadoCuota.AL_DIA) {
            throw new ReglaNegocioException("RN4", "Debe regularizar su cuota en secretaría");
        }
        if (inscripciones.countBySocioIdAndEstado(socioId, EstadoInscripcion.ACTIVA) >= 3) {
            throw new ReglaNegocioException("RN5", "Alcanzó el máximo de 3 actividades");
        }
        // The schema has no unique member/activity pair. Preserve BAJA history and
        // insert a new record on re-enrollment, counting only ACTIVA records.
        Inscripcion inscripcion = new Inscripcion();
        inscripcion.setSocio(socio);
        inscripcion.setActividad(actividad);
        inscripcion.setFechaInscripcion(hoy);
        Inscripcion guardada = inscripciones.save(inscripcion);
        actividad.setCupoDisponible(Math.max(0L, actividad.getCupoMaximo() - (inscriptosActivos + 1)));
        return guardada;
    }

    @Transactional(readOnly = true)
    public List<Inscripcion> activas(Long actividadId) {
        return inscripciones.findByActividadIdAndEstadoOrderBySocioApellidoAscSocioNombreAscIdAsc(
                actividadId, EstadoInscripcion.ACTIVA);
    }

    @Transactional(readOnly = true)
    public List<Inscripcion> activasPorSocio(Long socioId) {
        return inscripciones.findBySocioIdAndEstadoOrderByActividadHorarioAscActividadIdAsc(
                socioId, EstadoInscripcion.ACTIVA);
    }

    @Transactional(readOnly = true)
    public Inscripcion buscar(Long id) {
        return inscripciones.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La inscripción no existe."));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Long darDeBaja(Long id, boolean confirmar) {
        Inscripcion inscripcion = buscar(id);
        if (!confirmar) {
            throw new ReglaNegocioException("Confirmá la baja de la inscripción.");
        }
        socios.buscarParaInscripcion(inscripcion.getSocio().getId())
                .orElseThrow(() -> new ReglaNegocioException("El socio no existe."));
        actividades.buscarParaInscripcion(inscripcion.getActividad().getId())
                .orElseThrow(() -> new ReglaNegocioException("La actividad no existe."));
        inscripcion.setEstado(EstadoInscripcion.BAJA);
        inscripciones.save(inscripcion);
        return inscripcion.getActividad().getId();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Inscripcion darDeBaja(Long id) {
        darDeBaja(id, true);
        return buscar(id);
    }
}
