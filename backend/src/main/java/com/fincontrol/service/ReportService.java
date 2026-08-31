package com.fincontrol.service;

import com.fincontrol.dto.ReportPoint;
import com.fincontrol.entity.Expense;
import com.fincontrol.entity.Income;
import com.fincontrol.entity.Investment;
import com.fincontrol.repository.ExpenseRepository;
import com.fincontrol.repository.IncomeRepository;
import com.fincontrol.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Relatórios mensais — agregação REAL de incomes, expenses e aportes
 * do usuário autenticado. Nenhuma collection própria: é consulta.
 */
@Service
public class ReportService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;

    public ReportService(IncomeRepository incomeRepository,
                         ExpenseRepository expenseRepository,
                         InvestmentRepository investmentRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.investmentRepository = investmentRepository;
    }

    public List<ReportPoint> relatorio(UUID userId, String periodo) {
        List<YearMonth> meses = mesesDoPeriodo(periodo);
        LocalDate de = meses.get(0).atDay(1);
        LocalDate ate = meses.get(meses.size() - 1).atEndOfMonth();

        List<Income> incomes = incomeRepository.findByUserId(userId).stream()
                .filter(i -> !i.getDate().isBefore(de) && !i.getDate().isAfter(ate)).toList();
        List<Expense> expenses = expenseRepository.findByUserId(userId).stream()
                .filter(e -> !e.getDate().isBefore(de) && !e.getDate().isAfter(ate)).toList();
        List<BigDecimal> aportes = investmentRepository.findByUserId(userId).stream()
                .flatMap(i -> i.getAportes().stream())
                .filter(a -> a.getDate() != null && !a.getDate().isBefore(de) && !a.getDate().isAfter(ate))
                .map(a -> a.getAmount()).toList();

        List<ReportPoint> pontos = new ArrayList<>();
        if ("ano".equals(periodo)) {
            // agrupa por trimestre do ano
            int ano = YearMonth.now().getYear();
            for (int t = 1; t <= 4; t++) {
                LocalDate inicio = LocalDate.of(ano, t * 3 - 2, 1);
                LocalDate fim = inicio.plusMonths(3).minusDays(1);
                pontos.add(new ReportPoint("T" + t + "/" + ano,
                        somaIncomes(incomes, inicio, fim), somaExpenses(expenses, inicio, fim),
                somaAportes(aportesPorData(investmentRepository.findByUserId(userId), inicio, fim))));
            }
            return pontos;
        }
        for (YearMonth m : meses) {
            LocalDate inicio = m.atDay(1);
            LocalDate fim = m.atEndOfMonth();
            pontos.add(new ReportPoint(mesLabelAno(m),
                    somaIncomes(incomes, inicio, fim), somaExpenses(expenses, inicio, fim),
                    somaAportes(aportesPorData(investmentRepository.findByUserId(userId), inicio, fim))));
        }
        return pontos;
    }

    private List<YearMonth> mesesDoPeriodo(String periodo) {
        YearMonth atual = YearMonth.now();
        int qtd = switch (periodo) {
            case "mes" -> 1;
            case "trimestre" -> 3;
            case "semestre" -> 6;
            default -> 12;
        };
        List<YearMonth> meses = new ArrayList<>();
        for (int i = qtd - 1; i >= 0; i--) meses.add(atual.minusMonths(i));
        return meses;
    }

    private List<BigDecimal> aportesPorData(List<Investment> investments, LocalDate de, LocalDate ate) {
        return investments.stream()
                .flatMap(i -> i.getAportes().stream())
                .filter(a -> a.getDate() != null && !a.getDate().isBefore(de) && !a.getDate().isAfter(ate))
                .map(a -> a.getAmount()).toList();
    }

    private BigDecimal somaIncomes(List<Income> incomes, LocalDate de, LocalDate ate) {
        return incomes.stream().filter(i -> !i.getDate().isBefore(de) && !i.getDate().isAfter(ate))
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal somaExpenses(List<Expense> expenses, LocalDate de, LocalDate ate) {
        return expenses.stream().filter(e -> !e.getDate().isBefore(de) && !e.getDate().isAfter(ate))
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal somaAportes(List<BigDecimal> aportes) {
        return aportes.stream().reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    static String mesLabelAno(YearMonth m) {
        return DashboardService.mesLabel(m) + "/" + m.getYear();
    }
}
