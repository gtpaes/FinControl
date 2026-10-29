package com.fincontrol.dto;

import java.math.BigDecimal;
import java.util.List;

/** Histórico de preços de um ativo (para gráfico de linha). */
public record MarketHistoryResponse(
        String ticker,
        String range,
        List<Point> data
) {
    public record Point(String date, BigDecimal close) {}
}