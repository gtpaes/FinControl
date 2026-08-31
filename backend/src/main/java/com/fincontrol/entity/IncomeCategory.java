package com.fincontrol.entity;

/**
 * Categorias de receita (Income). O frontend envia uma das opções via enum
 * (Bean Validation @NotNull) — NUNCA um valor arbitrário.
 */
public enum IncomeCategory {
    SALARY,
    SALES,
    SERVICES,
    INVESTMENTS,
    OTHER
}