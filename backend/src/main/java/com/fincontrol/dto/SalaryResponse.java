package com.fincontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Resposta pública de um salário. Nunca expõe o objeto User completo. */
public record SalaryResponse(
        UUID id,
        BigDecimal amount,
        String description,
        String referenceMonth,
        Instant createdAt,
        Instant updatedAt
) {
}