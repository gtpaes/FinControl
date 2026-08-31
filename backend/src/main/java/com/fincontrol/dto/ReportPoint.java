package com.fincontrol.dto;

import java.math.BigDecimal;

/** Ponto de relatório mensal — agregação real de incomes/expenses/aportes. */
public record ReportPoint(String label, BigDecimal receitas, BigDecimal despesas, BigDecimal aportes) {
}
