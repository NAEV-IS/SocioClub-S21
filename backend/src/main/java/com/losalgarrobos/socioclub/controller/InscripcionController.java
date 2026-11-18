package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.model.Inscripcion;
import com.losalgarrobos.socioclub.repository.SocioRepository;
import com.losalgarrobos.socioclub.service.ActividadService;
import com.losalgarrobos.socioclub.service.InscripcionService;
import com.losalgarrobos.socioclub.service.ReglaNegocioException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import java.util.List;

@Controller
@RequestMapping("/inscripciones")
public class InscripcionController {
    private final InscripcionService inscripciones;
    private final ActividadService actividades;
    private final SocioRepository socios;

    public InscripcionController(InscripcionService inscripciones, ActividadService actividades,
                                 SocioRepository socios) {
        this.inscripciones = inscripciones;
        this.actividades = actividades;
        this.socios = socios;
    }

    @GetMapping
    public String formulario(@RequestParam(required = false) Long actividadId, Model model) {
        model.addAttribute("actividadId", actividadId);
        cargarOpciones(model);
        return "inscripciones/form";
    }

    @PostMapping
    public String inscribir(@RequestParam Long socioId, @RequestParam Long actividadId,
                             Model model, RedirectAttributes redirect) {
        try {
            inscripciones.inscribir(socioId, actividadId);
        } catch (ReglaNegocioException e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("socioId", socioId);
            model.addAttribute("actividadId", actividadId);
            cargarOpciones(model);
            return "inscripciones/form";
        }
        redirect.addFlashAttribute("exito", "Inscripción realizada correctamente.");
        return "redirect:/inscripciones/actividad/" + actividadId;
    }

    @GetMapping("/actividad/{id}")
    public String listar(@PathVariable Long id, Model model) {
        Actividad actividad = actividades.buscarPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La actividad no existe."));
        List<Inscripcion> activas = inscripciones.activas(id);
        model.addAttribute("actividad", actividad);
        model.addAttribute("inscripciones", activas);
        model.addAttribute("cupo", actividades.cupoDisponible(id));
        return "inscripciones/listar";
    }

    @GetMapping("/{id}/baja")
    public String confirmarBaja(@PathVariable Long id, Model model) {
        model.addAttribute("inscripcion", inscripciones.buscar(id));
        return "inscripciones/baja";
    }

    @PostMapping("/{id}/baja")
    public String darDeBaja(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean confirmar,
                            RedirectAttributes redirect) {
        try {
            Long actividadId = inscripciones.darDeBaja(id, confirmar);
            redirect.addFlashAttribute("exito", "Inscripción dada de baja.");
            return "redirect:/inscripciones/actividad/" + actividadId;
        } catch (ReglaNegocioException e) {
            redirect.addFlashAttribute("error", e.getMessage());
            return "redirect:/inscripciones/" + id + "/baja";
        }
    }

    private void cargarOpciones(Model model) {
        List<Actividad> lista = actividades.listarTodas();
        model.addAttribute("actividades", lista);
        model.addAttribute("cupos", actividades.cuposDisponibles(lista));
        model.addAttribute("socios", socios.findAll(Sort.by("apellido", "nombre", "id")));
    }
}
