import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { Despesa } from '../mocks';
import { brl, fmtDate } from '../lib/format';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Td, Th } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';

const categorias = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde', 'Assinaturas', 'Outros'];
const vazio = { descricao: '', valor: '', data: '', categoria: 'Outros', tipo: 'variavel', status: 'pendente', recorrente: false };

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[] | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [fPeriodo, setFPeriodo] = useState('todas');
  const [fCategoria, setFCategoria] = useState('todas');
  const [fValor, setFValor] = useState('');
  const [fStatus, setFStatus] = useState('todos');

  useEffect(() =>{ apiService.getDespesas().then(setDespesas); }, []);

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const mesAnterior = `${agora.getFullYear()}-${String(agora.getMonth()).padStart(2, '0')}`;

  const lista = useMemo(() =>(despesas ?? []).filter((d) =>{
    if (fCategoria !== 'todas' && d.categoria !== fCategoria) return false;
    if (fStatus !== 'todos' && d.status !== fStatus) return false;
    if (fValor === 'ate500' && d.valor>500) return false;
    if (fValor === '500a1500' && (d.valor <= 500 || d.valor>1500)) return false;
    if (fValor === 'mais1500' && d.valor <= 1500) return false;
    if (fPeriodo === 'atual' && !d.data.startsWith(mesAtual)) return false;
    if (fPeriodo === 'anterior' && !d.data.startsWith(mesAnterior)) return false;
    return true;
  }), [despesas, fPeriodo, fCategoria, fValor, fStatus, mesAtual, mesAnterior]);

  const total = (despesas ?? []).reduce((s, d) =>s + d.valor, 0);
  const anterior = (despesas ?? []).filter((d) =>d.data.startsWith(mesAnterior)).reduce((s, d) =>s + d.valor, 0);
  const atual = (despesas ?? []).filter((d) =>d.data.startsWith(mesAtual)).reduce((s, d) =>s + d.valor, 0);
  const delta = anterior > 0 ? ((atual / anterior) - 1) * 100 : null;
  const maiorCat = categorias
    .map((c) =>({ c, v: (despesas ?? []).filter((d) =>d.categoria === c).reduce((s, d) =>s + d.valor, 0) }))
    .sort((a, b) =>b.v - a.v)[0];
  const fixas = (despesas ?? []).filter((d) =>d.tipo === 'fixa').reduce((s, d) =>s + d.valor, 0);
  const variaveis = total - fixas;
  const recorrentes = (despesas ?? []).filter((d) =>d.recorrente).reduce((s, d) =>s + d.valor, 0);
  const carregando = !despesas;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.data) return;
    setSalvando(true);
    const nova = await apiService.createDespesa({
      descricao: form.descricao, valor: Number(form.valor), data: form.data, categoria: form.categoria,
      tipo: form.tipo as Despesa['tipo'], status: form.status as Despesa['status'], recorrente: form.recorrente,
    });
    setDespesas((d) =>[nova, ...(d ?? [])]);
    setSalvando(false); setModal(false); setForm(vazio);
  }

  async function excluir(id: string) {
    await apiService.deleteDespesa(id);
    setDespesas((d) =>(d ?? []).filter((x) =>x.id !== id));
  }

  return (
    <><PageHeader titulo="Despesas" descricao="Acompanhe e gerencie todos os seus gastos."
        acao={<Button onClick={() =>setModal(true)}>+ Nova despesa</Button>} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard carregando={carregando} titulo="Total gasto" valor={brl(total)} detalhes={delta !== null ? <p className={`${delta <= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-danger'}`}>{delta <= 0 ? '▼' : '▲'} {Math.abs(delta).toFixed(1).replace('.', ',')}% vs. mês anterior</p> : undefined} /><StatCard carregando={carregando} titulo="Despesas fixas" valor={brl(fixas)} /><StatCard carregando={carregando} titulo="Despesas variáveis" valor={brl(variaveis)} detalhes={<p>Recorrentes: {brl(recorrentes)}</p>} /><StatCard carregando={carregando} titulo="Maior categoria" valor={maiorCat?.c ?? '—'} detalhes={<p>{brl(maiorCat?.v ?? 0)}</p>} /></div><Card className="mt-6"><CardHeader title="Despesas" subtitle={`${lista.length} resultado(s)`} />{/* Filtros */}
        <div className="grid grid-cols-1 gap-3 px-5 pb-4 sm:grid-cols-2 lg:grid-cols-4"><Select aria-label="Período" value={fPeriodo} onChange={(e) =>setFPeriodo(e.target.value)}><option value="todas">Todo período</option><option value="atual">Mês atual</option><option value="anterior">Mês anterior</option></Select><Select aria-label="Categoria" value={fCategoria} onChange={(e) =>setFCategoria(e.target.value)}><option value="todas">Todas as categorias</option>{categorias.map((c) =><option key={c}>{c}</option>)}
          </Select><Select aria-label="Valor" value={fValor} onChange={(e) =>setFValor(e.target.value)}><option value="">Qualquer valor</option><option value="ate500">Até R$ 500</option><option value="500a1500">R$ 500 – 1.500</option><option value="mais1500">Acima de R$ 1.500</option></Select><Select aria-label="Status" value={fStatus} onChange={(e) =>setFStatus(e.target.value)}><option value="todos">Todos os status</option><option value="paga">Pagas</option><option value="pendente">Pendentes</option></Select></div><div className="overflow-x-auto">{!despesas ? (
            <div className="space-y-2 px-5 pb-5">{[1, 2, 3, 4].map((i) =><Skeleton key={i} className="h-10" />)}</div>) : lista.length === 0 ? (
            <EmptyState titulo="Nada encontrado" texto="Nenhuma despesa corresponde aos filtros selecionados." acao={<Button variant="secondary" onClick={() =>{ setFPeriodo('todas'); setFCategoria('todas'); setFValor(''); setFStatus('todos'); }}>Limpar filtros</Button>} />) : (
            <table className="w-full min-w-[720px]"><thead className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50"><tr><Th>Descrição</Th><Th className="hidden md:table-cell">Categoria</Th><Th>Valor</Th><Th className="hidden sm:table-cell">Data</Th><Th>Status</Th><Th>Ações</Th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{lista.map((d) =>(
                  <tr key={d.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"><Td className="font-medium">{d.descricao}{d.recorrente && <span className="ml-2 text-xs text-neutral-400">↻</span>}</Td><Td className="hidden md:table-cell"><Badge>{d.categoria}</Badge></Td><Td className="font-semibold">{brl(d.valor)}</Td><Td className="hidden sm:table-cell">{fmtDate(d.data)}</Td><Td><Badge tone={d.status === 'paga' ? 'green' : 'amber'}>{d.status === 'paga' ? 'Paga' : 'Pendente'}</Badge></Td><Td><Button variant="ghost" className="!px-2 !py-1 text-xs text-danger" onClick={() =>excluir(d.id)}>Excluir</Button></Td></tr>))}
              </tbody></table>)}
        </div></Card><Modal open={modal} onClose={() =>setModal(false)} title="Nova despesa"><form onSubmit={salvar} className="space-y-4"><Field label="Descrição"><Input value={form.descricao} onChange={(e) =>setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Supermercado" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Valor (R$)"><Input type="number" step="0.01" min="0" value={form.valor} onChange={(e) =>setForm({ ...form, valor: e.target.value })} /></Field><Field label="Data"><Input type="date" value={form.data} onChange={(e) =>setForm({ ...form, data: e.target.value })} /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Categoria"><Select value={form.categoria} onChange={(e) =>setForm({ ...form, categoria: e.target.value })}>{categorias.map((c) =><option key={c}>{c}</option>)}
              </Select></Field><Field label="Tipo"><Select value={form.tipo} onChange={(e) =>setForm({ ...form, tipo: e.target.value })}><option value="fixa">Fixa</option><option value="variavel">Variável</option></Select></Field></div><Field label="Status"><Select value={form.status} onChange={(e) =>setForm({ ...form, status: e.target.value })}><option value="pendente">Pendente</option><option value="paga">Paga</option></Select></Field><label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300"><input type="checkbox" checked={form.recorrente} onChange={(e) =>setForm({ ...form, recorrente: e.target.checked })} className="h-4 w-4 accent-brand-600" />Despesa recorrente
          </label><Button type="submit" full loading={salvando}>Salvar despesa</Button></form></Modal></>);
}


