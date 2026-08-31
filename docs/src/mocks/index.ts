/**
 * Arquivo de compatibilidade retroativa.
 *
 * Todos os tipos compartilhados foram movidos para src/types/index.ts.
 * Os dados mockados foram REMOVIDOS — a aplicação agora consome 100% da API
 * real (Spring Boot + MongoDB Atlas) via httpService.
 *
 * Este arquivo mantém apenas os re-exports de tipos para evitar quebrar
 * imports legados durante a transição.
 */

export type {
  Receita,
  Despesa,
  Orcamento,
  Aporte,
  Ativo,
  Meta,
  Notificacao,
  DashboardSummary,
  Patrimonio,
  EvolucaoPoint,
} from '../types';

