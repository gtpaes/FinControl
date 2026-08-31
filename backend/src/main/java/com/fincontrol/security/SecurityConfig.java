package com.fincontrol.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fincontrol.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.Instant;

/**
 * Configuração central do Spring Security.
 *
 * DECISÕES IMPORTANTES:
 *
 * 1. CSRF desabilitado: esta é uma API REST STATELESS que autentica via
 *    header Authorization (Bearer JWT), NÃO via cookie de sessão. O ataque
 *    CSRF explora cookies enviados automaticamente pelo browser — sem
 *    cookies de sessão, não há superfície de CSRF. Se um dia usarmos
 *    cookies (ex.: refresh token em cookie), o CSRF deverá ser reativado.
 *
 * 2. Sessão STATELESS: nenhuma sessão HTTP é criada; cada requisição
 *    carrega o próprio JWT.
 *
 * 3. Tudo fechado por padrão: anyRequest().authenticated().
 *    Só são públicos os 3 endpoints explícitos.
 *
 * 4. Erros de segurança retornam o MESMO formato ErrorResponse do
 *    GlobalExceptionHandler (consistência para o frontend).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Endpoints públicos (FASE 1 + FASE 2). */
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/health",
            "/api/auth/register",
            "/api/auth/login"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, ObjectMapper objectMapper) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.objectMapper = objectMapper;
    }

    // ======================== BEANS ========================

    /**
     * BCrypt para hash de senhas.
     * BCrypt embute o "salt" no próprio hash e é lento por design
     * (dificulta ataques de força bruta). NUNCA usar MD5/SHA-256 puro para senha.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    /**
     * Provider que liga o UserDetailsService ao PasswordEncoder.
     * É ele quem faz o matches() da senha no login.
     */
    @Bean
    public AuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService,
                                                          PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    // ================== CADEIA DE FILTROS ==================

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // justificado acima (API stateless + Bearer)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Preflight CORS (OPTIONS) deve SEMPRE passar — o browser
                        // envia OPTIONS sem Authorization e sem ele o frontend quebra.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint())
                        .accessDeniedHandler(forbiddenAccessDeniedHandler()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 401 quando a requisição chega sem autenticação (sem token ou token
     * inválido/expirado). Usa o mesmo formato ErrorResponse do restante da API.
     */
    private AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse body = new ErrorResponse(
                    401,
                    "Unauthorized",
                    "Autenticação necessária ou token inválido",
                    Instant.now(),
                    request.getRequestURI()
            );
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }

    /** 403 - autenticado mas sem permissão (preparação para autorização futura). */
    private AccessDeniedHandler forbiddenAccessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response,
                org.springframework.security.access.AccessDeniedException ex) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse body = new ErrorResponse(
                    403,
                    "Forbidden",
                    "Você não tem permissão para acessar este recurso",
                    Instant.now(),
                    request.getRequestURI()
            );
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }
}