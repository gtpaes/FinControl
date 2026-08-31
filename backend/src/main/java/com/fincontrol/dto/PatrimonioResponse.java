package com.fincontrol.dto;

import java.math.BigDecimal;
import java.util.List;

public record PatrimonioResponse(
        BigDecimal total,
        BigDecimal investimentos,      // valor de mercado da carteira
        BigDecimal dinheiroDisponivel, // saldo acumulado (receitas − despesas − aportes)
        BigDecimal outrosAtivos,       // 0 — módulo ainda não existe
        BigDecimal dividas,            // 0 — módulo ainda não existe
        BigDecimal liquido,
        List<HistoricoPoint> historico
) {
    public record HistoricoPoint(String mes, BigDecimal ativos, BigDecimal dividas) {
    }
}
