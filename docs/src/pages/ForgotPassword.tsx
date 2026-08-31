import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './auth/AuthShell';
import { Alert, Button, Field, Input } from '../components/ui';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await new Promise((r) => setTimeout(r, 300)); // evita duplo clique no botão
      setEnviado(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell><h1 className="text-2xl font-bold tracking-tight">Recupere seu acesso</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Digite seu e-mail e enviaremos as instruções para recuperar sua conta.</p>{enviado ? (
        <div className="mt-6"><Alert tone="info" title="Solicitação registrada">A redefinição de senha por e-mail ainda não está disponível nesta versão. Entre em contato com o suporte para recuperar sua conta.
          </Alert></div>) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate><Field label="E-mail" error={erro}><Input type="email" value={email} onChange={(e) =>setEmail(e.target.value)} placeholder="voce@exemplo.com" /></Field><Button type="submit" full loading={carregando}>Enviar instruções</Button></form>)}

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">Lembrou a senha? <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Entrar</Link></p></AuthShell>);
}
