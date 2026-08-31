import { createContext, useCallback, useContext, useState } from 'react';

type ToastTipo = 'sucesso' | 'erro' | 'info';
interface Toast { id: number; tipo: ToastTipo; mensagem: string }

const ToastContext = createContext<{ toast: (m: string, t?: ToastTipo) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((mensagem: string, tipo: ToastTipo = 'sucesso') => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, tipo, mensagem }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3800);
  }, []);

  const cor = {
    sucesso: 'bg-brand-600 text-white',
    erro: 'bg-danger text-white',
    info: 'bg-neutral-800 text-white dark:bg-neutral-700',
  } as const;

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-fade-in rounded-lg px-4 py-3 text-sm shadow-lg ${cor[t.tipo]}`}>
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
