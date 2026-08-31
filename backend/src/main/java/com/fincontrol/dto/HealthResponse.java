package com.fincontrol.dto;

/**
 * DTO (Data Transfer Object) = objeto que atravessa a API.
 *
 * Nunca exponhamos entidades JPA diretamente na API: o DTO define
 * exatamente o contrato HTTP que o frontend consumirá.
 *
 * "record" (Java 16+) já gera construtor, getters, equals, hashCode e toString.
 */
public record HealthResponse(
        String application,
        String status
) {
}
