package com.fincontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Resposta pública de uma receita. */
public record IncomeResponse(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate date,
        com.fincontrol.entity.IncomeCategory category,
        com.fincontrol.entity.Recurrence recurrence,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}