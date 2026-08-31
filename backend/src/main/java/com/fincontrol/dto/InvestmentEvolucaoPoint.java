package com.fincontrol.dto;

import java.math.BigDecimal;

/** Ponto da evolução dos investimentos: aportes do mês e valor acumulado (a custo). */
public record InvestmentEvolucaoPoint(
        String mes,
        BigDecimal aportes,
        BigDecimal valor
) {
}