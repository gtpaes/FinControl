package com.fincontrol.service;

import com.fincontrol.dto.EvolucaoPoint;
import com.fincontrol.dto.PatrimonioResponse;
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
 * Patrimônio: NÃO tem collection própria — é derivado de dados reais.
 * - investimentos = valor de mercado da carteira;
 * - dinheiroDisponivel = Σ receitas − Σ despesas − Σ aportes;
 * - outrosAtivos/dividas = 0 (módulos de contas/dívidas ainda não existem);
 * - liquido = ativos − passivos.
 */
@Service
public class PatrimonioService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;

    public PatrimonioService(IncomeRepository incomeRepository,
                             ExpenseRepository expenseRepository,
                             InvestmentRepository investmentRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.investmentRepository = investmentRepository;
    }

    public PatrimonioResponse patrimonio(UUID userId) {
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Investment> investments = investmentRepository.findByUserId(userId);

        BigDecimal investimentos = investments.stream()
                .map(i -> i.getQuantity().multiply(i.getCurrentPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal dinheiro = incomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .subtract(expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .subtract(investments.stream().flatMap(i -> i.getAportes().stream())
                        .map(a -> a.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal ativos = investimentos.add(dinheiro);

        List<PatrimonioResponse.HistoricoPoint> historico = new ArrayList<>();
        for (int i = 7; i >= 0; i--) {
            YearMonth m = YearMonth.now().minusMonths(i);
            BigDecimal ativosMes = acumuladoAte(incomes, expenses, m.atEndOfMonth());
            historico.add(new PatrimonioResponse.HistoricoPoint(
                    DashboardService.mesLabel(m),
                    ativosMes.setScale(2, RoundingMode.HALF_UP), BigDecimal.ZERO));
        }

        return new PatrimonioResponse(ativos, investimentos, dinheiro,
                BigDecimal.ZERO, BigDecimal.ZERO,
                ativos.subtract(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP), historico);
    }

    public List<EvolucaoPoint> evolucao(UUID userId, String periodo) {
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        return switch (periodo) {
            case "1a" -> evolucaoMensal(incomes, expenses, 12);
            case "5a" -> evolucaoAnual(incomes, expenses, 5);
            case "max" -> evolucaoAnual(incomes, expenses, 0);
            default -> evolucaoMensal(incomes, expenses, 6);
        };
    }

    private BigDecimal acumuladoAte(List<Income> incomes, List<Expense> expenses, LocalDate fim) {
        return incomes.stream().filter(i -> !i.getDate().isAfter(fim))
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .subtract(expenses.stream().filter(e -> !e.getDate().isAfter(fim))
                        .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private List<EvolucaoPoint> evolucaoMensal(List<Income> incomes, List<Expense> expenses, int meses) {
        YearMonth fim = YearMonth.now();
        YearMonth inicio = fim.minusMonths(meses - 1L);
        List<EvolucaoPoint> pontos = new ArrayList<>();
        BigDecimal acumulado = acumuladoAte(incomes, expenses, inicio.minusMonths(1).atEndOfMonth());
        for (YearMonth m = inicio; !m.isAfter(fim); m = m.plusMonths(1)) { final YearMonth mes = m;
            acumulado = acumulado
                    .add(incomes.stream().filter(i -> YearMonth.from(i.getDate()).equals(mes))
                            .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                    .subtract(expenses.stream().filter(e -> YearMonth.from(e.getDate()).equals(mes))
                            .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            pontos.add(new EvolucaoPoint(DashboardService.mesLabel(mes), acumulado.setScale(2, RoundingMode.HALF_UP)));
        }
        return pontos;
    }

    private List<EvolucaoPoint> evolucaoAnual(List<Income> incomes, List<Expense> expenses, int anos) {
        int anoAtual = LocalDate.now().getYear();
        int inicio = anos <= 0 ? incomes.stream().mapToInt(i -> i.getDate().getYear()).min().orElse(anoAtual)
                : anoAtual - anos + 1;
        List<EvolucaoPoint> pontos = new ArrayList<>();
        for (int ano = inicio; ano <= anoAtual; ano++) {
            pontos.add(new EvolucaoPoint(String.valueOf(ano),
                    acumuladoAte(incomes, expenses, LocalDate.of(ano, 12, 31)).setScale(2, RoundingMode.HALF_UP)));
        }
        return pontos;
    }
}
