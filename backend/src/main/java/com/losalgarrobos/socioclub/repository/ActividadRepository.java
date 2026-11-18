package com.losalgarrobos.socioclub.repository;

import com.losalgarrobos.socioclub.model.Actividad;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Actividad a WHERE a.id = :id")
    Optional<Actividad> buscarParaInscripcion(@Param("id") Long id);

    List<Actividad> findByDisciplina(String disciplina);
    List<Actividad> findByNombreContainingIgnoreCase(String nombre);
}
