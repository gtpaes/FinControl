import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { Alert, Card, CardHeader, PageHeader, Skeleton } from '../components/ui';

const tom: Record<string, 'sucesso' | 'alerta' | 'info'>= { positivo: 'sucesso', alerta: 'alerta', info: 'info' };

interface Insight { tipo: string; titulo: string; texto: string }

export default function Insights() {
  const [carregando, setCarregando] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    apiService.getInsights()
      .then((d) => { setInsights(d); setCarregando(false); })
      .catch(() => { setInsights([]); setCarregando(false); });
  }, []);

  return (
    <><PageHeader titulo="Insights" descricao="Análises geradas a partir dos seus dados financeiros." /><div className="space-y-3">{carregando
          ? [1, 2, 3, 4].map((i) =><Skeleton key={i} className="h-20" />)
          : insights.length === 0
            ? <Alert tone="info" title="Sem insights por enquanto">Cadastre receitas, despesas, investimentos e metas para gerar análises a partir dos seus dados reais.</Alert>
            : insights.map((i, idx) => (
                <Alert key={idx} tone={tom[i.tipo]} title={i.titulo}>{i.texto}</Alert>))}
      </div><Card className="p-5"><h3 className="font-semibold">Como funcionam os insights?</h3><p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Os insights são calculados pelo backend a partir dos dados cadastrados (receitas, despesas, orçamento, investimentos e metas). O FinControl não emite recomendações específicas de compra ou venda de investimentos.
        </p></Card></>);
}
