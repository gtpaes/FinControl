import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo';

const destaques = ['Controle financeiro', 'Investimentos', 'Metas', 'Patrimônio'];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950">{/* Lado esquerdo — apresentação (oculto no mobile) */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-white lg:flex dark:bg-neutral-900"><div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" aria-hidden /><div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" aria-hidden /><div className="relative"><div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold shadow">F</div><span className="text-xl font-bold tracking-tight">FinControl</span></div><h1 className="mt-16 max-w-md text-3xl xl:text-4xl font-bold leading-tight">Tenha clareza sobre o seu dinheiro.
          </h1><p className="mt-4 max-w-md text-neutral-300">Organize sua vida financeira, acompanhe seus investimentos e veja seu patrimônio evoluir em um só lugar.
          </p><div className="mt-10 flex max-w-md flex-wrap gap-2.5">{destaques.map((d) =>(
              <span key={d} className="rounded-full border border-neutral-700 bg-neutral-900/60 px-4 py-1.5 text-sm text-neutral-300">{d}
              </span>))}
          </div></div>{/* Elemento gráfico financeiro discreto */}
        <div className="relative flex items-end gap-1.5" aria-hidden>{[35, 55, 42, 70, 58, 86, 100].map((h, i) =>(
            <div key={i} className="w-8 rounded-t-md bg-gradient-to-t from-brand-700/40 to-brand-400/80" style={{ height: `${h}px` }} />))}
        </div></aside>{/* Lado direito — formulário */}
      <main className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2 lg:px-16"><div className="mb-8 lg:hidden"><Link to="/login" aria-label="FinControl"><Logo /></Link></div><div className="w-full max-w-md">{children}</div></main></div>);
}