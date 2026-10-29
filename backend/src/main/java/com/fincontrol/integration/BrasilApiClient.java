package com.fincontrol.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

import com.fincontrol.dto.MarketQuoteResponse;

/**
 * Taxas brasileiras (CDI, Selic) via BrasilAPI — gratuita, sem chave.
 * GET https://brasilapi.com.br/api/taxas/v1 -> [{nome:"CDI", valor:13.9}, ...]
 */
@Component
public class BrasilApiClient {

    private static final Logger log = LoggerFactory.getLogger(BrasilApiClient.class);
    private static final String URL = "https://brasilapi.com.br/api/taxas/v1";

    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public BrasilApiClient() {
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    /** Retorna a taxa como cotação (price = % a.a., ex.: 13.9). Ticker: CDI ou SELIC. */
    public MarketQuoteResponse fetchRate(String ticker) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("BrasilAPI respondeu {}: {}", response.statusCode(), ticker);
                return MarketQuoteResponse.unavailable(ticker);
            }

            JsonNode root = mapper.readTree(response.body());
            String wanted = ticker.equals("SELIC") ? "Selic" : "CDI";
            for (JsonNode item : root) {
                if (wanted.equalsIgnoreCase(item.path("nome").asText())) {
                    BigDecimal rate = item.path("valor").decimalValue().setScale(2, java.math.RoundingMode.HALF_UP);
                    return new MarketQuoteResponse(
                            ticker, wanted + " (% a.a.)", rate, null,
                            "% a.a.", "brasilapi", Instant.now()
                    );
                }
            }
            log.warn("BrasilAPI não retornou a taxa {}", wanted);
            return MarketQuoteResponse.unavailable(ticker);
        } catch (Exception e) {
            log.warn("BrasilAPI erro para {}: {}", ticker, e.getMessage());
            return MarketQuoteResponse.unavailable(ticker);
        }
    }
}
