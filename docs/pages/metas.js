/* FinControl - pagina Metas. */
import { goals } from '../js/api.js';
import { formatCurrency, formatDate, showToast, escapeHtml } from '../js/utils.js';
import { card, table, row, spinner, emptyState, modal, openModal, closeModal, progressBar } from '../js/components.js';
import { ICONS } from '../js/icons.js';

const COLORS = [
  { name: 'brand', hex: '#3b82f6' },
  { name: 'blue', hex: '#0ea5e9' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'red', hex: '#ef4444' },
  { name: 'green', hex: '#10b981' }
];

function colorSwatches(selected) {
  return '<div class="color-swatches">' + COLORS.map(c => {
    const active = c.name === selected ? ' active' : '';
    return '<button type="button" class="color-swatch' + active + '" data-color="' + c.name + '" style="background:' + c.hex + '" title="' + c.name + '"></button>';
  }).join('') + '</div>';
}

export async function renderMetas(container) {
  container.innerHTML = spinner('A carregar metas...');
  try {
    const items = await goals.list();
    const actionsHtml = '<button class="btn btn-primary" id="btn-new-meta">+ Nova Meta</button>';
    const rowsHtml = items.map(i => {
      const pct = i.targetAmount > 0 ? Math.min(100, (Number(i.currentAmount) / Number(i.targetAmount)) * 100) : 0;
      const colorHex = (COLORS.find(c => c.name === i.color) || COLORS[0]).hex;
      const dotHtml = '<span class="meta-color-dot" style="background:' + colorHex + '"></span>';
      const editBtn = '<button class="btn btn-ghost btn-sm" onclick="window._editMeta(\'' + i.id + '\')">' + ICONS.edit + '</button>';
      const delBtn = '<button class="btn btn-ghost btn-sm btn-danger" onclick="window._deleteMeta(\'' + i.id + '\')">' + ICONS.trash + '</button>';
      return row([dotHtml + escapeHtml(i.name), formatCurrency(i.targetAmount), formatCurrency(i.currentAmount), pct.toFixed(0) + '%', i.deadline ? formatDate(i.deadline) : '-'], editBtn + delBtn);
    }).join('');
    container.innerHTML =
      card({
        title: 'Metas Financeiras',
        subtitle: items.length + ' metas',
        actions: actionsHtml,
        body: table({
          headers: ['Meta','Objetivo','Atual','Progresso','Prazo','Acoes'],
          rows: rowsHtml,
          emptyMsg: 'Nenhuma meta definida.'
        })
      });
    window._editMeta = (id) => editMeta(id);
    window._deleteMeta = (id) => deleteMeta(id);
    document.getElementById('btn-new-meta').addEventListener('click', () => newMeta());
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = emptyState('Erro ao carregar metas.', ICONS.alert);
  }
}

function buildFormMeta(item = {}) {
  const sc = item.color || 'brand';
  return '\n    <form id="form-meta">\n      <div class="form-group"><label>Nome da Meta</label><input type="text" name="name" class="form-input" required value="' + escapeHtml(item.name || '') + '" placeholder="Ex: Comprar carro"></div>\n      <div class="form-group"><label>Valor Objetivo</label><input type="number" name="targetAmount" class="form-input" required min="0.01" step="0.01" value="' + (item.targetAmount || '') + '" placeholder="0,00"></div>\n      <div class="form-group"><label>Valor Atual</label><input type="number" name="currentAmount" class="form-input" min="0" step="0.01" value="' + (item.currentAmount || '0') + '" placeholder="0,00"></div>\n      <div class="form-group"><label>Prazo</label><input type="date" name="deadline" class="form-input" value="' + (item.deadline || '') + '"></div>\n      <div class="form-group"><label>Cor</label><input type="hidden" name="color" value="' + sc + '">' + colorSwatches(sc) + '</div>\n      <button type="submit" class="btn btn-primary btn-block">' + (item.id ? 'Atualizar' : 'Guardar') + '</button>\n    </form>\n  ';
}

function openMetaModal(title, formHtml) {
  document.getElementById('modal-meta')?.remove();
  document.body.insertAdjacentHTML('beforeend', modal({ id: 'modal-meta', title, content: formHtml, footer: '<button class="btn btn-ghost" data-close="modal-meta">Cancelar</button>' }));
  openModal('modal-meta');
  document.querySelectorAll('#modal-meta .color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modal-meta .color-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector('#modal-meta [name=color]').value = btn.dataset.color;
    });
  });
}

function handleMetaSubmit(id) {
  document.getElementById('form-meta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn && btn.dataset.submitting) return;
    if (btn) { btn.dataset.submitting = '1'; btn.disabled = true; }
    const fd = new FormData(e.target);
    const data = { name: fd.get('name'), targetAmount: Number(fd.get('targetAmount')), currentAmount: Number(fd.get('currentAmount')||0), deadline: fd.get('deadline')||null, color: fd.get('color') };
    try {
      if (id) { await goals.update(id, data); showToast('Meta atualizada!', 'success'); }
      else { await goals.create(data); showToast('Meta criada!', 'success'); }
      closeModal('modal-meta'); document.getElementById('modal-meta').remove(); renderMetas(document.getElementById('content'));
    } catch (err) { showToast(err.message, 'error'); } finally { if (btn) { btn.dataset.submitting = ''; btn.disabled = false; } }
  });
}

function newMeta() { openMetaModal('Nova Meta', buildFormMeta()); handleMetaSubmit(null); }
async function editMeta(id) { try { const item = await goals.get(id); openMetaModal('Editar Meta', buildFormMeta(item)); handleMetaSubmit(id); } catch (err) { showToast(err.message, 'error'); } }
async function deleteMeta(id) { if (!confirm('Excluir esta meta?')) return; try { await goals.delete(id); showToast('Meta excluida.', 'success'); renderMetas(document.getElementById('content')); } catch (err) { showToast(err.message, 'error'); } }
