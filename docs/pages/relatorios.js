/* FinControl — página Relatórios. */
import { reports } from '../js/api.js';
import { formatCurrency, showToast } from '../js/utils.js';
import { card, spinner, emptyState, barChart } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderRelatorios(container) {
  container.innerHTML = spinner('A carregar relatórios...');

  try {
    const data = await reports.get('mes');

    const receitasData = data.map(d => ({ label: d.label, value: d.receitas }));
    const despesasData = data.map(d => ({ label: d.label, value: d.despesas }));

    container.innerHTML = `
      <div class="page-relatorios">
        ${card({ title: 'Receitas por Período', body: barChart(receitasData, { height: 220 }) })}
        ${card({ title: 'Despesas por Período', body: barChart(despesasData, { height: 220 }) })}
        ${card({
          title: 'Detalhamento Mensal',
          body: `
            <div class="report-summary">
              ${data.map(d => `
                <div class="report-row">
                  <span class="report-month">${d.label}</span>
                  <span class="report-receitas">+${formatCurrency(d.receitas)}</span>
                  <span class="report-despesas">-${formatCurrency(d.despesas)}</span>
                  <span class="report-saldo">${formatCurrency(Number(d.receitas) - Number(d.despesas))}</span>
                </div>
              `).join('')}
            </div>
            ${data.length === 0 ? '<div class="empty-state"><p>Sem dados para exibir.</p></div>' : ''}
          `
        })}
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar relatórios.', ICONS.alert);
  }
}
