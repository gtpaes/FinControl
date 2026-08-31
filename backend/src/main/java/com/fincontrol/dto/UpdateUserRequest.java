package com.fincontrol.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para atualização de perfil do usuário autenticado.
 * Apenas o nome pode ser alterado — e-mail e senha são gerenciados
 * por endpoints específicos (e-mail não é mutável via este DTO).
 */
public record UpdateUserRequest(

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
        String name

) {
}
