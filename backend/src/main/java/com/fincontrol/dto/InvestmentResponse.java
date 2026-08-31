package com.fincontrol.dto;

import com.fincontrol.entity.Investment;
import com.fincontrol.entity.InvestmentType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record InvestmentResponse(
        UUID id,
        String ticker,
        String name,
        InvestmentType type,
        BigDecimal quantity,
        BigDecimal avgPrice,
        BigDecimal currentPrice,
        List<AporteResponse> aportes,
        Instant createdAt,
        Instant updatedAt
) {
    public static InvestmentResponse from(Investment i) {
        return new InvestmentResponse(
                i.getAppId(),
                i.getTicker(),
                i.getName(),
                i.getType(),
                i.getQuantity(),
                i.getAvgPrice().setScale(2, RoundingMode.HALF_UP),
                i.getCurrentPrice().setScale(2, RoundingMode.HALF_UP),
                i.getAportes().stream().map(AporteResponse::from).toList(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }
}
