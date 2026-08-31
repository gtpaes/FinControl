import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { brl, pct } from '../lib/format';
import { Card, CardHeader, PageHeader, Skeleton } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';
import { LinhaDupla } from '../components/charts';

export default function Investimentos() {
  const [evolucao, setEvolucao] = useState<{ mes: string; aportes: number; valor: number }[] | null>(null);
  const [resumo, setResumo] = useState<{ patrimonioInvestido: number; rentabilidadeTotal: number; resultado: number; aportesMes: number; custoTotal: number } | null>(null);

  useEffect(() => {
    apiService.getEvolucaoInvestimentos().then(setEvolucao).catch(() => setEvolucao([]));
    apiService.getResumoInvestimentos().then(setResumo).catch(() => setResumo(null));
  }, []);

  const carregando = evoluoLoading() || resumo === null;
  function evoluoLoading() { return evolucao === null; }

  return (
    <><PageHeader titulo="Investimentos" descricao="Visão geral dos seus aportes e da rentabilidade acumulada." /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard carregando={carregando} titulo="Patrimônio investido" valor={resumo && brl(resumo.patrimonioInvestido)} /><StatCard carregando={carregando} titulo="Rentabilidade total" valor={resumo && pct(resumo.rentabilidadeTotal, 2)} detalhes={resumo && <p className="text-brand-600 dark:text-brand-400">Resultado: {brl(resumo.resultado)}</p>} /><StatCard carregando={carregando} titulo="Aportes no mês" valor={resumo && brl(resumo.aportesMes)} detalhes={resumo && <p>Custo total: {brl(resumo.custoTotal)}</p>} /><StatCard carregando={carregando} titulo="Situação" valor={resumo ? (resumo.resultado >= 0 ? 'Positiva' : 'Negativa') : ''} detalhes={<p className="text-brand-600 dark:text-brand-400">Resultado de {resumo ? brl(resumo.resultado) : ''}</p>} /></div><Card className="mt-6"><CardHeader title="Evolução dos investimentos" subtitle="Patrimônio investido (a custo) x aportes mensais (últimos 12 meses)" /><div className="px-3 pb-4">{evolucao === null ? <Skeleton className="mx-2 h-[300px]" /> : <LinhaDupla dados={evolucao} />}
        </div></Card></>);
}
