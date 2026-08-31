package com.fincontrol.service;

import com.fincontrol.dto.InsightResponse;
import com.fincontrol.dto.NotificationResponse;
import com.fincontrol.entity.Expense;
import com.fincontrol.entity.ExpenseCategory;
import com.fincontrol.entity.Goal;
import com.fincontrol.entity.Income;
import com.fincontrol.entity.Investment;
import com.fincontrol.repository.BudgetRepository;
import com.fincontrol.repository.ExpenseRepository;
import com.fincontrol.repository.GoalRepository;
import com.fincontrol.repository.IncomeRepository;
import com.fincontrol.repository.InvestmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Insights, notificacoes e assistente — TODOS derivados de dados reais
 * persistidos no MongoDB. Nenhum valor ficticio.
 */
@Service
public class InsightsService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final InvestmentRepository investmentRepository;
    private final GoalRepository goalRepository;
    private final BudgetRepository budgetRepository;
    private final InvestmentSummaryService investmentSummaryService;

    public InsightsService(IncomeRepository incomeRepository,
                           ExpenseRepository expenseRepository,
                           InvestmentRepository investmentRepository,
                           GoalRepository goalRepository,
                           BudgetRepository budgetRepository,
                           InvestmentSummaryService investmentSummaryService) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.investmentRepository = investmentRepository;
        this.goalRepository = goalRepository;
        this.budgetRepository = budgetRepository;
        this.investmentSummaryService = investmentSummaryService;
    }

    public List<InsightResponse> insights(UUID userId) {
        List<InsightResponse> out = new ArrayList<>();
        YearMonth mes = YearMonth.now();
        YearMonth anterior = mes.minusMonths(1);

        BigDecimal rendaDoMes = somaIncomes(userId, mes);
        BigDecimal investidoDoMes = sumAportes(userId, mes);

        if (rendaDoMes.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal taxa = investidoDoMes.multiply(new BigDecimal("100"))
                    .divide(rendaDoMes, 1, RoundingMode.HALF_UP);
            out.add(new InsightResponse("positivo",
                    "Taxa de investimento em " + taxa + "%",
                    "Voce investiu " + taxa + "% da sua renda este mes (" + brl(investidoDoMes)
                            + " de " + brl(rendaDoMes) + ")."));
        }

        BigDecimal gastoAlimentacao = somaPorCategoria(userId, mes, ExpenseCategory.FOOD);
        BigDecimal gastoAlimentacaoAnterior = somaPorCategoria(userId, anterior, ExpenseCategory.FOOD);
        if (gastoAlimentacaoAnterior.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal variacao = gastoAlimentacao.subtract(gastoAlimentacaoAnterior)
                    .multiply(new BigDecimal("100")).divide(gastoAlimentacaoAnterior, 1, RoundingMode.HALF_UP);
            if (variacao.compareTo(BigDecimal.ZERO) > 0) {
                out.add(new InsightResponse("alerta", "Alimentacao em alta",
                        "Suas despesas com alimentacao aumentaram " + variacao + "% em relacao ao mes anterior ("
                                + brl(gastoAlimentacao) + ")."));
            }
        }

        List<Expense> despesasMes = despesasDoMes(userId, mes);
        budgetRepository.findAllByUserId(userId).forEach(b -> {
            BigDecimal gasto = despesasMes.stream()
                    .filter(e -> e.getCategory() == b.getCategory())
                    .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (b.getLimitAmount().compareTo(BigDecimal.ZERO) > 0 && gasto.compareTo(b.getLimitAmount()) > 0) {
                out.add(new InsightResponse("alerta", "Orcamento excedido",
                        "A categoria " + DashboardService.labelCategoria(b.getCategory())
                                + " ultrapassou o limite mensal em " + brl(gasto.subtract(b.getLimitAmount())) + "."));
            }
        });

        LocalDate hoje = LocalDate.now();
        goalRepository.findAllByUserId(userId).forEach(g -> {
            if (g.getDeadline() != null && !g.getDeadline().isBefore(hoje)
                    && g.getDeadline().isBefore(hoje.plusMonths(6))) {
                long mesesRestantes = anoMesDiff(hoje, g.getDeadline());
                out.add(new InsightResponse("info", "Meta com prazo proximo",
                        "A meta \"" + g.getName() + "\" esta a " + mesesRestantes + " meses do prazo."));
            }
        });

        return out;
    }

    public List<NotificationResponse> notifications(UUID userId) {
        List<NotificationResponse> out = new ArrayList<>();
        YearMonth mes = YearMonth.now();
        com.fincontrol.dto.InvestmentSummaryResponse resumo = investmentSummaryService.summary(userId);
        if (resumo.aportesMes().compareTo(BigDecimal.ZERO) > 0) {
            out.add(new NotificationResponse(nid("meta-inv"),
                    "Aporte registrado", "Voce investiu " + brl(resumo.aportesMes()) + " neste mes.",
                    "sucesso", true));
        }
        List<Goal> metas = goalRepository.findAllByUserId(userId);
        metas.stream().filter(g -> g.getCurrentAmount().compareTo(g.getTargetAmount()) >= 0)
                .forEach(g -> out.add(new NotificationResponse(nid("meta-atingida-" + g.getAppId()),
                        "Meta atingida", "Voce atingiu a meta \"" + g.getName() + "\".", "sucesso", true)));
        metas.stream().filter(g -> g.getDeadline() != null && g.getDeadline().isBefore(LocalDate.now().plusMonths(3)))
                .forEach(g -> out.add(new NotificationResponse(nid("meta-prazo-" + g.getAppId()),
                        "Meta proxima do prazo", "A meta \"" + g.getName() + "\" vence em breve.", "info", true)));
        return out;
    }

    public String analyze(UUID userId, String message) {
        String m = message == null ? "" : message.toLowerCase(Locale.ROOT);
        YearMonth mes = YearMonth.now();
        BigDecimal renda = somaIncomes(userId, mes);
        BigDecimal despesas = somaDespesas(userId, mes);
        BigDecimal investido = sumAportes(userId, mes);
        com.fincontrol.dto.InvestmentSummaryResponse resumo = investmentSummaryService.summary(userId);
        long metasAtivas = goalRepository.findAllByUserId(userId).size();

        if (m.contains("despesa")) {
            return "Suas despesas do mes somam " + brl(despesas) + " de uma receita de " + brl(renda) + "."
                    + " As maiores categorias, em ordem, sao: " + resumoCategorias(userId, mes) + ".";
        }
        if (m.contains("invest")) {
            return "Sua carteira esta avaliada em " + brl(resumo.patrimonioInvestido())
                    + " (custo de " + brl(resumo.custoTotal()) + ", resultado de " + brl(resumo.resultado())
                    + ", rentabilidade de " + resumo.rentabilidadeTotal() + "%). "
                    + "No mes voce aportou " + brl(investido) + ".";
        }
        if (m.contains("patrim")) {
            return "Seu patrimonio investido esta em " + brl(resumo.patrimonioInvestido())
                    + " e seu patrimonio investido a custo e de " + brl(resumo.custoTotal()) + ".";
        }
        if (m.contains("meta")) {
            return "Voce possui " + metasAtivas + " meta(s) cadastrada(s). Acompanhe o progresso na pagina Metas.";
        }
        if (m.contains("proje") || m.contains("futuro") || m.contains("simul")) {
            return "As projecoes podem ser feitas no modulo Simulador, com base na sua taxa de aporte atual ("
                    + brl(investido) + "/mes). Rentabilidade futura nao e garantida.";
        }
        return "No mes atual, sua receita e de " + brl(renda) + ", suas despesas totalizam " + brl(despesas)
                + " e voce investiu " + brl(investido) + ". Sua carteira esta avaliada em "
                + brl(resumo.patrimonioInvestido()) + ".";
    }

    private String resumoCategorias(UUID userId, YearMonth mes) {
        Map<ExpenseCategory, BigDecimal> soma = new java.util.HashMap<>();
        despesasDoMes(userId, mes).forEach(e -> soma.merge(e.getCategory(), e.getAmount(), BigDecimal::add));
        List<Map.Entry<ExpenseCategory, BigDecimal>> top =
                soma.entrySet().stream().sorted((a, b) -> b.getValue().compareTo(a.getValue())).limit(3).toList();
        return top.stream().map(e -> DashboardService.labelCategoria(e.getKey()) + " (" + brl(e.getValue()) + ")")
                .reduce((a, b) -> a + ", " + b).orElse("nenhuma despesa no periodo");
    }

    private BigDecimal somaIncomes(UUID userId, YearMonth mes) {
        return incomeRepository.findByUserId(userId).stream()
                .filter(i -> YearMonth.from(i.getDate()).equals(mes))
                .map(Income::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal somaDespesas(UUID userId, YearMonth mes) {
        return despesasDoMes(userId, mes).stream()
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal somaPorCategoria(UUID userId, YearMonth mes, ExpenseCategory categoria) {
        return despesasDoMes(userId, mes).stream()
                .filter(e -> e.getCategory() == categoria)
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private java.util.List<Expense> despesasDoMes(UUID userId, YearMonth mes) {
        return expenseRepository.findByUserId(userId).stream()
                .filter(e -> YearMonth.from(e.getDate()).equals(mes)).toList();
    }

    private BigDecimal sumAportes(UUID userId, YearMonth mes) {
        return investmentRepository.findByUserId(userId).stream()
                .flatMap(i -> i.getAportes().stream())
                .filter(a -> a.getDate() != null && YearMonth.from(a.getDate()).equals(mes))
                .map(a -> a.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long anoMesDiff(LocalDate de, LocalDate ate) {
        return ChronoUnit.MONTHS.between(YearMonth.from(de), YearMonth.from(ate));
    }

    private static int seq = 0;
    private String nid(String prefixo) {
        return prefixo + "-" + (++seq);
    }

    private static String brl(BigDecimal v) {
        return "R$ " + String.format(Locale.ROOT, "%,.2f", v).replace(",", "X").replace(".", ",").replace("X", ".");
    }
}
