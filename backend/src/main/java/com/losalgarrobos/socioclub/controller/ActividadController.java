package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.Actividad;
import com.losalgarrobos.socioclub.service.ActividadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/actividades")
public class ActividadController {

    @Autowired
    private ActividadService actividadService;

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("actividades", actividadService.listarTodas());
        model.addAttribute("cupos", new java.util.HashMap<Long, Long>() {{
            actividadService.listarTodas().forEach(a ->
                put(a.getId(), actividadService.cupoDisponible(a.getId())));
        }});
        return "actividades/listar";
    }

    @GetMapping("/nueva")
    public String formAlta(Model model) {
        model.addAttribute("actividad", new Actividad());
        model.addAttribute("titulo", "Nueva actividad");
        return "actividades/form";
    }

    @PostMapping
    public String guardar(@ModelAttribute Actividad actividad) {
        actividadService.guardar(actividad);
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

    @GetMapping("/eliminar/{id}")
    public String eliminar(@PathVariable Long id) {
        actividadService.eliminar(id);
        return "redirect:/actividades";
    }
}
