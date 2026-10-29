package com.fincontrol.dto;

/** Resposta do assistente. {@code source}: "claude" ou "local" (modo de regras, sem chave/indisponível). */
public record AiAnalyzeResponse(String reply, String source) {
}
