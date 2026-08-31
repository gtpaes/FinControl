package com.fincontrol.mapper;

import com.fincontrol.dto.ExpenseResponse;
import com.fincontrol.entity.Expense;

import java.math.RoundingMode;

public final class ExpenseMapper {
    private ExpenseMapper() {}
    public static ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getAppId(),
                e.getDescription(),
                e.getAmount().setScale(2, RoundingMode.HALF_UP),
                e.getDate(),
                e.getCategory(),
                e.getType() == null ? com.fincontrol.entity.ExpenseType.VARIAVEL : e.getType(),
                e.getStatus() == null ? com.fincontrol.entity.ExpenseStatus.PAGA : e.getStatus(),
                e.isRecurring(),
                e.getNotes(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
