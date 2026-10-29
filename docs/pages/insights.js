/* FinControl — página Insights. */
import { insights } from '../js/api.js';
import { showToast, escapeHtml } from '../js/utils.js';
import { card, spinner, emptyState } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderInsights(container) {
  container.innerHTML = spinner('A carregar insights...');

  try {
    const [insightList, notifications] = await Promise.all([
      insights.list(),
      insights.notifications()
    ]);

    const insightsHtml = insightList.map(i => `
      <div class="insight-item insight-${i.tipo}">
        <div class="insight-icon">${i.tipo === 'positivo' ? ICONS.check : i.tipo === 'alerta' ? ICONS.alert : ICONS.info}</div>
        <div class="insight-content">
          <h4>${escapeHtml(i.titulo)}</h4>
          <p>${escapeHtml(i.texto)}</p>
        </div>
      </div>
    `).join('');

    const notifHtml = notifications.map(n => `
      <div class="notif-item ${n.lida ? 'lida' : 'nova'}">
        <div class="notif-icon">${n.tipo === 'sucesso' ? ICONS.check : n.tipo === 'alerta' ? ICONS.alert : ICONS.info}</div>
        <div class="notif-content">
          <h4>${escapeHtml(n.titulo)}</h4>
          <p>${escapeHtml(n.texto)}</p>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="page-insights">
        ${card({
          title: 'Insights',
          subtitle: `${insightList.length} insights`,
          body: insightsHtml || emptyState('Nenhum insight disponível.', ICONS.insights)
        })}
        ${card({
          title: 'Notificações',
          subtitle: `${notifications.length} notificações`,
          body: notifHtml || emptyState('Nenhuma notificação.', ICONS.bell)
        })}
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar insights.', ICONS.alert);
  }
}
