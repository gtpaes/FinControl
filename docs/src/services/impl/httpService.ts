/**
 * Implementacao HTTP da camada de servicos — 100%% API real (Spring Boot + MongoDB Atlas).
 * NENHUM mock, NENHUM fallback. Se a API falhar, o erro propaga para a UI.
 *
 *   Receitas      -> /api/incomes
 *   Despesas      -> /api/expenses
 *   Metas         -> /api/goals
 *   Investimentos -> /api/investments
 *   Orcamentos    -> /api/budgets
 *   Dashboard     -> /api/dashboard/*
 *   Patrimonio    -> /api/patrimony
 *   Relatorios    -> /api/reports
 *   Insights      -> /api/insights
 *   Notificacoes  -> /api/notifications
 *   Assistente    -> /api/ai/analyze
 */
import { apiAi, apiBudgets, apiDashboard, apiExpenses, apiGoals, apiIncomes, apiInvestments,
         apiMe, apiNotifications, apiPatrimonio, apiReports, apiInsights } from '../api';
import type { ApiClient } from '../apiService';
import type { Ativo, Despesa, Meta, Receita } from '../../types';

// ===== Mapas de conversao frontend <-> backend =====

const CAT_INCOME: Record<string, string> = {
  salario: 'SALARY', extra: 'SALES', bonus: 'INVESTMENTS', freelance: 'SERVICES', outras: 'OTHER',
};
const CAT_INCOME_REV: Record<string, Receita['categoria']> = {
  SALARY: 'salario', SALES: 'extra', SERVICES: 'freelance', INVESTMENTS: 'bonus', OTHER: 'outras',
};
const CAT_EXPENSE: Record<string, string> = {
  moradia: 'HOUSING', alimentacao: 'FOOD', transporte: 'TRANSPORT', saude: 'HEALTH',
  educacao: 'EDUCATION', lazer: 'LEISURE', compras: 'SHOPPING', contas: 'BILLS', outras: 'OTHER',
};
const CAT_EXPENSE_REV: Record<string, string> = {
  HOUSING: 'moradia', FOOD: 'alimentacao', TRANSPORT: 'transporte', HEALTH: 'saude',
  EDUCATION: 'educacao', LEISURE: 'lazer', SHOPPING: 'compras', BILLS: 'contas', OTHER: 'outras',
};
const EXPENSE_LABEL: Record<string, string> = {
  HOUSING: 'Moradia', FOOD: 'Alimentação', TRANSPORT: 'Transporte', HEALTH: 'Saúde',
  EDUCATION: 'Educação', LEISURE: 'Lazer', SHOPPING: 'Compras', BILLS: 'Contas', OTHER: 'Outros',
};
const LABEL_EXPENSE_IN: Record<string, string> = {
  Moradia: 'HOUSING', Alimentação: 'FOOD', Transporte: 'TRANSPORT', Saúde: 'HEALTH',
  Educação: 'EDUCATION', Lazer: 'LEISURE', Compras: 'SHOPPING', Contas: 'BILLS', Outros: 'OTHER',
};
const REC_IN: Record<string, string> = { unica: 'UNICA', mensal: 'MENSAL', anual: 'ANUAL' };
const REC_REV: Record<string, Receita['recorrencia']> = { UNICA: 'unica', MENSAL: 'mensal', ANUAL: 'anual' };
const TYPE_IN: Record<string, string> = {
  'Renda Fixa': 'RENDA_FIXA', FIIs: 'FIIS', 'Ações': 'ACOES', ETFs: 'ETFS', Exterior: 'EXTERIOR', Outros: 'OUTROS',
};
const TYPE_REV: Record<string, Ativo['tipo']> = {
  RENDA_FIXA: 'Renda Fixa', FIIS: 'FIIs', ACOES: 'Ações', ETFS: 'ETFs', EXTERIOR: 'Exterior', OUTROS: 'Outros',
};

function mapAtivo(i: {
  id: string; ticker: string; name: string; type: string;
  quantity: number; avgPrice: number; currentPrice: number;
  aportes: { date: string; amount: number; quantity: number }[];
}): Ativo {
  return {
    id: i.id,
    ticker: i.ticker,
    nome: i.name,
    tipo: TYPE_REV[i.type] ?? 'Outros',
    quantidade: Number(i.quantity),
    precoMedio: Number(i.avgPrice),
    precoAtual: Number(i.currentPrice),
    aportes: (i.aportes ?? []).map((a) => ({ data: a.date, valor: Number(a.amount), quantidade: Number(a.quantity) })),
  };
}

