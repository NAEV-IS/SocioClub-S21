package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Inscripcion;
import com.losalgarrobos.socioclub.service.ActividadService;
import com.losalgarrobos.socioclub.service.InscripcionService;
import com.losalgarrobos.socioclub.service.SocioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/socios")
@CrossOrigin(origins = "http://localhost:3000")
public class SocioRestController {

    private final SocioService socioService;
    private final InscripcionService inscripcionService;
    private final ActividadService actividadService;

    public SocioRestController(SocioService socioService, InscripcionService inscripcionService,
                               ActividadService actividadService) {
        this.socioService = socioService;
        this.inscripcionService = inscripcionService;
        this.actividadService = actividadService;
    }

    @GetMapping("/dni/{dni}")
    public ResponseEntity<?> buscarPorDni(@PathVariable String dni) {
        return socioService.buscarPorDni(dni)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No se encontró un socio con ese DNI.")));
    }

    @GetMapping("/{id}/inscripciones")
    public ResponseEntity<?> inscripcionesActivas(@PathVariable Long id) {
        if (socioService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "El socio no existe."));
        }
        List<Inscripcion> activas = inscripcionService.activasPorSocio(id);
        for (Inscripcion inscripcion : activas) {
            inscripcion.getActividad().setCupoDisponible(
                    actividadService.cupoDisponible(inscripcion.getActividad().getId()));
        }
        return ResponseEntity.ok(activas);
    }
}
