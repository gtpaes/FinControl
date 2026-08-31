package com.fincontrol.dto;

import java.math.BigDecimal;

/**
 * Resumo do dashboard — TODOS os valores derivados de dados reais
 * (incomes, expenses, investments) do usuário autenticado.
 */
public record DashboardSummaryResponse(
        String mes,                    // "2026-08"
        BigDecimal salarioLiquido,     // incomes SALARY do mês
        BigDecimal rendaExtra,         // incomes de outras categorias do mês
        BigDecimal rendaTotal,
        BigDecimal despesasMes,
        BigDecimal despesasMesAnterior,
        BigDecimal investidoMes,       // aportes em investimentos no mês
        BigDecimal metaInvestimento,   // = investidoMes (meta de aporte não é configurável ainda)
        BigDecimal patrimonioAtual,    // carteira a preço de mercado + saldo acumulado
        BigDecimal variacaoPatrimonial, // vs. fim do mês anterior (a custo)
        BigDecimal saldoDisponivel     // acumulado: receitas − despesas − aportes
) {
}
