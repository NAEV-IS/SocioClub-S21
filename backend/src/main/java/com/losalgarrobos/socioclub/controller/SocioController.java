package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.service.ReglaNegocioException;
import com.losalgarrobos.socioclub.service.SocioService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/socios")
public class SocioController {
    private final SocioService socioService;

    public SocioController(SocioService socioService) {
        this.socioService = socioService;
    }

    @InitBinder("socio")
    public void configurarFormulario(WebDataBinder binder) {
        binder.setAllowedFields("id", "dni", "nombre", "apellido", "fechaNacimiento",
                "email", "telefono", "estadoCuota");
    }

    @GetMapping
    public String listar(@RequestParam(defaultValue = "") String apellido,
                         @RequestParam(defaultValue = "0") String page, Model model) {
        int pagina;
        try {
            pagina = Math.max(0, Integer.parseInt(page));
        } catch (NumberFormatException e) {
            pagina = 0;
        }
        String filtro = apellido.strip();
        model.addAttribute("pagina", socioService.listar(filtro, pagina));
        model.addAttribute("apellido", filtro);
        return "socios/listar";
    }

    @GetMapping("/nuevo")
    public String formAlta(Model model) {
        model.addAttribute("socio", new SocioForm());
        return formulario(model, false);
    }

    @GetMapping("/editar/{id}")
    public String formEdicion(@PathVariable String id, Model model, RedirectAttributes redirect) {
        Long socioId = leerId(id);
        var socio = socioService.buscarPorId(socioId);
        if (socio.isEmpty()) return socioInexistente(redirect);
        model.addAttribute("socio", SocioForm.desde(socio.get()));
        return formulario(model, true);
    }

    @PostMapping
    public String guardar(@ModelAttribute("socio") SocioForm form, BindingResult binding,
                          Model model, RedirectAttributes redirect) {
        if (binding.hasFieldErrors("id")) {
            model.addAttribute("error", "El socio indicado no existe.");
            return formulario(model, true);
        }
        if (form.getId() != null && socioService.buscarPorId(form.getId()).isEmpty()) {
            return socioInexistente(redirect);
        }
        form.validar(binding);
        if (!binding.hasErrors()) {
            try {
                socioService.guardar(form.aSocio());
                redirect.addFlashAttribute("exito", "Socio guardado correctamente.");
                return "redirect:/socios";
            } catch (ReglaNegocioException e) {
                model.addAttribute("error", e.getMessage());
            } catch (DataIntegrityViolationException e) {
                model.addAttribute("error", "Ya existe un socio con ese DNI.");
            }
        }
        return formulario(model, form.getId() != null);
    }

    private Long leerId(String value) {
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String socioInexistente(RedirectAttributes redirect) {
        redirect.addFlashAttribute("error", "El socio indicado no existe.");
        return "redirect:/socios";
    }

    private String formulario(Model model, boolean edicion) {
        model.addAttribute("titulo", edicion ? "Editar socio" : "Nuevo socio");
        return "socios/form";
    }
}
