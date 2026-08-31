package com.fincontrol.dto;

import com.fincontrol.entity.InvestmentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateInvestmentRequest(
        @NotBlank(message = "Ticker é obrigatório")
        @Size(max = 20, message = "Ticker deve ter no máximo 20 caracteres")
        String ticker,

        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 80, message = "Nome deve ter no máximo 80 caracteres")
        String name,

        @NotNull(message = "Tipo é obrigatório")
        InvestmentType type,

        @NotNull(message = "Quantidade é obrigatória")
        @DecimalMin(value = "0.000001", message = "Quantidade deve ser maior que zero")
        BigDecimal quantity,

        @NotNull(message = "Preço médio é obrigatório")
        @DecimalMin(value = "0.01", message = "Preço médio deve ser maior que zero")
        BigDecimal avgPrice,

        @NotNull(message = "Preço atual é obrigatório")
        @DecimalMin(value = "0.01", message = "Preço atual deve ser maior que zero")
        BigDecimal currentPrice
) {
}
