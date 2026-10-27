package com.losalgarrobos.socioclub.service;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.repository.ActividadRepository;
import com.losalgarrobos.socioclub.repository.InscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
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
        return actividadRepository.save(actividad);
    }

    public void eliminar(Long id) {
        actividadRepository.deleteById(id);
    }

    public long cupoDisponible(Long actividadId) {
        Actividad actividad = actividadRepository.findById(actividadId).orElse(null);
        if (actividad == null) return 0;
        long inscriptos = inscripcionRepository.countActivasByActividadId(actividadId);
        return actividad.getCupoMaximo() - inscriptos;
    }
}
