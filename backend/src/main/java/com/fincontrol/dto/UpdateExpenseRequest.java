package com.fincontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Atualização de despesa (PUT = substituição). Sem userId. */
public record UpdateExpenseRequest(

        @NotBlank(message = "Descrição é obrigatória")
        @Size(max = 120, message = "Descrição deve ter no máximo 120 caracteres")
        String description,

        @NotNull(message = "Valor é obrigatório")
        @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
        BigDecimal amount,

        @NotNull(message = "Data é obrigatória")
        LocalDate date,

        @NotNull(message = "Categoria é obrigatória")
        com.fincontrol.entity.ExpenseCategory category,

        com.fincontrol.entity.ExpenseType type,
        com.fincontrol.entity.ExpenseStatus status,
        Boolean recurring,

        @Size(max = 500, message = "Observações devem ter no máximo 500 caracteres")
        String notes
) {
}