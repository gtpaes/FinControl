import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from './auth/AuthShell';
import { Alert, Button, Field, Input, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../services/api';

function forcaSenha(s: string): { nivel: number; rotulo: string; tone: 'red' | 'amber' | 'green' } {
  let f = 0;
  if (s.length>= 8) f++;
  if (/[A-Z]/.test(s)) f++;
  if (/[0-9]/.test(s)) f++;
  if (/[^A-Za-z0-9]/.test(s)) f++;
  if (!s) return { nivel: 0, rotulo: '', tone: 'red' };
  if (f <= 1) return { nivel: 25, rotulo: 'Fraca', tone: 'red' };
  if (f <= 2) return { nivel: 50, rotulo: 'Média', tone: 'amber' };
  if (f === 3) return { nivel: 75, rotulo: 'Boa', tone: 'amber' };
  return { nivel: 100, rotulo: 'Forte', tone: 'green' };
}

export default function Register() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmar: '' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [termos, setTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { registrar } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const forca = useMemo(() =>forcaSenha(form.senha), [form.senha]);

  function set(campo: string, valor: string) {
    setForm((f) =>({ ...f, [campo]: valor }));
    setErros((e) =>({ ...e, [campo]: '' }));
  }

  function validar() {
    const e: Record<string, string>= {};
    if (!form.nome.trim()) e.nome = 'Informe seu nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Informe um e-mail válido.';
    if (form.senha.length < 8) e.senha = 'A senha deve ter no mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(form.senha) || !/[0-9]/.test(form.senha)) e.senha = 'Use ao menos uma letra maiúscula e um número.';
    if (form.confirmar !== form.senha) e.confirmar = 'As senhas não coincidem.';
    if (!termos) e.termos = 'Ã‰ necessário aceitar os termos de uso.';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validar()) return;
    setCarregando(true);
    try {
      await registrar(form.nome, form.email, form.senha); // cadastro real no backend
      toast('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível criar a conta. Tente novamente.';
      // erro global da API vai para o toast; erros de campo continuam nos inputs
      toast(msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell><h1 className="text-2xl font-bold tracking-tight">Crie sua conta</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Comece a organizar suas finanças em minutos.</p><form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate><Field label="Nome" error={erros.nome}><Input value={form.nome} onChange={(e) =>set('nome', e.target.value)} placeholder="Seu nome completo" /></Field><Field label="E-mail" error={erros.email}><Input type="email" value={form.email} onChange={(e) =>set('email', e.target.value)} placeholder="voce@exemplo.com" /></Field><Field label="Senha" error={erros.senha} hint="Mínimo 8 caracteres, com letra maiúscula e número."><Input type="password" value={form.senha} onChange={(e) =>set('senha', e.target.value)} /></Field>{form.senha && (
          <div><ProgressBar value={forca.nivel} max={100} tone={forca.tone} /><p className="mt-1 text-xs text-neutral-500">Força da senha: {forca.rotulo}</p></div>)}
        <Field label="Confirmar senha" error={erros.confirmar}><Input type="password" value={form.confirmar} onChange={(e) =>set('confirmar', e.target.value)} /></Field><div><label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300"><input type="checkbox" checked={termos} onChange={(e) =>setTermos(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />Li e concordo com os <a href="#termos" onClick={(e) =>e.preventDefault()} className="text-brand-600 hover:underline">termos de uso</a>.
          </label>{erros.termos && <p className="mt-1 text-xs text-danger">{erros.termos}</p>}
        </div><Button type="submit" full loading={carregando}>Criar conta</Button></form><p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Já possui uma conta? <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Entrar</Link></p></AuthShell>);
}
