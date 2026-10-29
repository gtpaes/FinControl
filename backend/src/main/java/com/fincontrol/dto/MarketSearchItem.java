package com.fincontrol.dto;

import java.math.BigDecimal;

/** Resultado da pesquisa no catálogo de ativos (B3 + EUA). */
public record MarketSearchItem(
        String ticker,
        String name,
        String type,
        String market,          // B3 | US
        String currency,
        BigDecimal price,       // cotação atual (pode ser null se indisponível)
        BigDecimal changePercent // variação % do dia (pode ser null)
) {
    public static MarketSearchItem of(String ticker, String name, String type, String market, String currency) {
        return new MarketSearchItem(ticker, name, type, market, currency, null, null);
    }

    public static MarketSearchItem withQuote(String ticker, String name, String type, String market, String currency,
                                              BigDecimal price, BigDecimal changePercent) {
        return new MarketSearchItem(ticker, name, type, market, currency, price, changePercent);
    }
}