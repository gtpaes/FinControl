import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { brl } from '../lib/format';
import { Alert, Button, Card, CardHeader, PageHeader, Select, Skeleton, Td, Th } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';
import { BarrasComparativas } from '../components/charts';
import { useToast } from '../context/ToastContext';

const periodos = [
  { v: 'mes', r: 'Mês atual' }, { v: 'trimestre', r: 'Trimestre' },
  { v: 'semestre', r: 'Semestre' }, { v: 'ano', r: 'Ano' },
];

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('semestre');
  const [dados, setDados] = useState<{ label: string; receitas: number; despesas: number; aportes: number }[] | null>(null);
  const { toast } = useToast();

  useEffect(() =>{ setDados(null); apiService.getRelatorios(periodo).then(setDados); }, [periodo]);

  const tot = (k: 'receitas' | 'despesas' | 'aportes') =>(dados ?? []).reduce((s, d) =>s + d[k], 0);

  /** Exporta o relatório atual como CSV — gera o arquivo a partir dos dados reais carregados da API. */
  function exportarCsv() {
    if (!dados || dados.length === 0) {
      toast('Não há dados para exportar neste período.', 'info');
      return;
    }
    const linhas = [
      'Periodo;Receitas;Despesas;Aportes;Saldo',
      ...dados.map((d) => [d.label, d.receitas.toFixed(2), d.despesas.toFixed(2), d.aportes.toFixed(2), (d.receitas - d.despesas).toFixed(2)].join(';')),
    ].join('\n');
    const blob = new Blob(['\ufeff' + linhas], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fincontrol-relatorio-${periodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Relatório exportado como CSV.');
  }

  return (
    <><PageHeader titulo="Relatórios" descricao="Resumos de receitas, despesas, investimentos, patrimônio, aportes e metas."
        acao={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Select value={periodo} onChange={(e) =>setPeriodo(e.target.value)} aria-label="Período do relatório" className="w-full sm:w-40">{periodos.map((p) =><option key={p.v} value={p.v}>{p.r}</option>)}
            </Select><Button onClick={exportarCsv} disabled={!dados}>Exportar relatório</Button></div>} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard carregando={!dados} titulo="Receitas" valor={brl(tot('receitas'))} /><StatCard carregando={!dados} titulo="Despesas" valor={brl(tot('despesas'))} /><StatCard carregando={!dados} titulo="Aportes" valor={brl(tot('aportes'))} detalhes={<p>Saldo do período: {brl(tot('receitas') - tot('despesas'))}</p>} /></div><Card className="mt-6"><CardHeader title="Receitas × Despesas" subtitle={periodos.find((p) =>p.v === periodo)?.r} /><div className="px-3 pb-4">{!dados ? <Skeleton className="mx-2 h-[300px]" />: <BarrasComparativas dados={dados} series={[{ key: 'receitas', nome: 'Receitas', cor: '#10b981' }, { key: 'despesas', nome: 'Despesas', cor: '#ef4444' }]} />}
        </div></Card><Card className="mt-6 overflow-x-auto"><CardHeader title="Detalhamento" /><table className="w-full min-w-[560px]"><thead className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50"><tr><Th>Período</Th><Th>Receitas</Th><Th>Despesas</Th><Th>Aportes</Th><Th>Saldo</Th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{(dados ?? []).map((d) =>(
              <tr key={d.label}><Td className="font-medium">{d.label}</Td><Td className="text-brand-600 dark:text-brand-400">{brl(d.receitas)}</Td><Td className="text-danger">{brl(d.despesas)}</Td><Td>{brl(d.aportes)}</Td><Td className="font-semibold">{brl(d.receitas - d.despesas)}</Td></tr>))}
          </tbody></table></Card><div className="mt-4"><Alert tone="info">A exportação gera um arquivo CSV com os dados do período selecionado, diretamente no seu navegador.</Alert></div></>);
}
