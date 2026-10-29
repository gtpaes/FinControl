/* FinControl — camada centralizada de API.
 * Todas as páginas usam este módulo para comunicar com o backend. */

const TOKEN_KEY = 'fincontrol_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Faz fetch com JWT e tratamento de erro padronizado.
 * opts.skipAuthRedirect: não força reload em 401 (usado no próprio login/registo). */
async function request(method, path, body, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${window.API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && !opts.skipAuthRedirect) {
    setToken(null);
    window.location.reload();
    throw new Error('Sessão expirada. Entre novamente.');
  }

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) msg = err.message;
    } catch { /* ignora */ }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) return res.json();
  return res.text();
}

/** Helper para query strings. */
function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null && v !== '') sp.append(k, v);
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/* ==================== AUTH ==================== */
export const auth = {
  login: (email, password) => request('POST', '/api/auth/login', { email, password }, { skipAuthRedirect: true }),
  register: (name, email, password) => request('POST', '/api/auth/register', { name, email, password }, { skipAuthRedirect: true }),
  me: () => request('GET', '/api/auth/me'),
  updateProfile: (data) => request('PUT', '/api/auth/profile', data)
};

/* ==================== DASHBOARD ==================== */
export const dashboard = {
  summary: () => request('GET', '/api/dashboard/summary'),
  expensesByCategory: () => request('GET', '/api/dashboard/expenses-by-category'),
  patrimonyEvolution: (periodo = '6m') => request('GET', `/api/dashboard/patrimony-evolution${qs({ periodo })}`)
};

/* ==================== INCOMES (Receitas) ==================== */
export const incomes = {
  list: (params = {}) => request('GET', `/api/incomes${qs(params)}`),
  get: (id) => request('GET', `/api/incomes/${id}`),
  create: (data) => request('POST', '/api/incomes', data),
  update: (id, data) => request('PUT', `/api/incomes/${id}`, data),
  delete: (id) => request('DELETE', `/api/incomes/${id}`)
};

/* ==================== EXPENSES (Despesas) ==================== */
export const expenses = {
  list: (params = {}) => request('GET', `/api/expenses${qs(params)}`),
  get: (id) => request('GET', `/api/expenses/${id}`),
  create: (data) => request('POST', '/api/expenses', data),
  update: (id, data) => request('PUT', `/api/expenses/${id}`, data),
  delete: (id) => request('DELETE', `/api/expenses/${id}`)
};

/* ==================== SALARIES (Salários) ==================== */
export const salaries = {
  list: (params = {}) => request('GET', `/api/salaries${qs(params)}`),
  get: (id) => request('GET', `/api/salaries/${id}`),
  create: (data) => request('POST', '/api/salaries', data),
  update: (id, data) => request('PUT', `/api/salaries/${id}`, data),
  delete: (id) => request('DELETE', `/api/salaries/${id}`)
};

/* ==================== BUDGETS (Orçamento) ==================== */
export const budgets = {
  list: () => request('GET', '/api/budgets'),
  create: (data) => request('POST', '/api/budgets', data),
  update: (id, data) => request('PUT', `/api/budgets/${id}`, data),
  delete: (id) => request('DELETE', `/api/budgets/${id}`)
};

/* ==================== GOALS (Metas) ==================== */
export const goals = {
  list: () => request('GET', '/api/goals'),
  get: (id) => request('GET', `/api/goals/${id}`),
  create: (data) => request('POST', '/api/goals', data),
  update: (id, data) => request('PUT', `/api/goals/${id}`, data),
  delete: (id) => request('DELETE', `/api/goals/${id}`)
};

/* ==================== INVESTMENTS (Investimentos) ==================== */
export const investments = {
  list: () => request('GET', '/api/investments'),
  get: (id) => request('GET', `/api/investments/${id}`),
  create: (data) => request('POST', '/api/investments', data),
  update: (id, data) => request('PUT', `/api/investments/${id}`, data),
  delete: (id) => request('DELETE', `/api/investments/${id}`),
  addAporte: (id, data) => request('POST', `/api/investments/${id}/aportes`, data),
  evolution: (meses = 12) => request('GET', `/api/investments/evolution${qs({ meses })}`),
  summary: () => request('GET', '/api/investments/summary')
};

/* ==================== PATRIMONY (Patrimônio) ==================== */
export const patrimony = {
  get: () => request('GET', '/api/patrimony'),
  evolution: (periodo = '6m') => request('GET', `/api/patrimony/evolution${qs({ periodo })}`)
};

/* ==================== REPORTS (Relatórios) ==================== */
export const reports = {
  get: (periodo = 'mes') => request('GET', `/api/reports${qs({ periodo })}`)
};

/* ==================== MARKET (cotações ao vivo) ==================== */
export const market = {
  quotes: (tickers) => request('GET', `/api/market/quotes${qs({ tickers: tickers.join(',') })}`),
  search: (q, market) => request('GET', `/api/market/search${qs({ q, market })}`),
  history: (ticker, range) => request('GET', `/api/market/history${qs({ ticker, range })}`)
};

/* ==================== INSIGHTS & ASSISTANT ==================== */
export const insights = {
  list: () => request('GET', '/api/insights'),
  notifications: () => request('GET', '/api/notifications'),
  // history: [{ role: 'user' | 'assistant', content }] — contexto recente da conversa
  analyze: (message, history = []) => request('POST', '/api/ai/analyze', { message, history })
};
