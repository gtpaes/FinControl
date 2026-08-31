package com.fincontrol.dto;

import java.math.BigDecimal;

/** Resumo da carteira — TUDO derivado de dados reais persistidos. */
public record InvestmentSummaryResponse(
        BigDecimal patrimonioInvestido,   // valor de mercado (Σ qtd × preço atual)
        BigDecimal custoTotal,            // Σ qtd × preço médio
        BigDecimal rentabilidadeTotal,    // % (mercado/custo − 1)
        BigDecimal resultado,             // mercado − custo
        BigDecimal aportesMes             // Σ aportes no mês atual
) {
}
