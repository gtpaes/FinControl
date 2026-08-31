package com.fincontrol.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateGoalRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 80, message = "Nome deve ter no máximo 80 caracteres")
        String name,

        @NotNull(message = "Valor objetivo é obrigatório")
        @DecimalMin(value = "0.01", message = "Valor objetivo deve ser maior que zero")
        BigDecimal targetAmount,

        @NotNull(message = "Valor atual é obrigatório")
        @DecimalMin(value = "0.00", message = "Valor atual não pode ser negativo")
        BigDecimal currentAmount,

        @NotNull(message = "Prazo é obrigatório")
        LocalDate deadline,

        @Pattern(regexp = "brand|blue|violet|amber|red|green", message = "Cor inválida")
        String color
) {
}
