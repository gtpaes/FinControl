/* FinControl — página Dashboard. */
import { dashboard } from '../js/api.js';
import { formatCurrency, formatMonth, showToast } from '../js/utils.js';
import { statCard, card, spinner, emptyState, barChart, lineChart } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderDashboard(container) {
  container.innerHTML = spinner('A carregar dashboard...');

  try {
    const [summary, byCategory, evolution] = await Promise.all([
      dashboard.summary(),
      dashboard.expensesByCategory(),
      dashboard.patrimonyEvolution()
    ]);

    var cardsHtml = '<div class="stats-grid">';
    cardsHtml += statCard({ icon: ICONS.coins, label: 'Renda Total', value: formatCurrency(summary.rendaTotal), sub: formatMonth(summary.mes), color: 'green' });
    cardsHtml += statCard({ icon: ICONS.trendDown, label: 'Despesas', value: formatCurrency(summary.despesasMes), sub: formatMonth(summary.mes), color: 'red' });
    cardsHtml += statCard({ icon: ICONS.invest, label: 'Investido', value: formatCurrency(summary.investidoMes), sub: formatMonth(summary.mes), color: 'blue' });
    cardsHtml += statCard({ icon: ICONS.bank, label: 'Patrimônio', value: formatCurrency(summary.patrimonioAtual), sub: summary.variacaoPatrimonial ? (summary.variacaoPatrimonial > 0 ? '+' : '') + formatCurrency(summary.variacaoPatrimonial) : '', color: 'purple' });
    cardsHtml += '</div>';

    var categoryData = byCategory.map(function(c) { return { label: c.category || 'Outros', value: c.value }; });
    var evolutionData = evolution.map(function(e) { return { label: e.label, value: e.value }; });

    var chartsHtml = '<div class="grid-2">';
    chartsHtml += card({ title: 'Despesas por Categoria', body: barChart(categoryData, { height: 220 }) });
    chartsHtml += card({ title: 'Evolução Patrimonial', body: lineChart(evolutionData, { height: 220 }) });
    chartsHtml += '</div>';

    container.innerHTML = '<div>' + cardsHtml + chartsHtml + card({
      title: 'Saldo Disponível',
      subtitle: formatCurrency(summary.saldoDisponivel),
      body: '<p class="text-muted">Receitas menos despesas e aportes acumulados.</p>'
    }) + '</div>';
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar dashboard.', ICONS.alert);
  }
}
