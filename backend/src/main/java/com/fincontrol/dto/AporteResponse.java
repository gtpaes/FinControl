package com.fincontrol.dto;

import com.fincontrol.entity.Aporte;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public record AporteResponse(
        LocalDate date,
        BigDecimal amount,
        BigDecimal quantity
) {
    public static AporteResponse from(Aporte a) {
        return new AporteResponse(
                a.getDate(),
                a.getAmount().setScale(2, RoundingMode.HALF_UP),
                a.getQuantity()
        );
    }
}
