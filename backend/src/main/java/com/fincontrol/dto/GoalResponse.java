package com.fincontrol.dto;

import com.fincontrol.entity.Goal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String name,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        LocalDate deadline,
        String color,
        Instant createdAt,
        Instant updatedAt
) {
    public static GoalResponse from(Goal g) {
        return new GoalResponse(
                g.getAppId(),
                g.getName(),
                g.getTargetAmount().setScale(2, RoundingMode.HALF_UP),
                g.getCurrentAmount().setScale(2, RoundingMode.HALF_UP),
                g.getDeadline(),
                g.getColor(),
                g.getCreatedAt(),
                g.getUpdatedAt()
        );
    }
}
