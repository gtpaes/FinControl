/**
 * Cliente HTTP central do frontend FinControl.
 *
 * - Base URL vem de VITE_API_URL (ex.: https://fincontrol-api.onrender.com).
 * - Em dev, sem VITE_API_URL, usa http://localhost:8080 direto.
 * - O token JWT é guardado em localStorage e enviado como
 *   Authorization: Bearer <token> em todas as chamadas autenticadas.
 * - Nunca confiamos em userId do frontend: o backend extrai do JWT.
 */

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080';

const TOKEN_KEY = 'fincontrol_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = res.status !== 204 ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg = (data as { message?: string } | null)?.message ?? `Erro ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

// ===== Auth =====

interface AuthResponse {
  token: string;
  tokenType: string;
  user: Usuario;
}

export async function apiRegister(nome: string, email: string, senha: string): Promise<AuthResponse> {
  const r = await request<AuthResponse>('POST', '/auth/register', { name: nome, email, password: senha }, false);
  setToken(r.token);
  return r;
}

export async function apiLogin(email: string, senha: string): Promise<AuthResponse> {
  const r = await request<AuthResponse>('POST', '/auth/login', { email, password: senha }, false);
  setToken(r.token);
  return r;
}

export async function apiMe(): Promise<Usuario> {
  return request<Usuario>('GET', '/auth/me');
}

export async function apiUpdateProfile(nome: string): Promise<Usuario> {
  return request<Usuario>('PUT', '/auth/profile', { name: nome });
}

export function apiLogout(): void {
  setToken(null);
}

// ===== Recursos financeiros =====

export interface IncomeDto {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  recurrence?: string; // UNICA | MENSAL | ANUAL
  notes?: string;
}

export interface ExpenseDto {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  type?: string; // FIXA | VARIAVEL
  status?: string; // PAGA | PENDENTE
  recurring?: boolean;
  notes?: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
}

export const apiIncomes = {
  list: () => request<Page<IncomeDto>>('GET', '/incomes?page=0&size=100'),
  create: (dto: Omit<IncomeDto, 'id'>) => request<IncomeDto>('POST', '/incomes', dto),
  remove: (id: string) => request<void>('DELETE', `/incomes/${id}`),
};

export const apiExpenses = {
  list: () => request<Page<ExpenseDto>>('GET', '/expenses?page=0&size=100'),
  create: (dto: Omit<ExpenseDto, 'id'>) => request<ExpenseDto>('POST', '/expenses', dto),
  remove: (id: string) => request<void>('DELETE', `/expenses/${id}`),
};

// ===== Metas (goals) =====

export interface GoalDto {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string;
}

export const apiGoals = {
  list: () => request<GoalDto[]>('GET', '/goals'),
  create: (dto: Omit<GoalDto, 'id'>) => request<GoalDto>('POST', '/goals', dto),
  remove: (id: string) => request<void>('DELETE', `/goals/${id}`),
};

// ===== Investimentos (carteira) =====

export interface AporteDto {
  date: string;
  amount: number;
  quantity: number;
}

export interface InvestmentDto {
  id: string;
  ticker: string;
  name: string;
  type: string; // RENDA_FIXA | FIIS | ACOES | ETFS | EXTERIOR | OUTROS
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  aportes: AporteDto[];
}

export interface InvestmentSummaryDto {
  patrimonioInvestido: number;
  custoTotal: number;
  rentabilidadeTotal: number;
  resultado: number;
  aportesMes: number;
}

export const apiInvestments = {
  list: () => request<InvestmentDto[]>('GET', '/investments'),
  create: (dto: Omit<InvestmentDto, 'id' | 'aportes'>) => request<InvestmentDto>('POST', '/investments', dto),
  remove: (id: string) => request<void>('DELETE', `/investments/${id}`),
  evolucao: () => request<{ mes: string; aportes: number; valor: number }[]>('GET', '/investments/evolution'),
  summary: () => request<InvestmentSummaryDto>('GET', '/investments/summary'),
};

// ===== Orçamentos (limites por categoria) =====

export interface BudgetDto {
  id: string;
  category: string;
  limitAmount: number;
}

export const apiBudgets = {
  list: () => request<BudgetDto[]>('GET', '/budgets'),
  create: (dto: { category: string; limitAmount: number }) => request<BudgetDto>('POST', '/budgets', dto),
  remove: (id: string) => request<void>('DELETE', `/budgets/${id}`),
};

// ===== Dashboard (agregações reais) =====

export interface DashboardSummaryDto {
  mes: string;
  salarioLiquido: number;
  rendaExtra: number;
  rendaTotal: number;
  despesasMes: number;
  despesasMesAnterior: number;
  investidoMes: number;
  metaInvestimento: number;
  patrimonioAtual: number;
  variacaoPatrimonial: number;
  saldoDisponivel: number;
}

export const apiDashboard = {
  summary: () => request<DashboardSummaryDto>('GET', '/dashboard/summary'),
  despesasPorCategoria: () => request<{ categoria: string; valor: number }[]>('GET', '/dashboard/expenses-by-category'),
  evolucaoPatrimonial: (periodo: string) =>
    request<{ label: string; valor: number }[]>('GET', `/dashboard/patrimony-evolution?periodo=${periodo}`),
};

// ===== Patrimônio (derivado) =====

export interface PatrimonioDto {
  total: number;
  investimentos: number;
  dinheiroDisponivel: number;
  outrosAtivos: number;
  dividas: number;
  liquido: number;
  historico: { mes: string; ativos: number; dividas: number }[];
}

export const apiPatrimonio = {
  get: () => request<PatrimonioDto>('GET', '/patrimony'),
};

// ===== Relatórios (agregações mensais) =====

export const apiReports = {
  mensal: (periodo: string) =>
    request<{ label: string; receitas: number; despesas: number; aportes: number }[]>(
      'GET', `/reports?periodo=${periodo}`),
};

// ===== Insights / Notificações / Assistente (derivados de dados reais) =====

export interface InsightDto { tipo: string; titulo: string; texto: string }
export interface NotificationDto { id: string; titulo: string; texto: string; tipo: string; lida: boolean }

export const apiInsights = {
  list: () => request<InsightDto[]>('GET', '/insights'),
};

export const apiNotifications = {
  list: () => request<NotificationDto[]>('GET', '/notifications'),
};

export const apiAi = {
  analyze: (message: string) =>
    request<{ reply: string }>('POST', '/ai/analyze', { message }),
};
