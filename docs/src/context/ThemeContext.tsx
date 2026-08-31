import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Tema = 'claro' | 'escuro';
const ThemeContext = createContext<{ tema: Tema; alternar: () => void }>({ tema: 'claro', alternar: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => (localStorage.getItem('fincontrol_tema') as Tema) || 'claro');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro');
    localStorage.setItem('fincontrol_tema', tema);
  }, [tema]);
  const alternar = useCallback(() => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')), []);
  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
