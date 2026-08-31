package com.fincontrol.service;

import com.fincontrol.dto.InvestmentSummaryResponse;
import com.fincontrol.entity.Investment;
import com.fincontrol.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Resumo da carteira — valores derivados de dados reais persistidos. */
@Service
public class InvestmentSummaryService {

    private final InvestmentRepository investmentRepository;

    public InvestmentSummaryService(InvestmentRepository investmentRepository) {
        this.investmentRepository = investmentRepository;
    }

    public InvestmentSummaryResponse summary(UUID userId) {
        List<Investment> investments = investmentRepository.findByUserId(userId);
        YearMonth mes = YearMonth.now();

        BigDecimal valorMercado = investments.stream()
                .map(i -> i.getQuantity().multiply(i.getCurrentPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custo = investments.stream()
                .map(i -> i.getQuantity().multiply(i.getAvgPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal aportesMes = investments.stream()
                .flatMap(i -> i.getAportes().stream())
                .filter(a -> a.getDate() != null && YearMonth.from(a.getDate()).equals(mes))
                .map(a -> a.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal resultado = valorMercado.subtract(custo);
        BigDecimal rentabilidade = custo.compareTo(BigDecimal.ZERO) > 0
                ? resultado.multiply(new BigDecimal("100")).divide(custo, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new InvestmentSummaryResponse(
                valorMercado.setScale(2, RoundingMode.HALF_UP),
                custo.setScale(2, RoundingMode.HALF_UP),
                rentabilidade.setScale(2, RoundingMode.HALF_UP),
                resultado.setScale(2, RoundingMode.HALF_UP),
                aportesMes.setScale(2, RoundingMode.HALF_UP)
        );
    }
}
