/* FinControl — página Patrimônio. */
import { patrimony } from '../js/api.js';
import { formatCurrency, showToast } from '../js/utils.js';
import { card, spinner, emptyState, statCard, lineChart } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderPatrimonio(container) {
  container.innerHTML = spinner('A carregar patrimônio...');

  try {
    const [data, evolution] = await Promise.all([
      patrimony.get(),
      patrimony.evolution()
    ]);

    const evoData = evolution.map(e => ({ label: e.label, value: e.value }));

    container.innerHTML = `
      <div class="page-patrimonio">
        <div class="stats-grid">
          ${statCard({ icon: ICONS.coins, label: 'Património Total', value: formatCurrency(data.total), color: 'green' })}
          ${statCard({ icon: ICONS.invest, label: 'Investimentos', value: formatCurrency(data.investimentos), color: 'blue' })}
          ${statCard({ icon: ICONS.wallet, label: 'Dinheiro Disponível', value: formatCurrency(data.dinheiroDisponivel), color: 'purple' })}
          ${statCard({ icon: ICONS.bank, label: 'Líquido', value: formatCurrency(data.liquido), color: 'teal' })}
        </div>
        ${card({ title: 'Evolução Patrimonial', body: lineChart(evoData, { height: 250 }) })}
        ${card({
          title: 'Composição',
          body: `
            <div class="patrimonio-composicao">
              <div class="comp-item"><span class="comp-label">Investimentos</span><span class="comp-value">${formatCurrency(data.investimentos)}</span></div>
              <div class="comp-item"><span class="comp-label">Dinheiro Disponível</span><span class="comp-value">${formatCurrency(data.dinheiroDisponivel)}</span></div>
              <div class="comp-item"><span class="comp-label">Outros Ativos</span><span class="comp-value">${formatCurrency(data.outrosAtivos)}</span></div>
              <div class="comp-item comp-divida"><span class="comp-label">Dívidas</span><span class="comp-value">-${formatCurrency(data.dividas)}</span></div>
              <div class="comp-item comp-total"><span class="comp-label">Líquido</span><span class="comp-value">${formatCurrency(data.liquido)}</span></div>
            </div>
          `
        })}
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar patrimônio.', ICONS.alert);
  }
}
