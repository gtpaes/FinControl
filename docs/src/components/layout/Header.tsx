import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiService } from '../../services/apiService';
import { Icon } from '../ui/Icon';

const titulos: Record<string, string> = {
  '/dashboard': 'Dashboard', '/meu-dinheiro': 'Meu Dinheiro', '/despesas': 'Despesas',
  '/orcamento': 'Orçamento', '/investimentos': 'Investimentos', '/carteira': 'Carteira',
  '/metas': 'Metas', '/simulador': 'Simulador', '/patrimonio': 'Patrimônio',
  '/relatorios': 'Relatórios', '/insights': 'Insights', '/assistente': 'Assistente IA',
  '/configuracoes': 'Configurações',
};

export function Header({ onMenu }: { onMenu: () => void }) {
  const { nome, email, sair } = useAuth();
  const { tema, alternar } = useTheme();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [notifAberta, setNotifAberta] = useState(false);
  const [notificacoes, setNotificacoes] = useState<{ id: string; titulo: string; texto: string; tipo: string; lida: boolean }[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    apiService.getNotificacoes().then(setNotificacoes).catch(() => setNotificacoes([]));
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setMenuAberto(false); setNotifAberta(false); }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90 sm:px-6">
      <button className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800 lg:hidden" onClick={onMenu} aria-label="Abrir menu">
        <Icon name="menu" className="h-5 w-5" />
      </button>
      <h2 className="hidden truncate text-sm font-medium text-neutral-500 dark:text-neutral-400 sm:block">{titulos[location.pathname] ?? ''}</h2>

      {/* Ações à direita */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" ref={ref}>
        {/* Período (somente telas médias+) */}
        <span className="hidden shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 lg:block dark:border-neutral-700 dark:text-neutral-300">
          {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>

        {/* Tema */}
        <button
          onClick={alternar}
          aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <Icon name={tema === 'claro' ? 'moon' : 'sun'} className="h-5 w-5" />
        </button>

        {/* Notificações */}
        <div className="relative shrink-0">
          <button
            onClick={() => { setNotifAberta((v) => !v); setMenuAberto(false); }}
            aria-label={`Notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ''}`}
            aria-expanded={notifAberta}
            className="shrink-0 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Icon name="bell" className="h-5 w-5" />
            {naoLidas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white">
                {naoLidas}
              </span>
            )}
          </button>
          {notifAberta && (
            <div className="animate-fade-in absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <p className="px-3 py-2 text-xs font-semibold uppercase text-neutral-400">Notificações</p>
              {notificacoes.length === 0 ? (
                <p className="rounded-lg px-3 py-2.5 text-sm text-neutral-500 dark:text-neutral-400">Sem notificações por enquanto.</p>
              ) : notificacoes.map((n) => (
                <div key={n.id} className="rounded-lg px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-neutral-500">{n.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menu do usuário */}
        <div className="relative shrink-0">
          <button
            onClick={() => { setMenuAberto((v) => !v); setNotifAberta(false); }}
            aria-label="Menu do usuário"
            aria-expanded={menuAberto}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white ring-2 ring-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:ring-neutral-900"
          >
            {nome.charAt(0) || 'U'}
          </button>
          {menuAberto && (
            <div className="animate-fade-in absolute right-0 z-40 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b border-neutral-100 px-3 pb-2 dark:border-neutral-800">
                <p className="text-sm font-semibold">{nome}</p>
                <p className="truncate text-xs text-neutral-500">{email}</p>
              </div>
              <button onClick={() => { setMenuAberto(false); navigate('/configuracoes'); }} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Configurações</button>
              <button onClick={() => { setMenuAberto(false); sair(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950/40">Sair da conta</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}