/* FinControl — controlador principal da aplicação.
 * Responsável por: inicialização, sidebar, navegação, header, tema, logout.
 * NÃO contém o código completo de cada página — cada página tem seu módulo. */

import { initAuth, logout } from './auth.js';
import { closeAllModals } from './components.js';
import { ICONS } from './icons.js';

/* ==================== ROTAS ==================== */
import { renderDashboard } from '../pages/dashboard.js';
import { renderReceitas } from '../pages/receitas.js';
import { renderDespesas } from '../pages/despesas.js';
import { renderSalarios } from '../pages/salarios.js';
import { renderOrcamento } from '../pages/orcamento.js';
import { renderMetas } from '../pages/metas.js';
import { renderInvestimentos } from '../pages/investimentos.js';
import { renderPatrimonio } from '../pages/patrimonio.js';
import { renderRelatorios } from '../pages/relatorios.js';
import { renderInsights } from '../pages/insights.js';
import { renderAssistente } from '../pages/assistente.js';
import { renderConfiguracoes } from '../pages/configuracoes.js';

const routes = {
  dashboard: { render: renderDashboard, title: 'Dashboard', desc: 'Visão geral das suas finanças' },
  receitas: { render: renderReceitas, title: 'Meu Dinheiro', desc: 'Gestão de receitas e rendimentos' },
  despesas: { render: renderDespesas, title: 'Despesas', desc: 'Controle seus gastos' },
  salarios: { render: renderSalarios, title: 'Salários', desc: 'Gestão de salários' },
  orcamento: { render: renderOrcamento, title: 'Orçamento', desc: 'Limites por categoria' },
  metas: { render: renderMetas, title: 'Metas', desc: 'Seus objetivos financeiros' },
  investimentos: { render: renderInvestimentos, title: 'Investimentos', desc: 'Sua carteira de investimentos' },
  patrimonio: { render: renderPatrimonio, title: 'Patrimônio', desc: 'Evolução do seu patrimônio' },
  relatorios: { render: renderRelatorios, title: 'Relatórios', desc: 'Análises detalhadas' },
  insights: { render: renderInsights, title: 'Insights', desc: 'Inteligência financeira' },
  assistente: { render: renderAssistente, title: 'Assistente', desc: 'Assistente IA' },
  configuracoes: { render: renderConfiguracoes, title: 'Configurações', desc: 'Ajustes da conta' }
};

/* ==================== SIDEBAR ==================== */
const SIDEBAR_SECTIONS = [
  {
    title: 'Principal',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard }]
  },
  {
    title: 'Finanças',
    items: [
      { id: 'receitas', label: 'Meu Dinheiro', icon: ICONS.wallet },
      { id: 'despesas', label: 'Despesas', icon: ICONS.expenses },
      { id: 'salarios', label: 'Salários', icon: ICONS.bank },
      { id: 'orcamento', label: 'Orçamento', icon: ICONS.budget }
    ]
  },
  {
    title: 'Planejamento',
    items: [
      { id: 'metas', label: 'Metas', icon: ICONS.target },
      { id: 'investimentos', label: 'Investimentos', icon: ICONS.invest },
      { id: 'patrimonio', label: 'Patrimônio', icon: ICONS.home }
    ]
  },
  {
    title: 'Análises',
    items: [
      { id: 'relatorios', label: 'Relatórios', icon: ICONS.reports },
      { id: 'insights', label: 'Insights', icon: ICONS.insights },
      { id: 'assistente', label: 'Assistente', icon: ICONS.bot }
    ]
  },
  {
    title: 'Sistema',
    items: [{ id: 'configuracoes', label: 'Configurações', icon: ICONS.settings }]
  }
];

let currentPage = 'dashboard';

/** Renderiza a sidebar. */
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = SIDEBAR_SECTIONS.map(section => `
    <div class="sidebar-section">
      <div class="sidebar-section-title">${section.title}</div>
      ${section.items.map(item => `
        <a href="#${item.id}" class="sidebar-item" data-route="${item.id}">
          <span class="sidebar-item-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </div>
  `).join('');

  nav.querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const route = el.dataset.route;
      navigateTo(route);
    });
  });
}

/** Ativa o item atual na sidebar. */
function setActiveNav(route) {
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

/* ==================== NAVEGAÇÃO ==================== */
function navigateTo(route) {
  if (!routes[route]) route = 'dashboard';
  currentPage = route;

  const r = routes[route];
  document.getElementById('header-title').textContent = r.title;
  document.getElementById('header-subtitle').textContent = r.desc;

  setActiveNav(route);
  closeAllModals();

  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.add('hidden');

  location.hash = route;

  const container = document.getElementById('content');
  container.innerHTML = '';
  r.render(container);
}

/** Inicializa navegação por hash. */
function initNavigation() {
  const hash = location.hash.replace('#', '');
  navigateTo(hash || 'dashboard');

  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (h && h !== currentPage) navigateTo(h);
  });
}

/* ==================== TEMA ==================== */
function initTheme() {
  const saved = localStorage.getItem('fincontrol_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  const btnTheme = document.getElementById('btn-theme');
  const btnTheme2 = document.getElementById('btn-theme-2');
  const updateIcon = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const icon = isDark ? ICONS.sun : ICONS.moon;
    if (btnTheme) btnTheme.innerHTML = icon;
    if (btnTheme2) btnTheme2.innerHTML = icon;
  };
  updateIcon();

  const toggle = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(isDark ? 'light' : 'dark');
    updateIcon();
  };
  if (btnTheme) btnTheme.addEventListener('click', toggle);
  if (btnTheme2) btnTheme2.addEventListener('click', toggle);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fincontrol_theme', theme);
}

/* ==================== HEADER ==================== */
function initHeader() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
  });

  const userAvatar = document.getElementById('user-avatar');
  const menu = document.getElementById('user-menu');
  userAvatar?.addEventListener('click', (e) => {
    e.stopPropagation();
    menu?.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (menu?.classList.contains('show') && !menu.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
  menu?.querySelectorAll('.user-menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      menu.classList.remove('show');
      if (item.dataset.action === 'logout') logout();
      else if (item.dataset.action === 'settings') navigateTo('configuracoes');
    });
  });
}

function updateUserHeader(user) {
  const avatar = document.getElementById('user-avatar');
  if (avatar && user) {
    avatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
  }
  const menuName = document.getElementById('user-menu-name');
  if (menuName && user) {
    menuName.textContent = user.name || user.email || 'Usuário';
  }
}

/* ==================== EVENTOS GLOBAIS ==================== */
function initGlobalEvents() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('show');
      document.body.style.overflow = '';
    }
    if (e.target.dataset?.close) {
      const m = document.getElementById(e.target.dataset.close);
      if (m) { m.classList.remove('show'); document.body.style.overflow = ''; }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

/* ==================== INICIALIZAÇÃO ==================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGlobalEvents();

  document.addEventListener('app:ready', (e) => {
    updateUserHeader(e.detail);
    renderSidebar();
    initHeader();
    initNavigation();
  });

  initAuth();
});

