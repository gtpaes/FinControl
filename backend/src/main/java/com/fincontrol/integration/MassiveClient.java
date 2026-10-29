package com.fincontrol.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fincontrol.dto.MarketQuoteResponse;

/**
 * Cotações de ativos dos EUA via Massive (ex-Polygon).
 * Token vem de MASSIVE_API_TOKEN. Plano gratuito: 5 chamadas/min —
 * por isso o MarketDataService faz cache de 5 minutos.
 */
@Component
public class MassiveClient {

    private static final String BASE = "https://api.massive.com";

    private final String token;
    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public MassiveClient(@Value("${MASSIVE_API_TOKEN:}") String token) {
        this.token = token == null ? "" : token.trim();
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public boolean isConfigured() {
        return !token.isBlank();
    }

    /** Fechamento da sessão anterior: preço = close, variação % = (close/open − 1). */
    public MarketQuoteResponse fetchQuote(String ticker) {
        if (!isConfigured()) return MarketQuoteResponse.unavailable(ticker);
        try {
            String url = BASE + "/v2/aggs/ticker/" + ticker + "/prev?adjusted=true&apiKey=" + token;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return MarketQuoteResponse.unavailable(ticker);

            JsonNode root = mapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) return MarketQuoteResponse.unavailable(ticker);

            JsonNode bar = results.get(0);
            BigDecimal open = BigDecimal.valueOf(bar.path("o").asDouble());
            BigDecimal close = BigDecimal.valueOf(bar.path("c").asDouble());
            BigDecimal changePct = open.signum() > 0
                    ? close.subtract(open).divide(open, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                    : null;

            return new MarketQuoteResponse(
                    ticker, null, close.setScale(2, RoundingMode.HALF_UP), changePct,
                    "USD", "massive", Instant.now()
            );
        } catch (Exception e) {
            return MarketQuoteResponse.unavailable(ticker);
        }
    }

    /** Catálogo de ações dos EUA (Massive reference/tickers) com cotações. */
    public List<com.fincontrol.dto.MarketSearchItem> searchCatalog(String q) {
        List<com.fincontrol.dto.MarketSearchItem> out = new ArrayList<>();
        if (!isConfigured()) return out;
        try {
            String term = q == null ? "" : q.trim().toUpperCase();
            String url = BASE + "/v3/reference/tickers?active=true&type=CS&limit=200&apiKey=" + token;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10)).header("Accept", "application/json").GET().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return out;
            JsonNode root = mapper.readTree(response.body());
            JsonNode results = root.path("results");
            int limit = 0;
            for (JsonNode r : results) {
                String tk = r.path("ticker").asText();
                String name = r.path("name").asText("");
                if (term.isEmpty() || tk.contains(term) || name.toUpperCase().contains(term)) {
                    out.add(com.fincontrol.dto.MarketSearchItem.of(tk, name, "ACOES", "US", "USD"));
                    if (++limit >= 30) break; // limita a 10 para buscar cotações
                }
            }
            // Busca cotações dos resultados (1 chamada por ticker)
            for (int i = 0; i < out.size(); i++) {
                com.fincontrol.dto.MarketSearchItem item = out.get(i);
                MarketQuoteResponse quote = fetchQuote(item.ticker());
                if (quote.price() != null) {
                    out.set(i, com.fincontrol.dto.MarketSearchItem.withQuote(
                            item.ticker(), item.name(), item.type(), item.market(), item.currency(),
                            quote.price(), quote.changePercent()));
                }
            }
        } catch (Exception e) {
            // ignora
        }
        return out;
    }
}
