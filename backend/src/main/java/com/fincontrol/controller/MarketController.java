package com.fincontrol.controller;

import com.fincontrol.dto.MarketQuoteResponse;
import com.fincontrol.service.MarketDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Cotações de mercado ao vivo. Protegido por JWT (SecurityConfig cobre /api/**).
 */
@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketDataService marketDataService;

    public MarketController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    /** Ex.: GET /api/market/quotes?tickers=PETR4,HGLG11,VOO (máx 20, vírgula-separado). */
    @GetMapping("/quotes")
    public List<MarketQuoteResponse> quotes(@RequestParam String tickers) {
        List<String> list = Arrays.stream(tickers.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .limit(20)
                .toList();
        return marketDataService.quotes(list);
    }

    /** Catálogo pesquisável. market = B3 | US. Ex.: GET /api/market/search?q=PET&market=B3 */
    @GetMapping("/search")
    public List<com.fincontrol.dto.MarketSearchItem> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "B3") String market) {
        return marketDataService.search(q, market);
    }

    /** Histórico de preços para gráfico. Ex.: GET /api/market/history?ticker=PETR4&range=6mo */
    @GetMapping("/history")
    public com.fincontrol.dto.MarketHistoryResponse history(
            @RequestParam String ticker,
            @RequestParam(defaultValue = "1mo") String range) {
        return marketDataService.history(ticker, range);
    }
}
