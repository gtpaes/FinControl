package com.fincontrol.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração de CORS.
 *
 * NÃO conectamos o frontend ainda. A origem permitida vem da variável
 * de ambiente FRONTEND_URL (ex.: http://localhost:5173).
 *
 * CORS por allowlist: a(s) origem(ns) permitida(s) vêm da variável de
 * ambiente FRONTEND_URL. Aceita uma origem ou várias separadas por
 * vírgula (ex.: "http://localhost:5500,https://fincontrol.onrender.com").
 *
 * Nunca liberamos "*" indiscriminadamente: com autenticação Bearer isso
 * seria inseguro. Sem FRONTEND_URL, o CORS fica desativado.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.frontend-url:}")
    private String frontendUrl;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                if (frontendUrl == null || frontendUrl.isBlank()) {
                    return; // sem frontend configurado = sem CORS liberado
                }
                String[] origens = java.util.Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toArray(String[]::new);
                if (origens.length == 0) {
                    return;
                }
                registry.addMapping("/api/**")
                        .allowedOrigins(origens)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("Authorization")
                        .maxAge(3600);
            }
        };
    }
}
