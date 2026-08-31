import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/apiService';
import { Receita } from '../mocks';
import { brl, fmtDate } from '../lib/format';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Td, Th } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';

const catRotulo: Record<string, string>= { salario: 'Salário', extra: 'Renda extra', bonus: 'Bônus', freelance: 'Freelance', outras: 'Outras' };
const recRotulo: Record<string, string>= { unica: 'Única', mensal: 'Mensal', anual: 'Anual' };
const vazio = { descricao: '', valor: '', data: '', categoria: 'extra', recorrencia: 'unica' };

export default function MeuDinheiro() {
  const [receitas, setReceitas] = useState<Receita[] | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() =>{ apiService.getReceitas().then(setReceitas); }, []);

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const totalMes = useMemo(() => (receitas ?? []).filter((r) => r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0), [receitas, mesAtual]);
  const salarioMes = useMemo(() => (receitas ?? []).filter((r) => r.categoria === 'salario' && r.data.startsWith(mesAtual)).reduce((s, r) => s + r.valor, 0), [receitas, mesAtual]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.descricao.trim() || !form.valor || !form.data) { setErro('Preencha descrição, valor e data.'); return; }
    setSalvando(true);
    const nova = await apiService.createReceita({ descricao: form.descricao, valor: Number(form.valor), data: form.data, categoria: form.categoria as Receita['categoria'], recorrencia: form.recorrencia as Receita['recorrencia'] });
    setReceitas((r) =>[nova, ...(r ?? [])]);
    setSalvando(false); setModal(false); setForm(vazio); setErro('');
  }

  return (
    <><PageHeader titulo="Meu Dinheiro" descricao="Receitas: salário, renda extra, bônus e freelance."
        acao={<Button onClick={() =>setModal(true)}>+ Nova receita</Button>} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard carregando={!receitas} titulo="Receitas do mês" valor={brl(totalMes)} /><StatCard carregando={!receitas} titulo="Salário do mês" valor={brl(salarioMes)} /></div><Card className="mt-6 overflow-x-auto"><CardHeader title="Histórico de receitas" subtitle="Todas as receitas cadastradas" />{!receitas ? (
          <div className="space-y-2 px-5 pb-5">{[1, 2, 3].map((i) =><Skeleton key={i} className="h-10" />)}</div>) : receitas.length === 0 ? (
          <EmptyState titulo="Nenhuma receita" texto="Cadastre sua primeira receita para acompanhar suas entradas." acao={<Button onClick={() =>setModal(true)}>+ Nova receita</Button>} />) : (
          <table className="w-full min-w-[640px]"><thead className="border-y border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50"><tr><Th>Descrição</Th><Th className="hidden md:table-cell">Categoria</Th><Th>Valor</Th><Th className="hidden sm:table-cell">Data</Th><Th className="hidden sm:table-cell">Recorrência</Th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">{receitas.map((r) =>(
                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"><Td className="font-medium">{r.descricao}</Td><Td className="hidden md:table-cell"><Badge tone={r.categoria === 'salario' ? 'green' : 'neutral'}>{catRotulo[r.categoria]}</Badge></Td><Td className="font-semibold text-brand-600 dark:text-brand-400">{brl(r.valor)}</Td><Td className="hidden sm:table-cell">{fmtDate(r.data)}</Td><Td className="hidden sm:table-cell">{recRotulo[r.recorrencia] ?? r.recorrencia}</Td></tr>))}
            </tbody></table>)}
      </Card><Modal open={modal} onClose={() =>setModal(false)} title="Nova receita"><form onSubmit={salvar} className="space-y-4"><Field label="Descrição"><Input value={form.descricao} onChange={(e) =>setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Salário líquido" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Valor (R$)"><Input type="number" step="0.01" min="0" value={form.valor} onChange={(e) =>setForm({ ...form, valor: e.target.value })} /></Field><Field label="Data"><Input type="date" value={form.data} onChange={(e) =>setForm({ ...form, data: e.target.value })} /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Categoria"><Select value={form.categoria} onChange={(e) =>setForm({ ...form, categoria: e.target.value })}>{Object.entries(catRotulo).map(([k, v]) =><option key={k} value={k}>{v}</option>)}
              </Select></Field><Field label="Recorrência"><Select value={form.recorrencia} onChange={(e) =>setForm({ ...form, recorrencia: e.target.value })}><option value="unica">Única</option><option value="mensal">Mensal</option><option value="anual">Anual</option></Select></Field></div>{erro && <p className="text-sm text-danger">{erro}</p>}
          <Button type="submit" full loading={salvando}>Salvar receita</Button></form></Modal></>);
}
