/* FinControl — página Meu Dinheiro (fluxo de caixa consolidado + receitas). */
import { incomes, dashboard } from '../js/api.js';
import { formatCurrency, formatDate, formatMonth, showToast, LABELS, escapeHtml } from '../js/utils.js';
import { statCard, card, table, row, spinner, emptyState, modal, openModal, closeModal, selectEnum } from '../js/components.js';
import { ICONS } from '../js/icons.js';

let currentEditId = null;

export async function renderReceitas(container) {
  container.innerHTML = spinner('A carregar o seu dinheiro...');

  try {
    const [summary, page] = await Promise.all([
      dashboard.summary(),
      incomes.list({ size: 50 })
    ]);
    const items = page.content || [];

    // Ligação lógica: tudo isto vem do back end, somando receitas, despesas e aportes.
    const cardsHtml = '<div class="stats-grid">'
      + statCard({ icon: ICONS.wallet, label: 'Saldo Disponível', value: formatCurrency(summary.saldoDisponivel), sub: 'Acumulado (R − D − Aportes)', color: 'green' })
      + statCard({ icon: ICONS.coins, label: 'Renda do Mês', value: formatCurrency(summary.rendaTotal), sub: formatMonth(summary.mes), color: 'blue' })
      + statCard({ icon: ICONS.trendDown, label: 'Despesas do Mês', value: `-${formatCurrency(summary.despesasMes)}`, sub: formatMonth(summary.mes), color: 'red' })
      + statCard({ icon: ICONS.invest, label: 'Investido no Mês', value: formatCurrency(summary.investidoMes), sub: 'Aportes em investimentos', color: 'purple' })
      + '</div>';

    // Ligações para os módulos que alimentam o teu dinheiro.
    const linksHtml = `
      <div class="money-links">
        <span>O teu dinheiro junta as tuas <strong>Receitas</strong>, <strong>Despesas</strong> e <strong>Investimentos</strong>:</span>
        <div class="money-link-btns">
          <a class="btn btn-ghost btn-sm" data-nav="despesas">${ICONS.expenses} Ver Despesas</a>
          <a class="btn btn-ghost btn-sm" data-nav="investimentos">${ICONS.invest} Ver Investimentos</a>
        </div>
      </div>
    `;

    const actionsHtml = `<button class="btn btn-primary" id="btn-new-receita">+ Nova Receita</button>`;

    const rowsHtml = items.map(i => row([
      escapeHtml(i.description),
      formatCurrency(i.amount),
      formatDate(i.date),
      LABELS.incomeCategory[i.category] || i.category,
      LABELS.recurrence[i.recurrence] || i.recurrence
    ], `
      <button class="btn btn-ghost btn-sm" onclick="window._editReceita('${i.id}')">${ICONS.edit}</button>
      <button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteReceita('${i.id}')">${ICONS.trash}</button>
    `)).join('');

    container.innerHTML = `
      <div class="page-receitas">
        ${cardsHtml}
        ${linksHtml}
        ${card({
          title: 'Receitas',
          subtitle: `${items.length} registos`,
          actions: actionsHtml,
          body: table({
            headers: ['Descrição', 'Valor', 'Data', 'Categoria', 'Recorrência', 'Ações'],
            rows: rowsHtml,
            emptyMsg: 'Nenhuma receita registada.'
          })
        })}
      </div>
    `;

    window._editReceita = (id) => editReceita(id);
    window._deleteReceita = (id) => deleteReceita(id);

    document.getElementById('btn-new-receita').addEventListener('click', () => newReceita());
    // Liga os links de navegação (Despesas / Investimentos).
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.addEventListener('click', () => { location.hash = link.dataset.nav; });
    });

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar o seu dinheiro.', ICONS.alert);
  }
}

function buildFormReceita(item = {}) {
  return `
    <form id="form-receita">
      <div class="form-group">
        <label>Descrição</label>
        <input type="text" name="description" class="form-input" required value="${escapeHtml(item.description || '')}" placeholder="Ex: Salário agosto">
      </div>
      <div class="form-group">
        <label>Valor</label>
        <input type="number" name="amount" class="form-input" required min="0.01" step="0.01" value="${item.amount || ''}" placeholder="0,00">
      </div>
      <div class="form-group">
        <label>Data</label>
        <input type="date" name="date" class="form-input" required value="${item.date || ''}">
      </div>
      <div class="form-group">
        <label>Categoria</label>
        ${selectEnum('category', LABELS.incomeCategory, item.category || '', false)}
      </div>
      <div class="form-group">
        <label>Recorrência</label>
        ${selectEnum('recurrence', LABELS.recurrence, item.recurrence || 'UNICA', false)}
      </div>
      <div class="form-group">
        <label>Notas (opcional)</label>
        <textarea name="notes" class="form-input" rows="2">${escapeHtml(item.notes || '')}</textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${item.id ? 'Atualizar' : 'Guardar'}</button>
    </form>
  `;
}

function openReceitaModal(title, formHtml) {
  document.getElementById('modal-receita')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({
    id: 'modal-receita',
    title,
    content: formHtml,
    footer: '<button class="btn btn-ghost" data-close="modal-receita">Cancelar</button>'
  }));
  openModal('modal-receita');
}

function handleReceitaSubmit(id) {
  document.getElementById('form-receita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    const data = {
      description: fd.get('description'),
      amount: Number(fd.get('amount')),
      date: fd.get('date'),
      category: fd.get('category'),
      recurrence: fd.get('recurrence'),
      notes: fd.get('notes')
    };
    try {
      if (id) {
        await incomes.update(id, data);
        showToast('Receita atualizada!', 'success');
      } else {
        await incomes.create(data);
        showToast('Receita criada!', 'success');
      }
      closeModal('modal-receita');
      document.getElementById('modal-receita').remove();
      renderReceitas(document.getElementById('content'));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) { btn.dataset.submitting = ''; btn.disabled = false; }
    }
  });
}

function newReceita() {
  openReceitaModal('Nova Receita', buildFormReceita());
  handleReceitaSubmit(null);
}

async function editReceita(id) {
  try {
    const item = await incomes.get(id);
    openReceitaModal('Editar Receita', buildFormReceita(item));
    handleReceitaSubmit(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteReceita(id) {
  if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
  try {
    await incomes.delete(id);
    showToast('Receita excluída.', 'success');
    renderReceitas(document.getElementById('content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

