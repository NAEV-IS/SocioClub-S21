package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.service.ActividadService;
import com.losalgarrobos.socioclub.service.ReglaNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/actividades")
@CrossOrigin(origins = "http://localhost:3000")
public class ActividadRestController {

    private final ActividadService actividadService;

    public ActividadRestController(ActividadService actividadService) {
        this.actividadService = actividadService;
    }

    @GetMapping
    public ResponseEntity<List<Actividad>> listar(@RequestParam(required = false) String disciplina) {
        return ResponseEntity.ok(actividadService.listarPorDisciplina(disciplina));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return actividadService.buscarPorId(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "La actividad no existe.")));
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Actividad actividad) {
        try {
            actividad.setId(null);
            Actividad guardada = actividadService.guardar(actividad);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (ReglaNegocioException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Actividad actividad) {
        if (actividadService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "La actividad no existe."));
        }
        try {
            actividad.setId(id);
            Actividad actualizada = actividadService.guardar(actividad);
            return ResponseEntity.ok(actualizada);
        } catch (ReglaNegocioException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (actividadService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "La actividad no existe."));
        }
        try {
            actividadService.eliminar(id);
            return ResponseEntity.noContent().build();
        } catch (ReglaNegocioException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }
}
