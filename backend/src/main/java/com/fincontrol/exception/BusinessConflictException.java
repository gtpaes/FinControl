package com.fincontrol.exception;

/**
 * Exceção de negócio mapeada para HTTP 409 (Conflito).
 * Exemplo futuro: cadastro com e-mail já existente.
 */
public class BusinessConflictException extends RuntimeException {

    public BusinessConflictException(String message) {
        super(message);
    }
}
