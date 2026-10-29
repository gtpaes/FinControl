package com.fincontrol.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Requisição para o assistente: pergunta atual e o histórico recente da conversa (opcional). */
public record AiAnalyzeRequest(
        @NotBlank @Size(max = 2000) String message,
        @Size(max = 20) List<ChatTurn> history) {
}
