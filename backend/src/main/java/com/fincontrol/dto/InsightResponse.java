package com.fincontrol.dto;

/** Insight gerado automaticamente a partir de dados reais. */
public record InsightResponse(
        String tipo,   // positivo | alerta | info
        String titulo,
        String texto
) {
}
