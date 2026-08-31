package com.fincontrol.controller;

import com.fincontrol.dto.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint de health check.
 *
 * Controllers cuidam APENAS de HTTP (mapear rota -> resposta).
 * Aqui não há regra de negócio, então não há service envolvido.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public HealthResponse health() {
        return new HealthResponse("FinControl API", "UP");
    }
}
