import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiLogin, apiRegister, apiMe, apiUpdateProfile, apiLogout, getToken, type Usuario } from '../services/api';

interface AuthState {
  autenticado: boolean;
  nome: string;
  email: string;
  carregando: boolean;
}
interface AuthCtx extends AuthState {
  /** Login real: POST /api/auth/login → JWT → GET /api/auth/me */
  login: (email: string, senha: string) => Promise<void>;
  /** Cadastro real: POST /api/auth/register → JWT → GET /api/auth/me */
  registrar: (nome: string, email: string, senha: string) => Promise<void>;
  /** Atualiza o perfil (nome) via PUT /api/auth/profile */
  atualizarPerfil: (nome: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthCtx>({
  autenticado: false, nome: '', email: '', carregando: false,
  login: async () => {}, registrar: async () => {}, atualizarPerfil: async () => {}, sair: () => {},
});

/**
 * Autenticação REAL via backend (JWT + bcrypt no Spring Boot).
 * O token fica em localStorage; os dados do usuário vêm de /auth/me
 * (nunca confiamos em dados enviados pelo próprio frontend).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    autenticado: false, nome: '', email: '', carregando: !!getToken(),
  });

  // Com token salvo, valida a sessão contra o backend ao abrir o app
  useEffect(() => {
    if (!getToken()) return;
    apiMe()
      .then((u: Usuario) => setState({ autenticado: true, nome: u.name, email: u.email, carregando: false }))
      .catch(() => {
        apiLogout();
        setState({ autenticado: false, nome: '', email: '', carregando: false });
      });
  }, []);

  const aplicar = useCallback((u: Usuario) => {
    setState({ autenticado: true, nome: u.name, email: u.email, carregando: false });
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const r = await apiLogin(email, senha);
    aplicar(r.user);
  }, [aplicar]);

  const registrar = useCallback(async (nome: string, email: string, senha: string) => {
    const r = await apiRegister(nome, email, senha);
    // o backend pode normalizar o nome; confirma com /auth/me
    try { aplicar(await apiMe()); } catch { aplicar(r.user); }
  }, [aplicar]);

  const sair = useCallback(() => {
    apiLogout();
    setState({ autenticado: false, nome: '', email: '', carregando: false });
  }, []);

  const atualizarPerfil = useCallback(async (nome: string) => {
    aplicar(await apiUpdateProfile(nome));
  }, [aplicar]);

  return <AuthContext.Provider value={{ ...state, login, registrar, atualizarPerfil, sair }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
