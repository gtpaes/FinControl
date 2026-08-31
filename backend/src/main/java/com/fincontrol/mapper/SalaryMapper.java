package com.fincontrol.mapper;

import com.fincontrol.dto.SalaryResponse;
import com.fincontrol.entity.Salary;

import java.math.RoundingMode;

public final class SalaryMapper {
    private SalaryMapper() {}
    public static SalaryResponse toResponse(Salary s) {
        return new SalaryResponse(
                s.getAppId(),
                s.getAmount().setScale(2, RoundingMode.HALF_UP),
                s.getDescription(),
                s.getReferenceMonth(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
