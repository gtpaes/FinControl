package com.fincontrol.exception;

/**
 * Estrutura padrão de TODAS as respostas de erro da API.
 *
 * Exemplo:
 * {
 *   "status": 404,
 *   "error": "Not Found",
 *   "message": "Recurso não encontrado",
 *   "timestamp": "2026-08-27T12:00:00Z",
 *   "path": "/api/health"
 * }
 *
 * Ter um formato único facilita muito o tratamento de erros no frontend.
 */
import java.time.Instant;

public record ErrorResponse(
        int status,
        String error,
        String message,
        Instant timestamp,
        String path
) {
}
