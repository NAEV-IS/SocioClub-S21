package com.losalgarrobos.socioclub.repository;

import com.losalgarrobos.socioclub.model.EstadoInscripcion;
import com.losalgarrobos.socioclub.model.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    @Query("SELECT COUNT(i) FROM Inscripcion i WHERE i.actividad.id = :actividadId AND i.estado = 'ACTIVA'")
    long countActivasByActividadId(@Param("actividadId") Long actividadId);

    boolean existsBySocioIdAndActividadIdAndEstado(Long socioId, Long actividadId, EstadoInscripcion estado);

    long countBySocioIdAndEstado(Long socioId, EstadoInscripcion estado);

    List<Inscripcion> findByActividadIdAndEstadoOrderBySocioApellidoAscSocioNombreAscIdAsc(
            Long actividadId, EstadoInscripcion estado);

    // Método derivado: Spring arma "WHERE actividad_id = ? AND estado = ?"
    List<Inscripcion> findByActividadIdAndEstado(Long actividadId, EstadoInscripcion estado);
}
