package com.fincontrol.dto;

/** Notificação derivada de dados reais do usuário. */
public record NotificationResponse(
        String id,
        String titulo,
        String texto,
        String tipo,   // sucesso | alerta | info
        boolean lida
) {
}
