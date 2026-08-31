import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import type { Patrimonio } from '../types';
import { brl } from '../lib/format';
import { Card, CardHeader, PageHeader, Skeleton } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';
import { LinhaEvolucao } from '../components/charts';

export default function Patrimonio() {
  const [p, setP] = useState<Patrimonio | null>(null);
  useEffect(() =>{ apiService.getPatrimonio().then(setP); }, []);

  return (
    <><PageHeader titulo="Patrimônio" descricao="Visão consolidada de ativos, passivos e patrimônio líquido." /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard carregando={!p} titulo="Patrimônio total (bruto)" valor={p && brl(p.investimentos + p.dinheiroDisponivel + p.outrosAtivos)} /><StatCard carregando={!p} titulo="Dívidas" valor={p && brl(p.dividas)} detalhes={<p className="text-danger">Passivo</p>} /><StatCard carregando={!p} titulo="Patrimônio líquido" valor={p && brl(p.liquido)} detalhes={<p className="text-brand-600 dark:text-brand-400">Ativos − Passivos</p>} /><StatCard carregando={!p} titulo="Investimentos" valor={p && brl(p.investimentos)} detalhes={<p>{p && `${Math.round((p.investimentos / (p.investimentos + p.dinheiroDisponivel + p.outrosAtivos)) * 100)}% dos ativos`}</p>} /></div>{/* Fórmula visual */}
      <Card className="mt-6 p-5">
        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
          <div className="rounded-xl bg-brand-50 px-4 py-4 dark:bg-brand-900/30">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-300">Ativos</p>
            <p className="mt-1 text-xl font-bold">{p ? brl(p.investimentos + p.dinheiroDisponivel + p.outrosAtivos) : '—'}</p>
            {p && <p className="mt-1 text-xs text-neutral-500">Investimentos · Dinheiro · Outros</p>}
          </div>
          <div className="rounded-xl bg-red-50 px-4 py-4 dark:bg-red-900/30">
            <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Passivos (dívidas)</p>
            <p className="mt-1 text-xl font-bold">{p ? brl(p.dividas) : '—'}</p>
          </div>
          <div className="rounded-xl border-2 border-brand-500 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700 dark:text-brand-300">Patrimônio líquido</p>
            <p className="mt-1 text-xl font-bold">{p ? brl(p.liquido) : '—'}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-neutral-400">Ativos − Passivos = Patrimônio líquido</p>
      </Card>
<Card className="mt-6"><CardHeader title="Histórico patrimonial" subtitle="Ativos e dívidas nos últimos 8 meses" /><div className="px-3 pb-4">{!p ? <Skeleton className="mx-2 h-[280px]" />: <LinhaEvolucao dados={p.historico.map((h) =>({ label: h.mes, valor: h.ativos - h.dividas }))} />}
        </div></Card></>);
}
