package com.fincontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Resposta pública de uma despesa. */
public record ExpenseResponse(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate date,
        com.fincontrol.entity.ExpenseCategory category,
        com.fincontrol.entity.ExpenseType type,
        com.fincontrol.entity.ExpenseStatus status,
        boolean recurring,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}