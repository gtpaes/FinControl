package com.fincontrol.exception;

/**
 * Exceção mapeada para HTTP 401. Usada em credenciais inválidas,
 * usuário desativado etc. Sempre com mensagem genérica para não
 * revelar informações sobre a existência de contas.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}