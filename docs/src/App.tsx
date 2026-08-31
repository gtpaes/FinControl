import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import MeuDinheiro from './pages/MeuDinheiro';
import Despesas from './pages/Despesas';
import Orcamento from './pages/Orcamento';
import Investimentos from './pages/Investimentos';
import Carteira from './pages/Carteira';
import Metas from './pages/Metas';
import Simulador from './pages/Simulador';
import Patrimonio from './pages/Patrimonio';
import Relatorios from './pages/Relatorios';
import Insights from './pages/Insights';
import Assistente from './pages/Assistente';
import Configuracoes from './pages/Configuracoes';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth();
  return autenticado ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth();
  return autenticado ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meu-dinheiro" element={<MeuDinheiro />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/orcamento" element={<Orcamento />} />
        <Route path="/investimentos" element={<Investimentos />} />
        <Route path="/carteira" element={<Carteira />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/simulador" element={<Simulador />} />
        <Route path="/patrimonio" element={<Patrimonio />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}