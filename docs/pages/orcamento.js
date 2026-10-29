/* FinControl — página Orçamento. */
import { budgets } from '../js/api.js';
import { formatCurrency, showToast, LABELS, escapeHtml } from '../js/utils.js';
import { card, table, row, spinner, emptyState, modal, openModal, closeModal, selectEnum } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderOrcamento(container) {
  container.innerHTML = spinner('A carregar orçamentos...');

  try {
    const items = await budgets.list();

    const actionsHtml = `<button class="btn btn-primary" id="btn-new-orcamento">+ Novo Orçamento</button>`;

    const rowsHtml = items.map(i => row([
      LABELS.expenseCategory[i.category] || i.category,
      formatCurrency(i.limitAmount)
    ], `
      <button class="btn btn-ghost btn-sm" onclick="window._editOrcamento('${i.id}')">${ICONS.edit}</button>
      <button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteOrcamento('${i.id}')">${ICONS.trash}</button>
    `)).join('');

    container.innerHTML = `
      ${card({
        title: 'Orçamento por Categoria',
        subtitle: `${items.length} categorias`,
        actions: actionsHtml,
        body: table({
          headers: ['Categoria', 'Limite', 'Ações'],
          rows: rowsHtml,
          emptyMsg: 'Nenhum orçamento definido.'
        })
      })}
    `;

    window._editOrcamento = (id) => editOrcamento(id);
    window._deleteOrcamento = (id) => deleteOrcamento(id);
    document.getElementById('btn-new-orcamento').addEventListener('click', () => newOrcamento());

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar orçamentos.', ICONS.alert);
  }
}

function buildFormOrcamento(item = {}) {
  return `
    <form id="form-orcamento">
      <div class="form-group">
        <label>Categoria</label>
        ${selectEnum('category', LABELS.expenseCategory, item.category || '', false)}
      </div>
      <div class="form-group">
        <label>Limite (R$)</label>
        <input type="number" name="limitAmount" class="form-input" required min="0.01" step="0.01" value="${item.limitAmount || ''}" placeholder="0,00">
      </div>
      <button type="submit" class="btn btn-primary btn-block">${item.id ? 'Atualizar' : 'Guardar'}</button>
    </form>
  `;
}

function openOrcamentoModal(title, formHtml) {
  document.getElementById('modal-orcamento')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({
    id: 'modal-orcamento',
    title,
    content: formHtml,
    footer: '<button class="btn btn-ghost" data-close="modal-orcamento">Cancelar</button>'
  }));
  openModal('modal-orcamento');
}

function handleOrcamentoSubmit(id) {
  document.getElementById('form-orcamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    const data = {
      category: fd.get('category'),
      limitAmount: Number(fd.get('limitAmount'))
    };
    try {
      if (id) {
        await budgets.update(id, data);
        showToast('Orçamento atualizado!', 'success');
      } else {
        await budgets.create(data);
        showToast('Orçamento criado!', 'success');
      }
      closeModal('modal-orcamento');
      document.getElementById('modal-orcamento').remove();
      renderOrcamento(document.getElementById('content'));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) { btn.dataset.submitting = ''; btn.disabled = false; }
    }
  });
}

function newOrcamento() {
  openOrcamentoModal('Novo Orçamento', buildFormOrcamento());
  handleOrcamentoSubmit(null);
}

async function editOrcamento(id) {
  try {
    const items = await budgets.list();
    const item = items.find(i => i.id === id);
    if (!item) throw new Error('Orçamento não encontrado');
    openOrcamentoModal('Editar Orçamento', buildFormOrcamento(item));
    handleOrcamentoSubmit(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteOrcamento(id) {
  if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
  try {
    await budgets.delete(id);
    showToast('Orçamento excluído.', 'success');
    renderOrcamento(document.getElementById('content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}
