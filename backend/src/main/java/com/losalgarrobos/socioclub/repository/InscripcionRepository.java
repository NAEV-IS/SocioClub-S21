package com.losalgarrobos.socioclub.repository;

import com.losalgarrobos.socioclub.model.Inscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    @Query("SELECT COUNT(i) FROM Inscripcion i WHERE i.actividad.id = :actividadId AND i.estado = 'ACTIVA'")
    long countActivasByActividadId(@Param("actividadId") Long actividadId);
}
