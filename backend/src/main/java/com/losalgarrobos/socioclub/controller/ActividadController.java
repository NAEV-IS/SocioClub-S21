package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.service.ActividadService;
import com.losalgarrobos.socioclub.service.ReglaNegocioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import java.util.List;

@Controller
@RequestMapping("/actividades")
public class ActividadController {

    @Autowired
    private ActividadService actividadService;

    @GetMapping
    public String listar(Model model) {
        List<Actividad> actividades = actividadService.listarTodas();
        model.addAttribute("actividades", actividades);
        model.addAttribute("cupos", actividadService.cuposDisponibles(actividades));
        return "actividades/listar";
    }

    @GetMapping("/nueva")
    public String formAlta(Model model) {
        model.addAttribute("actividad", new Actividad());
        model.addAttribute("titulo", "Nueva actividad");
        return "actividades/form";
    }

    @PostMapping
    public String guardar(@ModelAttribute Actividad actividad, Model model, RedirectAttributes redirect) {
        try {
            actividadService.guardar(actividad);
        } catch (ReglaNegocioException e) {
            // Volvemos al formulario con los datos cargados y el mensaje de error
            model.addAttribute("error", e.getMessage());
            model.addAttribute("titulo", actividad.getId() == null ? "Nueva actividad" : "Editar actividad");
            return "actividades/form";
        }
        redirect.addFlashAttribute("exito", "Actividad guardada correctamente.");
        return "redirect:/actividades";
    }

    @GetMapping("/editar/{id}")
    public String formEdicion(@PathVariable Long id, Model model) {
        Actividad actividad = actividadService.buscarPorId(id).orElse(null);
        if (actividad == null) return "redirect:/actividades";
        model.addAttribute("actividad", actividad);
        model.addAttribute("titulo", "Editar actividad");
        return "actividades/form";
    }

    // POST y no GET: eliminar modifica datos, no debe dispararse con un simple enlace
    @PostMapping("/eliminar/{id}")
    public String eliminar(@PathVariable Long id, RedirectAttributes redirect) {
        try {
            actividadService.eliminar(id);
            redirect.addFlashAttribute("exito", "Actividad eliminada.");
        } catch (ReglaNegocioException e) {
            redirect.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/actividades";
    }
}
