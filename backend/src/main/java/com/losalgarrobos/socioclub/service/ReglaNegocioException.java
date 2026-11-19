package com.losalgarrobos.socioclub.service;

/**
 * Excepción que lanza la capa de servicio cuando una operación viola una regla de negocio.
 * El controlador MVC la captura para mostrar el mensaje en la vista y la API REST la traduce
 * a un 409 Conflict con el código de regla correspondiente (RN1 a RN5).
 */
public class ReglaNegocioException extends RuntimeException {

    private final String regla;

    public ReglaNegocioException(String mensaje) {
        this(null, mensaje);
    }

    public ReglaNegocioException(String regla, String mensaje) {
        super(mensaje);
        this.regla = regla;
    }

    public String getRegla() {
        return regla;
    }
}
