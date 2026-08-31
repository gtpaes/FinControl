package com.fincontrol.mapper;

import com.fincontrol.dto.IncomeResponse;
import com.fincontrol.entity.Income;

import java.math.RoundingMode;

public final class IncomeMapper {
    private IncomeMapper() {}
    public static IncomeResponse toResponse(Income i) {
        return new IncomeResponse(
                i.getAppId(),
                i.getDescription(),
                i.getAmount().setScale(2, RoundingMode.HALF_UP),
                i.getDate(),
                i.getCategory(),
                i.getRecurrence() == null ? com.fincontrol.entity.Recurrence.UNICA : i.getRecurrence(),
                i.getNotes(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }
}
