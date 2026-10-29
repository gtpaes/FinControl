package com.fincontrol.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Cotação de mercado de um ativo (dados ao vivo do provedor).
 * price = null quando o provedor não respondeu — o frontend usa o preço salvo.
 */
public record MarketQuoteResponse(
        String ticker,
        String name,
        BigDecimal price,
        BigDecimal changePercent,
        String currency,
        String source,
        Instant fetchedAt
) {
    public static MarketQuoteResponse unavailable(String ticker) {
        return new MarketQuoteResponse(ticker, null, null, null, null, "unavailable", Instant.now());
    }
}
