package com.fincontrol.service;

import com.fincontrol.dto.MarketQuoteResponse;
import com.fincontrol.integration.BrasilApiClient;
import com.fincontrol.integration.BrapiClient;
import com.fincontrol.integration.MassiveClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Roteia cada ticker para o provedor correto e faz cache de 5 minutos
 * (respeita o limite de 5 req/min do plano gratuito da Massive).
 */
@Service
public class MarketDataService {

    private static final Pattern B3_PATTERN = Pattern.compile("^[A-Z]{4}[0-9]{1,2}$");
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private static final int MAX_TICKERS = 20;

    private final BrapiClient brapiClient;
    private final MassiveClient massiveClient;
    private final BrasilApiClient brasilApiClient;

    private final Map<String, CacheEntry> cache = new HashMap<>();

    private record CacheEntry(MarketQuoteResponse quote, Instant expiresAt) {
        boolean fresh() { return Instant.now().isBefore(expiresAt); }
    }

    public MarketDataService(BrapiClient brapiClient, MassiveClient massiveClient, BrasilApiClient brasilApiClient) {
        this.brapiClient = brapiClient;
        this.massiveClient = massiveClient;
        this.brasilApiClient = brasilApiClient;
    }

    /** Cotações para uma lista de tickers (vírgula-separados no controller, máx 20). */
    public List<MarketQuoteResponse> quotes(List<String> tickers) {
        List<MarketQuoteResponse> out = new ArrayList<>();
        List<String> b3Pending = new ArrayList<>();

        for (String raw : tickers) {
            String ticker = normalize(raw);
            if (ticker.isEmpty()) continue;

            CacheEntry cached = cache.get(ticker);
            if (cached != null && cached.fresh()) {
                out.add(cached.quote());
                continue;
            }

            if (ticker.equals("CDI") || ticker.equals("SELIC")) {
                MarketQuoteResponse q = brasilApiClient.fetchRate(ticker);
                out.add(cachePut(ticker, q));
            } else if (B3_PATTERN.matcher(ticker).matches()) {
                b3Pending.add(ticker); // agrupado numa única chamada à Brapi
            } else {
                MarketQuoteResponse q = massiveClient.fetchQuote(ticker);
                out.add(cachePut(ticker, q));
            }
        }

        if (!b3Pending.isEmpty()) {
            for (MarketQuoteResponse q : brapiClient.fetchQuotes(b3Pending)) {
                out.add(cachePut(normalize(q.ticker()), q));
            }
        }
        return out;
    }

    private String normalize(String ticker) {
        return ticker == null ? "" : ticker.trim().toUpperCase();
    }

    /** Cataloga ativos por mercado (B3 via brapi, US via Massive). */
    public List<com.fincontrol.dto.MarketSearchItem> search(String q, String market) {
        String m = market == null ? "" : market.trim().toUpperCase();
        if (m.equals("US")) return massiveClient.searchCatalog(q);
        return brapiClient.searchCatalog(q);
    }

    /** Histórico de preços para um ticker (gráfico de linha). Range: 1mo|3mo|6mo|1y. */
    public com.fincontrol.dto.MarketHistoryResponse history(String ticker, String range) {
        String t = normalize(ticker);
        if (t.isEmpty()) return new com.fincontrol.dto.MarketHistoryResponse("", range, List.of());
        String r = range == null ? "1mo" : range;
        if (!List.of("1mo", "3mo", "6mo", "1y").contains(r)) r = "1mo";
        return brapiClient.history(t, r);
    }

    private MarketQuoteResponse cachePut(String ticker, MarketQuoteResponse quote) {
        cache.put(ticker, new CacheEntry(quote, Instant.now().plus(CACHE_TTL)));
        return quote;
    }
}
