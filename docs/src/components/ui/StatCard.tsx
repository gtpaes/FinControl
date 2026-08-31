import { ReactNode } from 'react';
import { Card, Skeleton } from './index';

export function StatCard({
  titulo, valor, detalhes, rodape, icone, carregando,
}: {
  titulo: string; valor?: ReactNode; detalhes?: ReactNode; rodape?: ReactNode; icone?: string; carregando?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{titulo}</p>
        {icone && <span aria-hidden className="text-lg">{icone}</span>}
      </div>
      {carregando ? (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-2xl font-bold tracking-tight">{valor}</p>
          {detalhes && <div className="mt-1.5 space-y-0.5 text-sm text-neutral-500 dark:text-neutral-400">{detalhes}</div>}
        </>
      )}
      {rodape && <div className="mt-3">{rodape}</div>}
    </Card>
  );
}
