package com.fincontrol.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro executado UMA vez por requisição, ANTES do processamento dos controllers.
 *
 * Fluxo:
 * 1. Extrai o header "Authorization: Bearer <token>" (se existir);
 * 2. Valida o JWT (assinatura + expiração);
 * 3. Carrega o usuário do banco pelo id do token;
 * 4. Coloca a autenticação no SecurityContext.
 *
 * Se o token estiver ausente/inválido/expirado, o filtro NÃO interrompe a
 * requisição — apenas deixa o SecurityContext vazio. Assim, rotas públicas
 * continuam funcionando e rotas protegidas caem no AuthenticationEntryPoint (401).
 *
 * Nunca logamos o token completo.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                UUID userId = jwtService.extractUserId(token);
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails principal = userDetailsService.loadUserById(userId);
                    if (principal != null && principal.isEnabled()) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (JwtException | IllegalArgumentException ex) {
                // Token inválido ou expirado: segue sem autenticar.
                // NÃO logamos o token; registramos apenas o tipo do erro.
                log.debug("JWT rejeitado na requisição {}: {}", request.getRequestURI(), ex.getClass().getSimpleName());
            }
        }

        filterChain.doFilter(request, response);
    }
}