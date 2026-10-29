package com.fincontrol.dto;

/** Uma mensagem anterior da conversa com o assistente (role: "user" ou "assistant"). */
public record ChatTurn(String role, String content) {
}
