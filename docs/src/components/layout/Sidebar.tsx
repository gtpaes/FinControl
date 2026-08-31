import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { Icon, IconName } from '../ui/Icon';

const grupos: { titulo: string; itens: { to: string; label: string; icone: IconName }[] }[] = [
  {
    titulo: 'Visão geral',
    itens: [
      { to: '/dashboard', label: 'Dashboard', icone: 'dashboard' },
      { to: '/meu-dinheiro', label: 'Meu Dinheiro', icone: 'wallet' },
      { to: '/despesas', label: 'Despesas', icone: 'receipt' },
      { to: '/orcamento', label: 'Orçamento', icone: 'target' },
    ],
  },
  {
    titulo: 'Investimentos',
    itens: [
      { to: '/investimentos', label: 'Investimentos', icone: 'trending-up' },
      { to: '/carteira', label: 'Carteira', icone: 'briefcase' },
      { to: '/metas', label: 'Metas', icone: 'flag' },
      { to: '/simulador', label: 'Simulador', icone: 'calculator' },
      { to: '/patrimonio', label: 'Patrimônio', icone: 'landmark' },
    ],
  },
  {
    titulo: 'Análises',
    itens: [
      { to: '/relatorios', label: 'Relatórios', icone: 'file-text' },
      { to: '/insights', label: 'Insights', icone: 'lightbulb' },
      { to: '/assistente', label: 'Assistente IA', icone: 'bot' },
      { to: '/configuracoes', label: 'Configurações', icone: 'settings' },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 dark:border-neutral-800 dark:bg-neutral-900 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu principal"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-neutral-800 lg:hidden"
          >
            <Icon name="x" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {grupos.map((g) => (
            <div key={g.titulo} className="mb-5">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{g.titulo}</p>
              {g.itens.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  <Icon name={i.icone} className="h-[18px] w-[18px] shrink-0" />
                  {i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-neutral-200 px-5 py-3 text-xs text-neutral-400 dark:border-neutral-800">
          FinControl · conectado à API
        </div>
      </aside>
    </>
  );
}