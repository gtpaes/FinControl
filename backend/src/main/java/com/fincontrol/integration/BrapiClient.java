package com.fincontrol.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
 * Cotações da B3 (ações, FIIs, ETFs) via brapi.dev.
 * Token vem de BRAPI_TOKEN. Uma única chamada suporta vários tickers.
 */
@Component
public class BrapiClient {

    private static final Logger log = LoggerFactory.getLogger(BrapiClient.class);
    private static final String BASE = "https://brapi.dev/api/quote/";

    private final String token;
    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public BrapiClient(@Value("${BRAPI_TOKEN:}") String token) {
        this.token = token == null ? "" : token.trim();
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    public boolean isConfigured() {
        return !token.isBlank();
    }

    /** Busca cotações da B3 — uma chamada por ticker (plano gratuito da brapi aceita apenas 1 por request). */
    public List<MarketQuoteResponse> fetchQuotes(List<String> tickers) {
        List<MarketQuoteResponse> out = new ArrayList<>();
        if (!isConfigured()) {
            tickers.forEach(t -> out.add(MarketQuoteResponse.unavailable(t)));
            return out;
        }
        for (String ticker : tickers) {
            out.add(fetchOne(ticker));
        }
        return out;
    }

    private MarketQuoteResponse fetchOne(String ticker) {
        try {
            String url = BASE + ticker + "?token=" + token;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Brapi respondeu {} para {} (token configurado: {})", response.statusCode(), ticker, !token.isBlank());
                return MarketQuoteResponse.unavailable(ticker);
            }
            JsonNode root = mapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) return MarketQuoteResponse.unavailable(ticker);

            JsonNode node = results.get(0);
            if (node.path("regularMarketPrice").isMissingNode()) {
                return MarketQuoteResponse.unavailable(ticker);
            }
            return new MarketQuoteResponse(
                    ticker,
                    node.path("longName").asText(node.path("shortName").asText(null)),
                    node.path("regularMarketPrice").decimalValue().setScale(2, RoundingMode.HALF_UP),
                    node.has("regularMarketChangePercent")
                            ? node.path("regularMarketChangePercent").decimalValue().setScale(2, RoundingMode.HALF_UP)
                            : null,
                    node.path("currency").asText("BRL"),
                    "brapi",
                    Instant.now()
            );
        } catch (Exception e) {
            log.warn("Brapi erro para {}: {}", ticker, e.getMessage());
            return MarketQuoteResponse.unavailable(ticker);
        }
    }

    /** Catálogo de tickers da B3 (brapi available). */
    public List<com.fincontrol.dto.MarketSearchItem> searchCatalog(String q) {
        List<com.fincontrol.dto.MarketSearchItem> out = new ArrayList<>();
        if (!isConfigured()) return out;
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://brapi.dev/api/available?token=" + token))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return out;
            JsonNode root = mapper.readTree(response.body());
            JsonNode stocks = root.path("stocks");
            String term = q == null ? "" : q.trim().toUpperCase();
            int limit = 0;
            for (JsonNode s : stocks) {
                String tk = s.asText();
                if (term.isEmpty() || tk.contains(term)) {
                    String type = guessType(tk);
                    out.add(com.fincontrol.dto.MarketSearchItem.of(tk, tk, type, "B3", "BRL"));
                    if (++limit >= 30) break; // limita a 10 para buscar cotações sem estourar rate limit
                }
            }
            // Busca cotações dos resultados (1 chamada por ticker no plano gratuito)
            for (int i = 0; i < out.size(); i++) {
                com.fincontrol.dto.MarketSearchItem item = out.get(i);
                MarketQuoteResponse quote = fetchOne(item.ticker());
                if (quote.price() != null) {
                    out.set(i, com.fincontrol.dto.MarketSearchItem.withQuote(
                            item.ticker(), item.name(), item.type(), item.market(), item.currency(),
                            quote.price(), quote.changePercent()));
                }
            }
        } catch (Exception e) {
            log.warn("Brapi catálogo erro: {}", e.getMessage());
        }
        return out;
    }

    /** Histórico diário via brapi (range -> numero de dias). */
    public com.fincontrol.dto.MarketHistoryResponse history(String ticker, String range) {
        int days = "1y".equals(range) ? 365 : "6mo".equals(range) ? 180 : "3mo".equals(range) ? 90 : 30;
        List<com.fincontrol.dto.MarketHistoryResponse.Point> pts = new ArrayList<>();
        if (!isConfigured()) {
            log.warn("Brapi não configurado (token vazio) para history de {}", ticker);
            return new com.fincontrol.dto.MarketHistoryResponse(ticker, range, pts);
        }
        try {
            String url = "https://brapi.dev/api/quote/" + ticker + "?range=" + (days == 365 ? "1y" : days == 180 ? "6mo" : days == 90 ? "3mo" : "1mo")
                    + "&interval=1d&token=" + token;
            log.debug("Brapi history URL: {}", url);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(10)).header("Accept", "application/json").GET().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Brapi history status {} para {}", response.statusCode(), ticker);
            if (response.statusCode() != 200) {
                log.warn("Brapi history retornou {} para {}: {}", response.statusCode(), ticker, response.body().substring(0, Math.min(200, response.body().length())));
                return new com.fincontrol.dto.MarketHistoryResponse(ticker, range, pts);
            }
            JsonNode root = mapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) {
                log.warn("Brapi history sem results para {}", ticker);
                return new com.fincontrol.dto.MarketHistoryResponse(ticker, range, pts);
            }
            JsonNode hist = results.get(0).path("historicalDataPrice");
            log.debug("Brapi hist node: {}", hist.getNodeType());
            if (hist.isArray()) {
                for (JsonNode h : hist) {
                    if (h.path("close").isMissingNode()) continue;
                    pts.add(new com.fincontrol.dto.MarketHistoryResponse.Point(
                            h.path("date").asText(""),
                            h.path("close").decimalValue().setScale(2, RoundingMode.HALF_UP)
                    ));
                }
            }
            log.info("Brapi history de {}: {} pontos", ticker, pts.size());
        } catch (Exception e) {
            log.warn("Brapi histórico erro para {}: {}", ticker, e.getMessage(), e);
            pts.clear();
        }
        return new com.fincontrol.dto.MarketHistoryResponse(ticker, range, pts);
    }

    private String guessType(String tk) {
        // ETFs conhecidos (B3)
        if (tk.matches("^(BOVA|SMAL|IVVB|XFIX|GOLD|ECOO|DIVO|ISUS|MATB|PIBB|QRVG|RECD|SLCY|SPXI|URPR|VRTA|WRLD)[0-9]*$")) return "ETFS";
        // FII -> 4 letras + 11
        if (tk.matches("^[A-Z]{4}11$")) return "FIIS";
        // Acao -> 3-4 letras + digito
        if (tk.matches("^[A-Z]{4}[0-9]{1}$")) return "ACOES";
        return "ETFS";
    }
}
