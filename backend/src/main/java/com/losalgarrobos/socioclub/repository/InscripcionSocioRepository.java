package com.losalgarrobos.socioclub.repository;

import com.losalgarrobos.socioclub.model.Socio;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

/** Enrollment-specific lock, without changing the member administration API. */
public interface InscripcionSocioRepository extends Repository<Socio, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Socio s WHERE s.id = :id")
    Optional<Socio> buscarParaInscripcion(@Param("id") Long id);
}
