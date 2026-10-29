/* FinControl — utilitários globais. */

/** Formata valor para moeda BRL. */
export function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata data ISO (yyyy-mm-dd) ou timestamp Unix (epoch seconds) para dd/mm/aaaa. */
export function formatDate(iso) {
  if (!iso) return '';
  let d;
  if (typeof iso === 'number' || /^\d+$/.test(String(iso))) {
    d = new Date(Number(iso) * 1000); // timestamp Unix em segundos
  } else {
    d = new Date(iso + 'T00:00:00');
  }
  return d.toLocaleDateString('pt-BR');
}

/** Formata mês de referência (2026-08) para Ago/2026. */
export function formatMonth(ref) {
  if (!ref) return '';
  const [y, m] = ref.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(m, 10) - 1]}/${y}`;
}

/** Retorna o mês atual no formato yyyy-mm. */
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Debounce simples. */
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Mostra toast de notificação. */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  var icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

/** Escapa HTML para prevenir XSS. */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Traduz enums para labels PT-BR. */
export const LABELS = {
  incomeCategory: {
    SALARY: 'Salário', SALES: 'Vendas', SERVICES: 'Serviços',
    INVESTMENTS: 'Investimentos', OTHER: 'Outros'
  },
  expenseCategory: {
    HOUSING: 'Moradia', FOOD: 'Alimentação', TRANSPORT: 'Transporte',
    HEALTH: 'Saúde', EDUCATION: 'Educação', LEISURE: 'Lazer',
    SHOPPING: 'Compras', BILLS: 'Contas', OTHER: 'Outros'
  },
  expenseType: { FIXA: 'Fixa', VARIAVEL: 'Variável' },
  expenseStatus: { PAGA: 'Paga', PENDENTE: 'Pendente' },
  recurrence: { UNICA: 'Única', MENSAL: 'Mensal', ANUAL: 'Anual' },
  investmentType: {
    RENDA_FIXA: 'Renda Fixa', FIIS: 'FIIs', ACOES: 'Ações',
    ETFS: 'ETFs', EXTERIOR: 'Exterior', OUTROS: 'Outros'
  }
};

/** Retorna label de um enum. */
export function labelOf(enumObj, value) {
  return enumObj?.[value] || value;
}
