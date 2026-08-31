package com.fincontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Atualização de salário (PUT = substituição completa). Sem userId. */
public record UpdateSalaryRequest(

        @NotNull(message = "Valor é obrigatório")
        @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
        BigDecimal amount,

        @Size(max = 255, message = "Descrição deve ter no máximo 255 caracteres")
        String description,

        @NotNull(message = "Mês de referência é obrigatório")
        @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$",
                message = "Mês de referência deve estar no formato AAAAMM (ex.: 2026-08)")
        String referenceMonth
) {
}