export const httpService: ApiClient = {
  async getResumoMensal() {
    return apiDashboard.summary();
  },

  async getEvolucaoPatrimonial(periodo) {
    return apiDashboard.evolucaoPatrimonial(periodo);
  },

  async getDespesasPorCategoria() {
    return apiDashboard.despesasPorCategoria();
  },

  // ===== Receitas =====

  async getReceitas() {
    const page = await apiIncomes.list();
    return page.content.map((i): Receita => ({
      id: i.id, descricao: i.description, valor: Number(i.amount), data: i.date,
      categoria: CAT_INCOME_REV[i.category] ?? 'outras',
      recorrencia: i.recurrence ? (REC_REV[i.recurrence] ?? 'unica') : 'unica',
    }));
  },

  async createReceita(r) {
    const criada = await apiIncomes.create({
      description: r.descricao, amount: r.valor, date: r.data,
      category: CAT_INCOME[r.categoria] ?? 'OTHER',
      recurrence: REC_IN[r.recorrencia] ?? 'UNICA',
    });
    return { ...r, id: criada.id };
  },

  async deleteReceita(id) {
    await apiIncomes.remove(id);
  },

  // ===== Despesas =====

  async getDespesas() {
    const page = await apiExpenses.list();
    return page.content.map((e): Despesa => ({
      id: e.id, descricao: e.description,
      categoria: CAT_EXPENSE_REV[e.category] ?? 'outras',
      valor: Number(e.amount), data: e.date,
      tipo: e.type === 'FIXA' ? 'fixa' : 'variavel',
      status: e.status === 'PENDENTE' ? 'pendente' : 'paga',
      recorrente: !!e.recurring,
    }));
  },

  async createDespesa(d) {
    const criada = await apiExpenses.create({
      description: d.descricao, amount: d.valor, date: d.data,
      category: CAT_EXPENSE[d.categoria] ?? 'OTHER',
      type: d.tipo === 'fixa' ? 'FIXA' : 'VARIAVEL',
      status: d.status === 'pendente' ? 'PENDENTE' : 'PAGA',
      recurring: d.recorrente,
    });
    return { ...d, id: criada.id };
  },

  async deleteDespesa(id) {
    await apiExpenses.remove(id);
  },

  // ===== Orcamentos =====

  async getOrcamentos() {
    const lista = await apiBudgets.list();
    return lista.map((b) => ({
      id: b.id, categoria: EXPENSE_LABEL[b.category] ?? b.category,
      limite: Number(b.limitAmount), gasto: 0,
    }));
  },

  async createOrcamento(o) {
    const criada = await apiBudgets.create({
      category: LABEL_EXPENSE_IN[o.categoria] ?? 'OTHER',
      limitAmount: o.limite,
    });
    return { id: criada.id, categoria: o.categoria, limite: Number(criada.limitAmount), gasto: 0 };
  },

  async deleteOrcamento(id) {
    await apiBudgets.remove(id);
  },

  // ===== Metas =====

  async getMetas() {
    const lista = await apiGoals.list();
    return lista.map((g): Meta => ({
      id: g.id, nome: g.name, objetivo: Number(g.targetAmount),
      atual: Number(g.currentAmount), prazo: g.deadline, cor: g.color,
    }));
  },

  async createMeta(m) {
    const criada = await apiGoals.create({
      name: m.nome, targetAmount: m.objetivo, currentAmount: m.atual,
      deadline: m.prazo, color: m.cor,
    });
    return { ...m, id: criada.id };
  },

  async deleteMeta(id) {
    await apiGoals.remove(id);
  },

  // ===== Investimentos / Carteira =====

  async getCarteira() {
    const lista = await apiInvestments.list();
    return lista.map(mapAtivo);
  },

  async getInvestimento(id) {
    const lista = await apiInvestments.list();
    const a = lista.find((i) => i.id === id);
    return a ? mapAtivo(a) : undefined;
  },

  async createInvestimento(a) {
    const criada = await apiInvestments.create({
      ticker: a.ticker, name: a.nome, type: TYPE_IN[a.tipo] ?? 'OUTROS',
      quantity: a.quantidade, avgPrice: a.precoMedio, currentPrice: a.precoAtual,
    });
    return { ...a, id: criada.id, aportes: [] };
  },

  async deleteInvestimento(id) {
    await apiInvestments.remove(id);
  },

  async getEvolucaoInvestimentos() {
    return apiInvestments.evolucao();
  },

  async getResumoInvestimentos() {
    return apiInvestments.summary();
  },

  // ===== Patrimonio (derivado) =====

  async getPatrimonio() {
    return apiPatrimonio.get();
  },

  // ===== Relatorios =====

  async getRelatorios(periodo) {
    return apiReports.mensal(periodo);
  },

  // ===== Insights / Notificacoes / Assistente =====

  async getInsights() {
    return apiInsights.list();
  },

  async getNotificacoes() {
    return apiNotifications.list();
  },

  async sendAssistantMessage(texto) {
    const r = await apiAi.analyze(texto);
    return r.reply;
  },
};

export { apiMe };
