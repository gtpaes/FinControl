package com.fincontrol.service;

import com.fincontrol.dto.CategoryPoint;
import com.fincontrol.dto.DashboardSummaryResponse;
import com.fincontrol.dto.EvolucaoPoint;
import com.fincontrol.entity.Expense;
import com.fincontrol.entity.ExpenseCategory;
import com.fincontrol.entity.Income;
import com.fincontrol.entity.IncomeCategory;
import com.fincontrol.entity.Investment;
import com.fincontrol.entity.Aporte;
import com.fincontrol.repository.ExpenseRepository;
import com.fincontrol.repository.IncomeRepository;
import com.fincontrol.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Agregações do dashboard. NENHUM valor é mockado: tudo é derivado de
 * incomes, expenses e investments do usuário autenticado.
 *
 * Regras (documentadas, sem invenção de negócio):
 * - Saldo acumulado (dinheiro) = Σ receitas − Σ despesas − Σ aportes.
 * - Patrimônio atual = carteira a preço de mercado + saldo acumulado.
 * - Evolução patrimonial = acumulado (receitas − despesas) mês a mês
 *   (a custo — não há histórico de preços de mercado).
 */
@Service
public class DashboardService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;

    public DashboardService(IncomeRepository incomeRepository,
                            ExpenseRepository expenseRepository,
                            InvestmentRepository investmentRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.investmentRepository = investmentRepository;
    }

    public DashboardSummaryResponse summary(UUID userId) {
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        List<Investment> investments = investmentRepository.findByUserId(userId);

        YearMonth mes = YearMonth.now();
        YearMonth mesAnterior = mes.minusMonths(1);

        BigDecimal salarioLiquido = sumIncomes(incomes, mes, IncomeCategory.SALARY);
        BigDecimal rendaTotal = sumIncomes(incomes, mes, null);
        BigDecimal rendaExtra = rendaTotal.subtract(salarioLiquido);
        BigDecimal despesasMes = sumExpenses(expenses, mes, null);
        BigDecimal despesasMesAnterior = sumExpenses(expenses, mesAnterior, null);
        BigDecimal investidoMes = sumAportes(investments, mes);

        BigDecimal saldoAcumulado = totalIncomes(incomes).subtract(totalExpenses(expenses))
                .subtract(totalAportes(investments));
        BigDecimal valorCarteira = valorMercadoCarteira(investments);
        BigDecimal patrimonioAtual = valorCarteira.add(saldoAcumulado);

        LocalDate fimMesAnterior = mesAnterior.atEndOfMonth();
        // Mesma fórmula do mês atual: rendas - despesas - aportes até o fim do mês anterior.
        // (O valor de mercado histórico da carteira não é rastreável; usamos o custo dos aportes.)
        BigDecimal patrimonioMesAnterior = incomes.stream()
                .filter(i -> !i.getDate().isAfter(fimMesAnterior))
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .subtract(expenses.stream()
                        .filter(e -> !e.getDate().isAfter(fimMesAnterior))
                        .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .subtract(investments.stream()
                        .flatMap(inv -> inv.getAportes() == null ? java.util.stream.Stream.<Aporte>empty() : inv.getAportes().stream())
                        .filter(a -> a.getDate() != null && !a.getDate().isAfter(fimMesAnterior))
                        .map(Aporte::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));

        return new DashboardSummaryResponse(
                mes.toString(),
                salarioLiquido.setScale(2, RoundingMode.HALF_UP),
                rendaExtra.setScale(2, RoundingMode.HALF_UP),
                rendaTotal.setScale(2, RoundingMode.HALF_UP),
                despesasMes.setScale(2, RoundingMode.HALF_UP),
                despesasMesAnterior.setScale(2, RoundingMode.HALF_UP),
                investidoMes.setScale(2, RoundingMode.HALF_UP),
                investidoMes.setScale(2, RoundingMode.HALF_UP),
                patrimonioAtual.setScale(2, RoundingMode.HALF_UP),
                patrimonioAtual.subtract(patrimonioMesAnterior).setScale(2, RoundingMode.HALF_UP),
                saldoAcumulado.setScale(2, RoundingMode.HALF_UP)
        );
    }

    /** Despesas do mês atual agrupadas por categoria (rótulos pt-BR). */
    public List<CategoryPoint> despesasPorCategoria(UUID userId) {
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        YearMonth mes = YearMonth.now();
        Map<ExpenseCategory, BigDecimal> soma = new LinkedHashMap<>();
        for (Expense e : expenses) {
            if (YearMonth.from(e.getDate()).equals(mes)) {
                soma.merge(e.getCategory(), e.getAmount(), BigDecimal::add);
            }
        }
        return soma.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .map(en -> new CategoryPoint(labelCategoria(en.getKey()),
                        en.getValue().setScale(2, RoundingMode.HALF_UP)))
                .toList();
    }

    /** Evolução patrimonial derivada: acumulado (receitas − despesas). */
    public List<EvolucaoPoint> evolucaoPatrimonial(UUID userId, String periodo) {
        List<Income> incomes = incomeRepository.findByUserId(userId);
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        return switch (periodo) {
            case "6m" -> evolucaoMensal(incomes, expenses, 6);
            case "1a" -> evolucaoMensal(incomes, expenses, 12);
            case "5a" -> evolucaoAnual(incomes, expenses, 5);
            case "max" -> evolucaoAnual(incomes, expenses, 0);
            default -> evolucaoMensal(incomes, expenses, 6);
        };
    }

    // ===== helpers =====

    private List<EvolucaoPoint> evolucaoMensal(List<Income> incomes, List<Expense> expenses, int meses) {
        YearMonth fim = YearMonth.now();
        YearMonth inicio = fim.minusMonths(meses - 1L);
        List<EvolucaoPoint> pontos = new ArrayList<>();
        BigDecimal acumulado = acumuladoAte(incomes, expenses, inicio.minusMonths(1).atEndOfMonth());
        for (YearMonth m = inicio; !m.isAfter(fim); m = m.plusMonths(1)) {
            acumulado = acumulado
                    .add(sumIncomes(incomes, m, null))
                    .subtract(sumExpenses(expenses, m, null));
            pontos.add(new EvolucaoPoint(mesLabel(m), acumulado.setScale(2, RoundingMode.HALF_UP)));
        }
        return pontos;
    }

    private List<EvolucaoPoint> evolucaoAnual(List<Income> incomes, List<Expense> expenses, int anos) {
        int anoAtual = LocalDate.now().getYear();
        int inicio = anos <= 0 ? incomes.stream().mapToInt(i -> i.getDate().getYear()).min().orElse(anoAtual)
                : anoAtual - anos + 1;
        List<EvolucaoPoint> pontos = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;
        for (int ano = inicio; ano <= anoAtual; ano++) {
            LocalDate fim = LocalDate.of(ano, 12, 31);
            acumulado = incomes.stream().filter(i -> !i.getDate().isAfter(fim))
                    .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                    .subtract(expenses.stream().filter(e -> !e.getDate().isAfter(fim))
                            .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            pontos.add(new EvolucaoPoint(String.valueOf(ano), acumulado.setScale(2, RoundingMode.HALF_UP)));
        }
        return pontos;
    }

    private BigDecimal acumuladoAte(List<Income> incomes, List<Expense> expenses, LocalDate fim) {
        return incomes.stream().filter(i -> !i.getDate().isAfter(fim))
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)
                .subtract(expenses.stream().filter(e -> !e.getDate().isAfter(fim))
                        .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal sumIncomes(List<Income> incomes, YearMonth mes, IncomeCategory categoria) {
        return incomes.stream()
                .filter(i -> YearMonth.from(i.getDate()).equals(mes))
                .filter(i -> categoria == null || i.getCategory() == categoria)
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumExpenses(List<Expense> expenses, YearMonth mes, ExpenseCategory categoria) {
        return expenses.stream()
                .filter(e -> YearMonth.from(e.getDate()).equals(mes))
                .filter(e -> categoria == null || e.getCategory() == categoria)
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal totalIncomes(List<Income> incomes) {
        return incomes.stream().map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal totalExpenses(List<Expense> expenses) {
        return expenses.stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal totalAportes(List<Investment> investments) {
        return investments.stream()
                .flatMap(i -> i.getAportes().stream())
                .map(a -> a.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumAportes(List<Investment> investments, YearMonth mes) {
        return investments.stream()
                .flatMap(i -> i.getAportes().stream())
                .filter(a -> a.getDate() != null && YearMonth.from(a.getDate()).equals(mes))
                .map(a -> a.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Valor de mercado da carteira: Σ (quantidade × preço atual). */
    private BigDecimal valorMercadoCarteira(List<Investment> investments) {
        return investments.stream()
                .map(i -> i.getQuantity().multiply(i.getCurrentPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    static String labelCategoria(ExpenseCategory categoria) {
        return switch (categoria) {
            case HOUSING -> "Moradia";
            case FOOD -> "Alimentação";
            case TRANSPORT -> "Transporte";
            case HEALTH -> "Saúde";
            case EDUCATION -> "Educação";
            case LEISURE -> "Lazer";
            case SHOPPING -> "Compras";
            case BILLS -> "Contas";
            case OTHER -> "Outros";
        };
    }

    static String mesLabel(YearMonth m) {
        String[] meses = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};
        return meses[m.getMonthValue() - 1];
    }
}
