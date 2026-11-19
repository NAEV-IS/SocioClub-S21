package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Inscripcion;
import com.losalgarrobos.socioclub.service.ActividadService;
import com.losalgarrobos.socioclub.service.InscripcionService;
import com.losalgarrobos.socioclub.service.ReglaNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/inscripciones")
@CrossOrigin(origins = "http://localhost:3000")
public class InscripcionRestController {

    private final InscripcionService inscripcionService;
    private final ActividadService actividadService;

    public InscripcionRestController(InscripcionService inscripcionService, ActividadService actividadService) {
        this.inscripcionService = inscripcionService;
        this.actividadService = actividadService;
    }

    @PostMapping
    public ResponseEntity<?> inscribir(@RequestBody Map<String, Long> body) {
        Long socioId = body != null ? body.get("socioId") : null;
        Long actividadId = body != null ? body.get("actividadId") : null;
        if (socioId == null || actividadId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debés enviar socioId y actividadId."));
        }
        try {
            Inscripcion inscripcion = inscripcionService.inscribir(socioId, actividadId);
            return ResponseEntity.status(HttpStatus.CREATED).body(inscripcion);
        } catch (ReglaNegocioException e) {
            if (e.getRegla() == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
            }
            Map<String, String> error = new LinkedHashMap<>();
            error.put("error", e.getMessage());
            error.put("regla", e.getRegla());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }
    }

    @PutMapping("/{id}/baja")
    public ResponseEntity<?> darDeBaja(@PathVariable Long id) {
        try {
            Inscripcion inscripcion = inscripcionService.darDeBaja(id);
            inscripcion.getActividad().setCupoDisponible(
                    actividadService.cupoDisponible(inscripcion.getActividad().getId()));
            return ResponseEntity.ok(inscripcion);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "La inscripción no existe."));
        } catch (ReglaNegocioException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
