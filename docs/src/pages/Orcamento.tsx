import { FormEvent, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { brl } from '../lib/format';
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, ProgressBar, Select, Skeleton } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';

type Orc = { id: string; categoria: string; limite: number; gasto: number };

const categorias = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Contas', 'Outros'];

export default function Orcamento() {
  const [orcamentos, setOrcamentos] = useState<Orc[] | null>(null);
  const [modal, setModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ categoria: 'Moradia', limite: '' });

  useEffect(() => {
    (async () => {
      const [orcs, cats] = await Promise.all([apiService.getOrcamentos(), apiService.getDespesasPorCategoria()]);
      setOrcamentos(orcs.map((o) => ({ ...o, gasto: cats.find((c) => c.categoria === o.categoria)?.valor ?? 0 })));
    })();
  }, []);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.limite) return;
    setSalvando(true);
    const nova = await apiService.createOrcamento({ categoria: form.categoria, limite: Number(form.limite) });
    setOrcamentos((m) => [...(m ?? []), { ...nova, gasto: 0 }]);
    setSalvando(false); setModal(false); setForm({ categoria: 'Moradia', limite: '' });
  }

  async function excluir(id: string) {
    await apiService.deleteOrcamento(id);
    setOrcamentos((m) => (m ?? []).filter((o) => o.id !== id));
  }

  const ultrapassados = (orcamentos ?? []).filter((o) => o.gasto > o.limite).length;
  const proximos = (orcamentos ?? []).filter((o) => o.gasto <= o.limite && o.limite > 0 && o.gasto / o.limite >= 0.85).length;
  const totalLimite = (orcamentos ?? []).reduce((s, o) => s + o.limite, 0);
  const totalGasto = (orcamentos ?? []).reduce((s, o) => s + o.gasto, 0);

  return (
    <><PageHeader titulo="Orçamento" descricao="Limites mensais por categoria e alertas de consumo."
        acao={<Button onClick={() => setModal(true)}>+ Novo orçamento</Button>} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard carregando={!orcamentos} titulo="Orçamento total" valor={brl(totalLimite)} /><StatCard carregando={!orcamentos} titulo="Gasto do mês" valor={brl(totalGasto)} rodape={<ProgressBar value={totalGasto} max={totalLimite} />} /><StatCard carregando={!orcamentos} titulo="Alertas" valor={`${ultrapassados + proximos} categoria(s)`} detalhes={<p>{ultrapassados} ultrapassada(s) · {proximos} próxima(s) do limite</p>} /></div>{(ultrapassados > 0 || proximos > 0) && (
          <div className="mt-4 space-y-2">{ultrapassados > 0 && <Alert tone="erro" title="Orçamento ultrapassado">Você ultrapassou o limite em {ultrapassados} categoria(s) este mês. Revise os gastos para evitar desequilíbrios.</Alert>}
            {proximos > 0 && <Alert tone="alerta" title="Atenção ao limite">{proximos} categoria(s) estão próximas do limite mensal (acima de 85% de uso).</Alert>}
          </div>)}

      <Card className="mt-6"><CardHeader title="Limites por categoria" subtitle="Consumo do mês atual" /><div className="space-y-5 px-5 pb-6">{!orcamentos
            ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)
            : orcamentos.map((o) => {
                const perc = Math.round((o.gasto / o.limite) * 100);
                const estourou = o.gasto > o.limite;
                return (
                  <div key={o.id}><div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{o.categoria}</span><span className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">{brl(o.gasto)} / {brl(o.limite)}
                        {estourou ? <Badge tone="red">+{perc - 100}%</Badge> : perc >= 85 ? <Badge tone="amber">{perc}%</Badge> : <Badge tone="green">{perc}%</Badge>}
                        <button onClick={() => excluir(o.id)} aria-label={`Excluir orçamento de ${o.categoria}`} className="ml-1 text-xs text-neutral-400 hover:text-danger focus-visible:ring-2 focus-visible:ring-danger rounded">excluir</button>
                      </span></div><ProgressBar value={Math.min(o.gasto, o.limite)} max={o.limite} />{estourou && <p className="mt-1 text-xs text-danger">Excedido em {brl(o.gasto - o.limite)}</p>}
                  </div>);
              })}
        {orcamentos?.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Você ainda não possui orçamentos cadastrados. Clique em “+ Novo orçamento” para definir um limite.
          </p>)}
        </div></Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo orçamento"><form onSubmit={salvar} className="space-y-4"><Field label="Categoria"><Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{categorias.map((c) => <option key={c}>{c}</option>)}</Select></Field><Field label="Limite mensal (R$)"><Input type="number" min="0" step="0.01" value={form.limite} onChange={(e) => setForm({ ...form, limite: e.target.value })} /></Field><Button type="submit" full loading={salvando}>Criar orçamento</Button></form></Modal></>
  );
}

