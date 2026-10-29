/* FinControl — página Despesas. */
import { expenses } from '../js/api.js';
import { formatCurrency, formatDate, showToast, LABELS, escapeHtml } from '../js/utils.js';
import { card, table, row, spinner, emptyState, modal, openModal, closeModal, selectEnum } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderDespesas(container) {
  container.innerHTML = spinner('A carregar despesas...');

  try {
    const page = await expenses.list({ size: 50 });
    const items = page.content || [];

    const actionsHtml = `<button class="btn btn-primary" id="btn-new-despesa">+ Nova Despesa</button>`;

    const rowsHtml = items.map(i => row([
      escapeHtml(i.description),
      formatCurrency(i.amount),
      formatDate(i.date),
      LABELS.expenseCategory[i.category] || i.category,
      LABELS.expenseType[i.type] || i.type,
      i.status === 'PAGA' ? '<span class="badge badge-success">Paga</span>' : '<span class="badge badge-warning">Pendente</span>'
    ], `
      <button class="btn btn-ghost btn-sm" onclick="window._editDespesa('${i.id}')">${ICONS.edit}</button>
      <button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteDespesa('${i.id}')">${ICONS.trash}</button>
    `)).join('');

    container.innerHTML = `
      ${card({
        title: 'Despesas',
        subtitle: `${items.length} registos`,
        actions: actionsHtml,
        body: table({
          headers: ['Descrição', 'Valor', 'Data', 'Categoria', 'Tipo', 'Status', 'Ações'],
          rows: rowsHtml,
          emptyMsg: 'Nenhuma despesa registada.'
        })
      })}
    `;

    window._editDespesa = (id) => editDespesa(id);
    window._deleteDespesa = (id) => deleteDespesa(id);
    document.getElementById('btn-new-despesa').addEventListener('click', () => newDespesa());

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar despesas.', ICONS.alert);
  }
}

function buildFormDespesa(item = {}) {
  return `
    <form id="form-despesa">
      <div class="form-group">
        <label>Descrição</label>
        <input type="text" name="description" class="form-input" required value="${escapeHtml(item.description || '')}" placeholder="Ex: Conta de luz">
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
        ${selectEnum('category', LABELS.expenseCategory, item.category || '', false)}
      </div>
      <div class="form-group">
        <label>Tipo</label>
        ${selectEnum('type', LABELS.expenseType, item.type || 'VARIAVEL', false)}
      </div>
      <div class="form-group">
        <label>Status</label>
        ${selectEnum('status', LABELS.expenseStatus, item.status || 'PENDENTE', false)}
      </div>
      <div class="form-group">
        <label>Notas (opcional)</label>
        <textarea name="notes" class="form-input" rows="2">${escapeHtml(item.notes || '')}</textarea>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${item.id ? 'Atualizar' : 'Guardar'}</button>
    </form>
  `;
}

function openDespesaModal(title, formHtml) {
  document.getElementById('modal-despesa')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({
    id: 'modal-despesa',
    title,
    content: formHtml,
    footer: '<button class="btn btn-ghost" data-close="modal-despesa">Cancelar</button>'
  }));
  openModal('modal-despesa');
}

function handleDespesaSubmit(id) {
  document.getElementById('form-despesa').addEventListener('submit', async (e) => {
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
      type: fd.get('type'),
      status: fd.get('status'),
      notes: fd.get('notes')
    };
    try {
      if (id) {
        await expenses.update(id, data);
        showToast('Despesa atualizada!', 'success');
      } else {
        await expenses.create(data);
        showToast('Despesa criada!', 'success');
      }
      closeModal('modal-despesa');
      document.getElementById('modal-despesa').remove();
      renderDespesas(document.getElementById('content'));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) { btn.dataset.submitting = ''; btn.disabled = false; }
    }
  });
}

function newDespesa() {
  openDespesaModal('Nova Despesa', buildFormDespesa());
  handleDespesaSubmit(null);
}

async function editDespesa(id) {
  try {
    const item = await expenses.get(id);
    openDespesaModal('Editar Despesa', buildFormDespesa(item));
    handleDespesaSubmit(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteDespesa(id) {
  if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
  try {
    await expenses.delete(id);
    showToast('Despesa excluída.', 'success');
    renderDespesas(document.getElementById('content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}
