import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './auth/AuthShell';
import { Alert, Button, Field, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha); // autenticação real: JWT + bcrypt no backend
      navigate('/dashboard');
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 401
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Verifique sua conexão e tente novamente.',
      );
      setCarregando(false);
    }
  }

  return (
    <AuthShell><h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Entre na sua conta para continuar.</p>{erro && <div className="mt-5"><Alert tone="erro">{erro}</Alert></div>}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate><Field label="E-mail"><Input type="email" value={email} onChange={(e) =>setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></Field><Field label="Senha"><div className="relative"><Input type={mostrar ? 'text' : 'password'} value={senha} onChange={(e) =>setSenha(e.target.value)} placeholder="Sua senha" autoComplete="current-password" required className="pr-16" /><button type="button" onClick={() =>setMostrar((v) =>!v)} className="absolute inset-y-0 right-3 text-xs font-medium text-brand-600 dark:text-brand-400" aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}>{mostrar ? 'Ocultar' : 'Mostrar'}
            </button></div></Field><div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300"><input type="checkbox" checked={lembrar} onChange={(e) =>setLembrar(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 accent-brand-600" />Lembrar de mim
          </label><Link to="/forgot-password" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Esqueci minha senha</Link></div><Button type="submit" full loading={carregando}>Entrar</Button></form><p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Não possui uma conta?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Criar conta</Link></p></AuthShell>);
}
