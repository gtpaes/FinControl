package com.fincontrol.dto;

/**
 * Resposta do login: token JWT + dados públicos do usuário.
 * O token vai no corpo (padrão comum em APIs REST stateless).
 */
public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
    public AuthResponse(String token, UserResponse user) {
        this(token, "Bearer", user);
    }
}