import { useMemo, useState } from 'react';
import { brl, brlCompact } from '../lib/format';
import { Alert, Card, Field, Input, PageHeader, ProgressBar } from '../components/ui';
import { BarrasAportesRendimentos } from '../components/charts';

const cenarios = {
  conservador: { rotulo: 'Conservador', rent: 6, infl: 4.5 },
  moderado: { rotulo: 'Moderado', rent: 8, infl: 4 },
  otimista: { rotulo: 'Otimista', rent: 11, infl: 3.5 },
};
type Cen = keyof typeof cenarios;

export default function Simulador() {
  const [salario, setSalario] = useState(13000);
  const [aporte, setAporte] = useState(1950);
  const [anos, setAnos] = useState(10);
  const [cen, setCen] = useState<Cen>('moderado');
  const c = cenarios[cen];

  const { totalAportado, patrimoniod, rendimento, corrigido, serie } = useMemo(() =>{
    const i = c.rent / 100 / 12;
    const n = anos * 12;
    let pat = 0;
    const serie: { label: string; aportes: number; rendimentos: number }[] = [];
    const passo = Math.max(1, Math.floor(n / 40));
    for (let m = 1; m <= n; m++) {
      pat = pat * (1 + i) + aporte;
      if (m % passo === 0 || m === n) {
        const aportado = aporte * m;
        serie.push({ label: `${Math.round(m / 12)}a`, aportes: Math.round(aportado), rendimentos: Math.round(pat - aportado) });
      }
    }
    const totalAportado = aporte * n;
    const deflator = 1 / Math.pow(1 + c.infl / 100, anos);
    return { totalAportado, patrimoniod: pat, rendimento: pat - totalAportado, corrigido: pat * deflator, serie };
  }, [aporte, anos, c]);

  // Calculadora: quanto devo investir?
  const [despesas, setDespesas] = useState(7000);
  const [percentual, setPercentual] = useState(15);
  const [investido, setInvestido] = useState(1400);
  const meta = ((salario - despesas) * percentual) / 100;
  const faltam = Math.max(0, meta - investido);

  return (
    <><PageHeader titulo="Simulador" descricao="Projete seu patrimônio futuro e descubra quanto investir." /><div className="grid grid-cols-1 gap-4 xl:grid-cols-5"><Card className="xl:col-span-2 p-5"><h3 className="font-semibold">Parâmetros da simulação</h3><div className="mt-4 space-y-4"><Field label="Salário mensal (R$)"><Input type="number" min="0" value={salario} onChange={(e) =>setSalario(Number(e.target.value))} /></Field><Field label="Aporte mensal (R$)"><Input type="number" min="0" value={aporte} onChange={(e) =>setAporte(Number(e.target.value))} /></Field><Field label="Prazo (anos)"><Input type="number" min="1" max="50" value={anos} onChange={(e) =>setAnos(Math.max(1, Number(e.target.value)))} /></Field><Field label="Cenário"><div className="grid grid-cols-3 gap-2">{(Object.keys(cenarios) as Cen[]).map((k) =>(
                  <button key={k} onClick={() =>setCen(k)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      cen === k ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
                    }`}>{cenarios[k].rotulo}<span className="block text-[10px] opacity-70">{cenarios[k].rent}% a.a.</span></button>))}
              </div></Field><p className="text-sm text-neutral-500 dark:text-neutral-400">Inflação estimada do cenário: {c.infl}% a.a.</p></div></Card><Card className="xl:col-span-3 p-5"><h3 className="font-semibold">Resultado da projeção</h3><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{[
              ['Total aportado', brl(totalAportado)],
              ['Patrimônio projetado', brl(patrimoniod)],
              ['Rendimento acumulado', brl(rendimento)],
              ['Corrigido pela inflação', brl(corrigido)],
            ].map(([k, v], idx) =>(
              <div key={k} className={`rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60 ${idx === 1 ? 'ring-2 ring-brand-500' : ''}`}><p className="text-xs text-neutral-500 dark:text-neutral-400">{k}</p><p className="mt-0.5 text-lg font-bold">{v}</p></div>))}
</div>
          <div className="mt-5"><p className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">Composição projetada: aportes × rendimentos</p><BarrasAportesRendimentos dados={serie} /></div><div className="mt-3"><Alert tone="alerta">Simulação hipotética. Rentabilidade futura não é garantida.</Alert></div></Card></div>{/* Calculadora: quanto devo investir? */}
      <Card className="mt-6 p-5"><h3 className="font-semibold">Quanto devo investir?</h3><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Compare quanto você investe com uma meta baseada na sua renda livre.</p><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Salário líquido (R$)"><Input type="number" value={salario} onChange={(e) =>setSalario(Number(e.target.value))} /></Field><Field label="Despesas (R$)"><Input type="number" value={despesas} onChange={(e) =>setDespesas(Number(e.target.value))} /></Field><Field label="Percentual desejado (%)"><Input type="number" min="0" max="100" value={percentual} onChange={(e) =>setPercentual(Number(e.target.value))} /></Field><Field label="Investido no mês (R$)"><Input type="number" value={investido} onChange={(e) =>setInvestido(Number(e.target.value))} /></Field></div><div className="mt-5 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/60"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>Meta de investimento: <strong>{brl(meta)}</strong></span><span>Investido: <strong>{brl(investido)}</strong></span><span className={faltam>0 ? 'text-danger font-medium' : 'text-brand-600 dark:text-brand-400 font-medium'}>{faltam>0 ? `Faltam ${brl(faltam)}` : 'Meta atingida! ✓'}
            </span></div><div className="mt-3"><ProgressBar value={Math.min(investido, meta)} max={meta} tone={investido>= meta ? 'green' : 'amber'} /></div><p className="mt-2 text-xs text-neutral-400">Cálculo: (salário líquido − despesas) × percentual desejado = {brlCompact(salario - despesas)} × {percentual}%
          </p></div></Card></>);
}

