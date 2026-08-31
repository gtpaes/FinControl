package com.fincontrol.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Responsável ÚNICO por criar e validar tokens JWT.
 *
 * - O segredo vem SEMPRE da variável de ambiente JWT_SECRET (nunca hard-coded);
 *   precisa ter pelo menos 32 bytes (256 bits) para HS256.
 * - O payload contém SOMENTE o necessário para autenticar/autorizar:
 *   sub (id do usuário), email, role, iat, exp.
 * - NUNCA colocamos senha, hash ou dados financeiros no token:
 *   JWT é apenas assinado, não criptografado — qualquer um pode decodificá-lo.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final Duration expiration;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.expiration:PT1H}") String expirationConfig
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET não configurada. Defina a variável de ambiente JWT_SECRET (mínimo 32 caracteres).");
        }
        byte[] secretBytes = secret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET muito curta. Use pelo menos 32 caracteres (256 bits) para o algoritmo HS256.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.expiration = parseDuration(expirationConfig);
    }

    /** Aceita ISO-8601 (ex.: PT1H = 1 hora) ou milissegundos (ex.: 3600000). */
    private Duration parseDuration(String value) {
        if (value.matches("\\d+")) {
            return Duration.ofMillis(Long.parseLong(value));
        }
        return Duration.parse(value);
    }

    /**
     * Gera o token de acesso.
     * Claims mantidos ao mínimo necessário para autenticação/autorização.
     */
    public String generateToken(UUID userId, String email, com.fincontrol.entity.UserRole role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())          // sub = id do usuário
                .claim("email", email)               // e-mail (não é segredo; é a identidade)
                .claim("role", role.name())          // role para autorização futura
                .issuedAt(Date.from(now))            // iat
                .expiration(Date.from(now.plus(expiration))) // exp
                .signWith(signingKey)
                .compact();
    }

    /**
     * Valida assinatura e expiração. Lança JwtException se inválido/expirado
     * (o filtro de autenticação trata isso devolvendo 401).
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extrai o id do usuário do claim "sub". */
    public UUID extractUserId(String token) throws JwtException {
        return UUID.fromString(parseToken(token).getSubject());
    }
}