package com.fincontrol.dto;

import com.fincontrol.entity.Budget;
import com.fincontrol.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public record BudgetResponse(
        UUID id,
        ExpenseCategory category,
        BigDecimal limitAmount
) {
    public static BudgetResponse from(Budget b) {
        return new BudgetResponse(
                b.getAppId(),
                b.getCategory(),
                b.getLimitAmount().setScale(2, RoundingMode.HALF_UP)
        );
    }
}
