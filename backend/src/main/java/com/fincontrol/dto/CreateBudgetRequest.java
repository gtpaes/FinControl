package com.fincontrol.dto;

import com.fincontrol.entity.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateBudgetRequest(
        @NotNull(message = "Categoria é obrigatória")
        ExpenseCategory category,

        @NotNull(message = "Limite é obrigatório")
        @DecimalMin(value = "0.01", message = "Limite deve ser maior que zero")
        BigDecimal limitAmount
) {
}
