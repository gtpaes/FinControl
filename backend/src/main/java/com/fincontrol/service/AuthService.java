package com.fincontrol.service;

import com.fincontrol.dto.AuthResponse;
import com.fincontrol.dto.LoginRequest;
import com.fincontrol.dto.UserResponse;
import com.fincontrol.entity.User;
import com.fincontrol.exception.ResourceNotFoundException;
import com.fincontrol.exception.UnauthorizedException;
import com.fincontrol.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Autenticação: login + geração do JWT.
 *
 * Regra de segurança: TODAS as falhas de login (e-mail inexistente,
 * senha errada, usuário desativado) produzem a MESMA mensagem genérica
 * "E-mail ou senha inválidos" — assim um atacante não descobre quais
 * e-mails estão cadastrados (user enumeration).
 */
@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS = "E-mail ou senha inválidos";

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserService userService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user;
        try {
            user = userService.findEntityByEmail(request.email());
        } catch (ResourceNotFoundException ex) {
            // Não revelamos se o e-mail existe ou não (evita enumeração de contas)
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }
        if (!user.isActive()) {
            throw new UnauthorizedException(INVALID_CREDENTIALS);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthResponse(token, UserResponse.from(user));
    }
}