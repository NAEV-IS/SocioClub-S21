package com.losalgarrobos.socioclub.service;

/**
 * Excepción que lanza la capa de servicio cuando una operación viola una regla de negocio.
 * El controlador la captura y muestra el mensaje en la vista (y más adelante, en la API REST,
 * se traducirá a un 409 Conflict).
 */
public class ReglaNegocioException extends RuntimeException {

    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
