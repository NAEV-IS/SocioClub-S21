package com.losalgarrobos.socioclub.repository;

import com.losalgarrobos.socioclub.model.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActividadRepository extends JpaRepository<Actividad, Long> {
    List<Actividad> findByDisciplina(String disciplina);
    List<Actividad> findByNombreContainingIgnoreCase(String nombre);
}
