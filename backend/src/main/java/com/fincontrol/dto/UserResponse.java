package com.fincontrol.dto;

import com.fincontrol.entity.User;
import com.fincontrol.entity.UserRole;

import java.util.UUID;

/**
 * Resposta pública do usuário.
 *
 * IMPORTANTE: por construção, este DTO não possui campo de senha —
 * é impossível vazar passwordHash usando-o. Nunca retorne a entidade User direto.
 */
public record UserResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        boolean active
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive()
        );
    }
}