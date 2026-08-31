import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import type { DashboardSummary } from '../types';
import { brl, pct } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';
import { LinhaEvolucao, PizzaCategorias } from '../components/charts';

type Periodo = '6m' | '1a' | '5a' | 'max';
const periodos: { chave: Periodo; rotulo: string }[] = [
  { chave: '6m', rotulo: '6 meses' }, { chave: '1a', rotulo: '1 ano' },
  { chave: '5a', rotulo: '5 anos' }, { chave: 'max', rotulo: 'Máximo' },
];

const RESUMO_VAZIO: DashboardSummary = {
  mes: '', salarioLiquido: 0, rendaExtra: 0, rendaTotal: 0, despesasMes: 0,
  despesasMesAnterior: 0, investidoMes: 0, metaInvestimento: 0, patrimonioAtual: 0,
  variacaoPatrimonial: 0, saldoDisponivel: 0,
};

export default function Dashboard() {
  const { nome } = useAuth();
  const primeiroNome = nome.split(' ')[0];
  const [resumo, setResumo] = useState<DashboardSummary | null>(null);
  const [evolucao, setEvolucao] = useState<{ label: string; valor: number }[]>([]);
  const [categorias, setCategorias] = useState<{ categoria: string; valor: number }[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('6m');

  useEffect(() => { apiService.getResumoMensal().then(setResumo).catch(() => setResumo(RESUMO_VAZIO)); }, []);
  useEffect(() => { setEvolucao([]); apiService.getEvolucaoPatrimonial(periodo).then(setEvolucao).catch(() => setEvolucao([])); }, [periodo]);
  useEffect(() => { apiService.getDespesasPorCategoria().then(setCategorias).catch(() => setCategorias([])); }, []);

  const carregando = !resumo;
  const num = (v: number | undefined) => v ?? 0;
  const despesasMes = num(resumo?.despesasMes);
  const despesasAnterior = num(resumo?.despesasMesAnterior);
  const investidoMes = num(resumo?.investidoMes);
  const metaInvest = num(resumo?.metaInvestimento);
  const rendaTotal = num(resumo?.rendaTotal);
  const saldoDisponivel = num(resumo?.saldoDisponivel);

  const deltaDespesas = despesasAnterior > 0 ? ((despesasMes / despesasAnterior) - 1) * 100 : null;

  const fluxo = [
    { titulo: 'Renda', valor: rendaTotal, cor: 'border-brand-400' },
    { titulo: '− Despesas', valor: despesasMes, cor: 'border-red-400' },
    { titulo: '− Investimentos', valor: investidoMes, cor: 'border-blue-400' },
    { titulo: '= Saldo disponível', valor: saldoDisponivel, cor: 'border-neutral-300 dark:border-neutral-700' },
  ];

  return (
    <><PageHeader titulo="Olá" descricao="Aqui está o resumo das suas finanças no mês atual." />{/* Cards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard
          carregando={carregando} titulo="Salário"
          valor={resumo && brl(rendaTotal)}
          detalhes={resumo && (<><p>Salário líquido: {brl(num(resumo.salarioLiquido))}</p><p>Renda extra: {brl(num(resumo.rendaExtra))}</p></>)}
        /><StatCard
          carregando={carregando} titulo="Despesas"
          valor={resumo && brl(despesasMes)}
          detalhes={resumo && deltaDespesas !== null ? (
            <p className={deltaDespesas <= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger'}>{deltaDespesas <= 0 ? '▼' : '▲'} {Math.abs(deltaDespesas).toFixed(1).replace('.', ',')}% vs. mês anterior
            </p>) : undefined}
        /><StatCard
          carregando={carregando} titulo="Investimentos"
          valor={resumo && brl(investidoMes)}
          detalhes={resumo && <p>Meta: {brl(metaInvest)}</p>}
          rodape={<ProgressBar value={investidoMes} max={metaInvest || 1} tone="green" />}
        /><StatCard
          carregando={carregando} titulo="Patrimônio"
          valor={resumo && brl(num(resumo.patrimonioAtual))}
          detalhes={resumo && <p className="text-brand-600 dark:text-brand-400">+{brl(num(resumo.variacaoPatrimonial))} este mês</p>}
        /></div>{/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5"><Card className="xl:col-span-3"><CardHeader title="Evolução patrimonial" subtitle="Valor total do patrimônio no período" /><div className="flex flex-wrap gap-1.5 px-5 pb-2">{periodos.map((p) => (
              <button key={p.chave} onClick={() => setPeriodo(p.chave)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${periodo === p.chave ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'}`}>{p.rotulo}
              </button>))}
          </div><div className="px-3 pb-4">{evolucao.length === 0 ? <Skeleton className="mx-2 h-[280px]" /> : <LinhaEvolucao dados={evolucao} />}
          </div></Card><Card className="xl:col-span-2"><CardHeader title="Despesas por categoria" subtitle="Mês atual" /><div className="px-3 pb-4">{categorias.length === 0 ? <Skeleton className="mx-2 h-[300px]" /> : <PizzaCategorias dados={categorias} />}
          </div></Card></div>{/* Fluxo financeiro */}
      <Card className="mt-6 p-5"><h3 className="font-semibold">Fluxo financeiro do mês</h3><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">{fluxo.map((p) => (
            <div key={p.titulo} className={`rounded-xl border-l-4 ${p.cor} bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60`}><p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{p.titulo}</p><p className="mt-1 text-lg font-bold">{brl(p.valor)}</p></div>))}
        </div>{rendaTotal > 0 && (
          <p className="mt-3 text-xs text-neutral-400">Taxa de investimento: {pct((investidoMes / rendaTotal) * 100, 0).replace('+', '')} da renda · Saldo livre pode ser alocado em metas ou investimentos.
          </p>)}
      </Card></>);
}
