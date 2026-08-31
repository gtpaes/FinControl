import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/apiService';
import { Card, PageHeader } from '../components/ui';

interface Msg { de: 'usuario' | 'assistente'; texto: string }

const sugestoes = ['Analise minhas despesas', 'Analise meus investimentos', 'Como está meu patrimônio?', 'Estou cumprindo minhas metas?', 'Faça uma projeção'];

export default function Assistente() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { de: 'assistente', texto: 'Olá! Sou o assistente financeiro do FinControl. Posso analisar suas despesas, investimentos, patrimônio e metas com base nos dados cadastrados. Como posso ajudar?' },
  ]);
  const [entrada, setEntrada] = useState('');
  const [pensando, setPensando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() =>{ fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, pensando]);

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || pensando) return;
    setMsgs((m) =>[...m, { de: 'usuario', texto: t }]);
    setEntrada('');
    setPensando(true);
    const resposta = await apiService.sendAssistantMessage(t);
    setMsgs((m) =>[...m, { de: 'assistente', texto: resposta }]);
    setPensando(false);
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); enviar(entrada); }

  return (
    <><PageHeader titulo="Assistente Financeiro" descricao="Respostas baseadas nos seus dados reais cadastrados." /><Card className="flex h-[65vh] min-h-[420px] flex-col"><div className="flex-1 space-y-4 overflow-y-auto p-5">{msgs.map((m, i) =>(
            <div key={i} className={`flex ${m.de === 'usuario' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.de === 'usuario'
                  ? 'rounded-br-md bg-brand-600 text-white'
                  : 'rounded-bl-md bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100'
              }`}>{m.texto}
              </div></div>))}
          {pensando && (
            <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800" aria-label="Assistente digitando"><span className="inline-flex gap-1">{[0, 1, 2].map((i) =><span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: `${i * 120}ms` }} />)}
                </span></div></div>)}
          <div ref={fimRef} /></div><div className="border-t border-neutral-200 p-4 dark:border-neutral-800"><div className="mb-3 flex flex-wrap gap-2">{sugestoes.map((s) =>(
              <button key={s} onClick={() =>enviar(s)} disabled={pensando}
                className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">{s}
              </button>))}
          </div><form onSubmit={onSubmit} className="flex gap-2"><input
              value={entrada} onChange={(e) =>setEntrada(e.target.value)}
              placeholder="Pergunte algo sobre suas finanças..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-700 dark:bg-neutral-800"
              aria-label="Mensagem"
            /><button type="submit" disabled={pensando || !entrada.trim()}
              className="rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50">Enviar
            </button></form></div></Card><p className="mt-3 text-xs text-neutral-400">As respostas são geradas pelo backend (POST /api/ai/analyze) a partir dos seus dados cadastrados, sem recomendações específicas de compra ou venda.
      </p></>);
}
