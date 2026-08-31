import type { DashboardSummary, Patrimonio, Receita, Despesa, Orcamento, Ativo, Meta } from '../types';
import { httpService } from './impl/httpService';

/**
 * Camada de serviços.
 * A interface ApiClient define o contrato consumido pelas páginas.
 * Implementação ATIVA: httpService — 100% API real (Spring Boot + MongoDB Atlas).
 * Nenhum mock, nenhum fallback. Se a API falhar, o erro propaga para a UI.
 */
export interface ApiClient {
  // GET /api/dashboard/summary, /expenses-by-category, /patrimony-evolution
  getResumoMensal(): Promise<DashboardSummary>;
  getEvolucaoPatrimonial(periodo: '6m' | '1a' | '5a' | 'max'): Promise<{ label: string; valor: number }[]>;
  getDespesasPorCategoria(): Promise<{ categoria: string; valor: number }[]>;
  // GET /api/incomes
  getReceitas(): Promise<Receita[]>;
  createReceita(r: Omit<Receita, 'id'>): Promise<Receita>;
  deleteReceita(id: string): Promise<void>;
  // GET /api/expenses
  getDespesas(): Promise<Despesa[]>;
  createDespesa(d: Omit<Despesa, 'id'>): Promise<Despesa>;
  deleteDespesa(id: string): Promise<void>;
  // GET /api/budgets
  getOrcamentos(): Promise<Orcamento[]>;
  createOrcamento(o: { categoria: string; limite: number }): Promise<Orcamento>;
  deleteOrcamento(id: string): Promise<void>;
  // GET /api/goals
  getMetas(): Promise<Meta[]>;
  createMeta(m: Omit<Meta, 'id'>): Promise<Meta>;
  deleteMeta(id: string): Promise<void>;
  // GET /api/investments
  getCarteira(): Promise<Ativo[]>;
  getInvestimento(id: string): Promise<Ativo | undefined>;
  createInvestimento(a: Omit<Ativo, 'id' | 'aportes'>): Promise<Ativo>;
  deleteInvestimento(id: string): Promise<void>;
  getEvolucaoInvestimentos(): Promise<{ mes: string; aportes: number; valor: number }[]>;
  getResumoInvestimentos(): Promise<{ patrimonioInvestido: number; custoTotal: number; rentabilidadeTotal: number; resultado: number; aportesMes: number }>;
  // GET /api/patrimony
  getPatrimonio(): Promise<Patrimonio>;
  // GET /api/reports?periodo=
  getRelatorios(periodo: string): Promise<{ label: string; receitas: number; despesas: number; aportes: number }[]>;
  // GET /api/insights
  getInsights(): Promise<{ tipo: string; titulo: string; texto: string }[]>;
  // GET /api/notifications
  getNotificacoes(): Promise<{ id: string; titulo: string; texto: string; tipo: string; lida: boolean }[]>;
  // POST /api/ai/analyze
  sendAssistantMessage(texto: string): Promise<string>;
}

export const apiService: ApiClient = httpService;
