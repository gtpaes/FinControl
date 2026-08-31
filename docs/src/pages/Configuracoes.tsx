import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function Configuracoes() {
  const { nome, email, sair, atualizarPerfil } = useAuth();
  const { tema, alternar } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [novoNome, setNovoNome] = useState(nome);
  const [salvando, setSalvando] = useState(false);
  const [prefs, setPrefs] = useState({ moeda: 'BRL', notifMeta: true, notifOrcamento: true, notifPatrimonio: false });

  async function salvarPerfil() {
    if (!novoNome.trim()) {
      toast('O nome não pode ficar vazio.', 'erro');
      return;
    }
    setSalvando(true);
    try {
      await atualizarPerfil(novoNome.trim());
      toast('Perfil salvo com sucesso.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao salvar o perfil.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  function logout() {
    sair();
    navigate('/login');
  }

  return (
    <><PageHeader titulo="Configurações" descricao="Perfil, preferências e privacidade da conta." /><div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card><CardHeader title="Perfil" subtitle="Informações da sua conta" /><div className="space-y-4 px-5 pb-6"><Field label="Nome"><Input value={novoNome} onChange={(e) =>setNovoNome(e.target.value)} /></Field><Field label="E-mail"><Input defaultValue={email} disabled /></Field><Button onClick={salvarPerfil} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Button></div></Card><Card><CardHeader title="Preferências" subtitle="Aparência e formato" /><div className="space-y-4 px-5 pb-6"><Field label="Tema">
              <div className="flex gap-2"><Button variant={tema === 'claro' ? 'primary' : 'secondary'} onClick={() =>tema === 'escuro' && alternar()}>Claro</Button><Button variant={tema === 'escuro' ? 'primary' : 'secondary'} onClick={() =>tema === 'claro' && alternar()}>Escuro</Button></div>
            </Field><Field label="Moeda"><Select value={prefs.moeda} onChange={(e) =>setPrefs({ ...prefs, moeda: e.target.value })} className="!w-40"><option value="BRL">Real (R$)</option><option value="USD" disabled>Dólar (US$) — em breve</option></Select></Field></div></Card><Card><CardHeader title="Notificações" subtitle="Escolha o que quer receber" /><div className="space-y-3 px-5 pb-6">{[
              ['notifMeta', 'Metas (progresso e prazos)'],
              ['notifOrcamento', 'Orçamento (limites e alertas)'],
              ['notifPatrimonio', 'Patrimônio (variações mensais)'],
            ].map(([k, label]) =>(
              <label key={k} className="flex items-center justify-between text-sm"><span>{label}</span><input type="checkbox" checked={prefs[k as keyof typeof prefs] as boolean}
                  onChange={(e) =>setPrefs({ ...prefs, [k]: e.target.checked })}
                  className="h-4 w-4 accent-brand-600" /></label>))}
          </div></Card><Card><CardHeader title="Privacidade e sessão" subtitle="Segurança da conta" /><div className="space-y-3 px-5 pb-6 text-sm text-neutral-500 dark:text-neutral-400"><p><Badge tone="green">Somente frontend</Badge>Nenhum dado pessoal sai do seu navegador nesta versão. Senhas nunca são armazenadas.</p><p>Autenticação, autorização e proteção de dados serão responsabilidade do backend (Java + Spring Boot) com sessões/tokens.</p><div className="pt-2"><Button variant="danger" onClick={() =>setConfirmarSaida(true)}>Sair da conta</Button></div></div></Card></div><Modal open={confirmarSaida} onClose={() =>setConfirmarSaida(false)} title="Sair da conta"><p className="text-sm text-neutral-600 dark:text-neutral-300">Tem certeza que deseja sair? Você será redirecionado para a tela de login.</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() =>setConfirmarSaida(false)}>Cancelar</Button><Button variant="danger" onClick={logout}>Sair</Button></div></Modal></>);
}
