package com.fincontrol.dto;

import java.math.BigDecimal;

/** Ponto da evolução patrimonial (derivada do fluxo real: receitas − despesas). */
public record EvolucaoPoint(String label, BigDecimal valor) {
}
