/* FinControl — página Salários. */
import { salaries } from '../js/api.js';
import { formatCurrency, formatMonth, showToast, escapeHtml } from '../js/utils.js';
import { card, table, row, spinner, emptyState, modal, openModal, closeModal } from '../js/components.js';
import { ICONS } from '../js/icons.js';

export async function renderSalarios(container) {
  container.innerHTML = spinner('A carregar salários...');

  try {
    const page = await salaries.list({ size: 50 });
    const items = page.content || [];

    const actionsHtml = `<button class="btn btn-primary" id="btn-new-salario">+ Novo Salário</button>`;

    const rowsHtml = items.map(i => row([
      formatCurrency(i.amount),
      escapeHtml(i.description || '-'),
      formatMonth(i.referenceMonth)
    ], `
      <button class="btn btn-ghost btn-sm" onclick="window._editSalario('${i.id}')">${ICONS.edit}</button>
      <button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteSalario('${i.id}')">${ICONS.trash}</button>
    `)).join('');

    container.innerHTML = `
      ${card({
        title: 'Salários',
        subtitle: `${items.length} registos`,
        actions: actionsHtml,
        body: table({
          headers: ['Valor', 'Descrição', 'Mês Referência', 'Ações'],
          rows: rowsHtml,
          emptyMsg: 'Nenhum salário registado.'
        })
      })}
    `;

    window._editSalario = (id) => editSalario(id);
    window._deleteSalario = (id) => deleteSalario(id);
    document.getElementById('btn-new-salario').addEventListener('click', () => newSalario());

  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar salários.', ICONS.alert);
  }
}

function buildFormSalario(item = {}) {
  return `
    <form id="form-salario">
      <div class="form-group">
        <label>Valor</label>
        <input type="number" name="amount" class="form-input" required min="0.01" step="0.01" value="${item.amount || ''}" placeholder="0,00">
      </div>
      <div class="form-group">
        <label>Descrição</label>
        <input type="text" name="description" class="form-input" value="${escapeHtml(item.description || '')}" placeholder="Ex: Salário mensal">
      </div>
      <div class="form-group">
        <label>Mês de Referência</label>
        <input type="month" name="referenceMonth" class="form-input" required value="${item.referenceMonth || ''}">
      </div>
      <button type="submit" class="btn btn-primary btn-block">${item.id ? 'Atualizar' : 'Guardar'}</button>
    </form>
  `;
}

function openSalarioModal(title, formHtml) {
  document.getElementById('modal-salario')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({
    id: 'modal-salario',
    title,
    content: formHtml,
    footer: '<button class="btn btn-ghost" data-close="modal-salario">Cancelar</button>'
  }));
  openModal('modal-salario');
}

function handleSalarioSubmit(id) {
  document.getElementById('form-salario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    const data = {
      amount: Number(fd.get('amount')),
      description: fd.get('description'),
      referenceMonth: fd.get('referenceMonth')
    };
    try {
      if (id) {
        await salaries.update(id, data);
        showToast('Salário atualizado!', 'success');
      } else {
        await salaries.create(data);
        showToast('Salário criado!', 'success');
      }
      closeModal('modal-salario');
      document.getElementById('modal-salario').remove();
      renderSalarios(document.getElementById('content'));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) { btn.dataset.submitting = ''; btn.disabled = false; }
    }
  });
}

function newSalario() {
  openSalarioModal('Novo Salário', buildFormSalario());
  handleSalarioSubmit(null);
}

async function editSalario(id) {
  try {
    const item = await salaries.get(id);
    openSalarioModal('Editar Salário', buildFormSalario(item));
    handleSalarioSubmit(id);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSalario(id) {
  if (!confirm('Tem certeza que deseja excluir este salário?')) return;
  try {
    await salaries.delete(id);
    showToast('Salário excluído.', 'success');
    renderSalarios(document.getElementById('content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}
