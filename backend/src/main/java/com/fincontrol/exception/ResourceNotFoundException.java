package com.fincontrol.exception;

/**
 * Exceção de negócio mapeada para HTTP 404.
 * Os services lançam essa exceção quando um recurso (do próprio usuário) não existe.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Object id) {
        super("%s com id '%s' não encontrado".formatted(resource, id));
    }
}
