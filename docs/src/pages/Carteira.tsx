import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { Ativo } from '../mocks';
import { brl, fmtDate, pct } from '../lib/format';
import { Badge, Card, CardHeader, Drawer, EmptyState, Input, PageHeader, Select, Skeleton, Td, Th } from '../components/ui';
import { LinhaEvolucao } from '../components/charts';

const tipos = ['Renda Fixa', 'FIIs', 'Ações', 'ETFs', 'Exterior', 'Outros'];
type Ordem = 'valor' | 'rentabilidade' | 'resultado' | 'nome';

export default function Carteira() {
  const [carteira, setCarteira] = useState<Ativo[] | null>(null);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [ordem, setOrdem] = useState<Ordem>('valor');
  const [selecionado, setSelecionado] = useState<Ativo | null>(null);

  useEffect(() =>{ apiService.getCarteira().then(setCarteira); }, []);

  const lista = useMemo(() =>{
    const calc = (carteira ?? []).map((a) =>{
      const investido = a.quantidade * a.precoMedio;
      const atual = a.quantidade * a.precoAtual;
      return { ...a, investido, atual, resultado: atual - investido, rentabilidade: ((atual / investido) - 1) * 100 };
    });
    return calc
      .filter((a) =>(tipoFiltro === 'todos' || a.tipo === tipoFiltro) && (a.ticker.toLowerCase().includes(busca.toLowerCase()) || a.nome.toLowerCase().includes(busca.toLowerCase())))
      .sort((x, y) =>{
        if (ordem === 'nome') return x.nome.localeCompare(y.nome);
        if (ordem === 'rentabilidade') return y.rentabilidade - x.rentabilidade;
        if (ordem === 'resultado') return y.resultado - x.resultado;
        return y.atual - x.atual;
      });
  }, [carteira, busca, tipoFiltro, ordem]);

  const totalAtual = lista.reduce((s, a) =>s + a.atual, 0);
  const totalInvestido = lista.reduce((s, a) =>s + a.investido, 0);

  return (
    <><PageHeader titulo="Carteira" descricao="Distribuição dos seus ativos por classe." /><Card className="mt-6"><CardHeader title="Posição consolidada" subtitle={`Valor atual: ${brl(totalAtual)} · Investido: ${brl(totalInvestido)}`} /><div className="grid grid-cols-2 gap-3 px-5 pb-4 md:grid-cols-4"><Input placeholder="Buscar ativo..." value={busca} onChange={(e) =>setBusca(e.target.value)} aria-label="Buscar ativo" /><Select value={tipoFiltro} onChange={(e) =>setTipoFiltro(e.target.value)} aria-label="Filtrar por tipo"><option value="todos">Todos os tipos</option>{tipos.map((t) =><option key={t}>{t}</option>)}
          </Select><Select value={ordem} onChange={(e) =>setOrdem(e.target.value as Ordem)} aria-label="Ordenar por" className="col-span-2 md:col-span-1"><option value="valor">Ordenar: valor atual</option><option value="rentabilidade">Ordenar: rentabilidade</option><option value="resultado">Ordenar: resultado</option><option value="nome">Ordenar: nome</option></Select></div><div className="overflow-x-auto">{!carteira ? (
            <div className="space-y-2 px-5 pb-5">{[1, 2, 3, 4].map((i) =><Skeleton key={i} className="h-10" />)}</div>) : lista.length === 0 ? (
            <EmptyState titulo="Nenhum ativo encontrado" texto="Ajuste a busca ou os filtros para ver os ativos da carteira." />) : (
            <table className="w-full min-w-[900px]"><thead className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50"><tr><Th>Ativo</Th><Th className="hidden md:table-cell">Tipo</Th><Th className="hidden sm:table-cell">Qtd.</Th><Th className="hidden lg:table-cell">Preço médio</Th><Th className="hidden lg:table-cell">Preço atual</Th><Th className="hidden xl:table-cell">Valor investido</Th><Th>Valor atual</Th><Th>Rentabilidade</Th><Th className="hidden sm:table-cell">Resultado</Th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{lista.map((a) =>(
                  <tr key={a.id} onClick={() =>setSelecionado(a)} className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"><Td><span className="font-semibold">{a.ticker}</span><span className="block text-xs text-neutral-400">{a.nome}</span></Td><Td className="hidden md:table-cell"><Badge tone="blue">{a.tipo}</Badge></Td><Td className="hidden sm:table-cell">{a.quantidade}</Td><Td className="hidden lg:table-cell">{brl(a.precoMedio)}</Td><Td className="hidden lg:table-cell">{brl(a.precoAtual)}</Td><Td className="hidden xl:table-cell">{brl(a.investido)}</Td><Td className="font-semibold">{brl(a.atual)}</Td><Td><Badge tone={a.rentabilidade>= 0 ? 'green' : 'red'}>{pct(a.rentabilidade, 2)}</Badge></Td><Td className="hidden sm:table-cell">{a.resultado>= 0 ? <span className="text-brand-600 dark:text-brand-400">{brl(a.resultado)}</span> : <span className="text-danger">{brl(a.resultado)}</span>}</Td></tr>))}
              </tbody></table>)}
        </div></Card>{/* Detalhes do investimento */}
      <Drawer open={!!selecionado} onClose={() =>setSelecionado(null)} title={selecionado ? `${selecionado.ticker} — detalhes` : ''}>{selecionado && (() =>{
          const investido = selecionado.quantidade * selecionado.precoMedio;
          const atual = selecionado.quantidade * selecionado.precoAtual;
          const res = atual - investido;
          const rent = ((atual / investido) - 1) * 100;
          const hist = selecionado.aportes.map((ap, i) =>({ label: fmtDate(ap.data).slice(3), valor: investido + i * (res / selecionado.aportes.length) }));
          const campos: [string, string, boolean?][] = [
            ['Nome', selecionado.nome], ['Tipo', selecionado.tipo], ['Quantidade', String(selecionado.quantidade)],
            ['Preço médio', brl(selecionado.precoMedio)], ['Preço atual', brl(selecionado.precoAtual)],
            ['Valor investido', brl(investido)], ['Valor atual', brl(atual)],
            ['Lucro/Prejuízo', brl(res), res>= 0], ['Rentabilidade', pct(rent, 2), rent>= 0],
          ];
          return (
            <div className="space-y-5"><div className="grid grid-cols-2 gap-3 text-sm">{campos.map(([k, v, positivo]) =>(
                  <div key={k} className="rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60"><p className="text-xs text-neutral-500">{k}</p><p className={`font-semibold ${k === 'Lucro/Prejuízo' ? (positivo ? 'text-brand-600 dark:text-brand-400' : 'text-danger') : ''}`}>{v}</p></div>))}
              </div><div><h3 className="mb-2 font-semibold">Evolução estimada</h3><LinhaEvolucao dados={hist} /></div><div><h3 className="mb-2 font-semibold">Histórico de aportes</h3><table className="w-full text-sm"><thead><tr className="border-b border-neutral-200 dark:border-neutral-800"><Th>Data</Th><Th>Quantidade</Th><Th>Valor</Th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{selecionado.aportes.map((ap) =>(
                      <tr key={ap.data}><Td>{fmtDate(ap.data)}</Td><Td>{ap.quantidade}</Td><Td>{brl(ap.valor)}</Td></tr>))}
                  </tbody></table></div><p className="text-xs text-neutral-400">Futuramente estes detalhes serão alimentados por: GET /api/investimentos/&#123;id&#125; e GET /api/ativos/&#123;ticker&#125;.
              </p></div>);
        })()}
      </Drawer></>);
}

