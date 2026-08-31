/**
 * Tipos TypeScript compartilhados entre páginas e serviços do frontend.
 * Extraídos de src/mocks/index.ts — os dados mockados foram removidos.
 * As interfaces refletem os DTOs do backend (Spring Boot).
 */

export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  categoria: 'salario' | 'extra' | 'bonus' | 'freelance' | 'outras';
  recorrencia: 'unica' | 'mensal' | 'anual';
}

export interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  tipo: 'fixa' | 'variavel';
  status: 'paga' | 'pendente';
  recorrente: boolean;
}

export interface Orcamento {
  id: string;
  categoria: string;
  limite: number;
  gasto: number;
}

export interface Aporte {
  data: string;
  valor: number;
  quantidade: number;
}

export interface Ativo {
  id: string;
  ticker: string;
  nome: string;
  tipo: 'Renda Fixa' | 'FIIs' | 'Ações' | 'ETFs' | 'Exterior' | 'Outros';
  quantidade: number;
  precoMedio: number;
  precoAtual: number;
  aportes: Aporte[];
}

export interface Meta {
  id: string;
  nome: string;
  objetivo: number;
  atual: number;
  prazo: string; // YYYY-MM-DD
  cor: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  texto: string;
  tipo: 'sucesso' | 'alerta' | 'info';
  lida: boolean;
}

export interface DashboardSummary {
  mes: string;               // "2026-08"
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

export interface Patrimonio {
  total: number;
  investimentos: number;
  dinheiroDisponivel: number;
  outrosAtivos: number;
  dividas: number;
  liquido: number;
  historico: { mes: string; ativos: number; dividas: number }[];
}

export interface EvolucaoPoint {
  label: string;
  valor: number;
}
