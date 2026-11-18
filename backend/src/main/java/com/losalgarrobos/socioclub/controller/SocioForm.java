package com.losalgarrobos.socioclub.controller;

import com.losalgarrobos.socioclub.model.EstadoCuota;
import com.losalgarrobos.socioclub.model.Socio;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.Errors;

/** Only editable scalar fields; JPA associations are never bound from HTTP. */
public class SocioForm {
    private Long id;
    private String dni;
    private String nombre;
    private String apellido;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaNacimiento;
    private String email;
    private String telefono;
    private EstadoCuota estadoCuota = EstadoCuota.AL_DIA;

    public static SocioForm desde(Socio socio) {
        SocioForm form = new SocioForm();
        form.id = socio.getId();
        form.dni = socio.getDni();
        form.nombre = socio.getNombre();
        form.apellido = socio.getApellido();
        form.fechaNacimiento = socio.getFechaNacimiento();
        form.email = socio.getEmail();
        form.telefono = socio.getTelefono();
        form.estadoCuota = socio.getEstadoCuota();
        return form;
    }

    public void validar(Errors errors) {
        if (dni == null || !dni.matches("[0-9]{7,8}")) {
            errors.rejectValue("dni", "dni.invalido", "Ingresá un DNI de 7 u 8 dígitos, sin puntos.");
        }
        if (nombre == null || nombre.isBlank() || nombre.length() > 255) {
            errors.rejectValue("nombre", "nombre.invalido", "Ingresá el nombre (hasta 255 caracteres).");
        }
        if (apellido == null || apellido.isBlank() || apellido.length() > 255) {
            errors.rejectValue("apellido", "apellido.invalido", "Ingresá el apellido (hasta 255 caracteres).");
        }
        if (!errors.hasFieldErrors("fechaNacimiento")
                && (fechaNacimiento == null || fechaNacimiento.isAfter(LocalDate.now()))) {
            errors.rejectValue("fechaNacimiento", "fecha.invalida",
                    "Ingresá una fecha de nacimiento válida, no futura.");
        }
        if (email != null && !email.isEmpty()
                && (email.length() > 255 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))) {
            errors.rejectValue("email", "email.invalido", "Ingresá un email válido (hasta 255 caracteres).");
        }
        if (telefono != null && telefono.length() > 255) {
            errors.rejectValue("telefono", "telefono.invalido", "El teléfono admite hasta 255 caracteres.");
        }
        if (!errors.hasFieldErrors("estadoCuota") && estadoCuota == null) {
            errors.rejectValue("estadoCuota", "cuota.invalida", "Seleccioná un estado de cuota válido.");
        }
    }

    public Socio aSocio() {
        Socio socio = new Socio();
        socio.setId(id);
        socio.setDni(dni);
        socio.setNombre(nombre);
        socio.setApellido(apellido);
        socio.setFechaNacimiento(fechaNacimiento);
        socio.setEmail(email);
        socio.setTelefono(telefono);
        socio.setEstadoCuota(estadoCuota);
        return socio;
    }

    private String limpiar(String value) { return value == null ? null : value.strip(); }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = limpiar(dni); }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = limpiar(nombre); }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = limpiar(apellido); }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = limpiar(email); }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = limpiar(telefono); }
    public EstadoCuota getEstadoCuota() { return estadoCuota; }
    public void setEstadoCuota(EstadoCuota estadoCuota) { this.estadoCuota = estadoCuota; }
}
