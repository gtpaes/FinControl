import { FormEvent, useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Meta } from '../mocks';
import { brl, fmtDate } from '../lib/format';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import { StatCard } from '../components/ui/StatCard';

const cores: Record<string, string>= { brand: '#10b981', blue: '#3b82f6', violet: '#8b5cf6' };

const vazio = { nome: '', objetivo: '', atual: '', prazo: '' };

export default function Metas() {
  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  useEffect(() =>{ apiService.getMetas().then(setMetas); }, []);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.objetivo || !form.prazo) return;
    setSalvando(true);
    const nova = await apiService.createMeta({
      nome: form.nome, objetivo: Number(form.objetivo), atual: Number(form.atual || 0),
      prazo: form.prazo, cor: 'blue',
    });
    setMetas((m) =>[...(m ?? []), nova]);
    setSalvando(false); setModal(false); setForm(vazio);
  }

  /** Valor mensal necessário até o prazo (aporte simples, sem juros). */
  function aporteMensal(m: Meta) {
    const meses = Math.max(1, Math.round((new Date(m.prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)));
    return (m.objetivo - m.atual) / meses;
  }

  const totalObjetivo = (metas ?? []).reduce((s, m) =>s + m.objetivo, 0);
  const totalAtual = (metas ?? []).reduce((s, m) =>s + m.atual, 0);

  return (
    <><PageHeader titulo="Metas" descricao="Objetivos financeiros e progresso de cada um."
        acao={<Button onClick={() =>setModal(true)}>+ Nova meta</Button>} /><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard carregando={!metas} titulo="Metas ativas" valor={String(metas?.length ?? 0)} /><StatCard carregando={!metas} titulo="Valor total dos objetivos" valor={brl(totalObjetivo)} /><StatCard carregando={!metas} titulo="Progresso geral" valor={`${Math.round((totalAtual / (totalObjetivo || 1)) * 100)}%`} rodape={<ProgressBar value={totalAtual} max={totalObjetivo} />} /></div><div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{!metas
          ? [1, 2, 3].map((i) =><Skeleton key={i} className="h-56" />)
          : metas.map((m) =>{
              const perc = Math.round((m.atual / m.objetivo) * 100);
              return (
                <Card key={m.id} className="p-5"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{m.nome}</h3><Badge tone={perc>= 100 ? 'green' : 'neutral'}>{perc}%</Badge></div><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{brl(m.atual)} de {brl(m.objetivo)} · prazo {fmtDate(m.prazo)}
                  </p><div className="mt-3"><ProgressBar value={Math.min(m.atual, m.objetivo)} max={m.objetivo} tone={perc>= 100 ? 'green' : 'amber'} /></div><p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Aporte mensal necessário: <strong className="text-neutral-800 dark:text-neutral-200">{brl(aporteMensal(m))}</strong></p>{perc>= 100 && <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">Meta atingida</p>}
                </Card>);
            })}
        {metas?.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3"><EmptyState titulo="Nenhuma meta" texto="Defina seus objetivos financeiros: reserva de emergência, viagens, imóvel e mais." acao={<Button onClick={() =>setModal(true)}>+ Nova meta</Button>} /></Card>)}
      </div><Modal open={modal} onClose={() =>setModal(false)} title="Nova meta"><form onSubmit={salvar} className="space-y-4"><Field label="Nome do objetivo"><Input value={form.nome} onChange={(e) =>setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Reserva de emergência" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Valor objetivo (R$)"><Input type="number" min="0" value={form.objetivo} onChange={(e) =>setForm({ ...form, objetivo: e.target.value })} /></Field><Field label="Valor atual (R$)"><Input type="number" min="0" value={form.atual} onChange={(e) =>setForm({ ...form, atual: e.target.value })} /></Field></div><Field label="Prazo"><Input type="date" value={form.prazo} onChange={(e) =>setForm({ ...form, prazo: e.target.value })} /></Field><Button type="submit" full loading={salvando}>Criar meta</Button></form></Modal></>);
}
