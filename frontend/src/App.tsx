import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FinanceiroLayout from './components/financeiro/FinanceiroLayout';
import FinanceiroLancamentosPage from './pages/financeiro/FinanceiroLancamentosPage';
import FinanceiroFluxoPage from './pages/financeiro/FinanceiroFluxoPage';
import FinanceiroAtrasadosPage from './pages/financeiro/FinanceiroAtrasadosPage';
import FinanceiroConciliacaoPage from './pages/financeiro/FinanceiroConciliacaoPage';
import FinanceiroContasPage from './pages/financeiro/FinanceiroContasPage';
import FinanceiroCobrancasPage from './pages/financeiro/FinanceiroCobrancasPage';
import FinanceiroTransparenciaPage from './pages/financeiro/FinanceiroTransparenciaPage';
import RecepcaoPage from './pages/RecepcaoPage';
import LivrariaPage from './pages/LivrariaPage';
import UsuariosPage from './pages/UsuariosPage';
import PessoasPage from './pages/PessoasPage';
import EventosPage from './pages/EventosPage';
import MarketingPage from './pages/MarketingPage';
import PublicHome from './pages/public/PublicHome';
import PublicEventos from './pages/public/PublicEventos';
import PublicAgendar from './pages/public/PublicAgendar';
import PublicContato from './pages/public/PublicContato';
import PublicAcompanhar from './pages/public/PublicAcompanhar';
import PublicEventoDetalhe from './pages/public/PublicEventoDetalhe';
import PublicLivraria from './pages/public/PublicLivraria';
import PublicTermos from './pages/public/PublicTermos';
import EcommerceAdminPage from './pages/EcommerceAdminPage';
import AuditoriaPage from './pages/AuditoriaPage';
import AlertasPage from './pages/AlertasPage';
import AlterarSenhaPage from './pages/AlterarSenhaPage';
import AppLayout from './components/AppLayout';
import { RequireRole } from './guards/RequireRole';

function IntegracoesPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">Integrações</h2>
      <p className="text-white/80 text-sm leading-relaxed">
        Área reservada ao perfil <strong>ADMIN</strong>: webhooks N8N, Asaas, Chatwoot/WhatsApp e variáveis de
        ambiente em produção. Consulte o runbook{' '}
        <code className="text-[var(--color-accent)]">docs/memory/runbooks/deploy-messaging-prod.md</code>.
      </p>
      <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
        <li>POST /api/webhooks/asaas — conciliação Asaas (token)</li>
        <li>POST /api/webhooks/n8n/trigger — disparo manual (testes)</li>
        <li>POST /api/webhooks/pix — conciliação PIX legada (secret)</li>
        <li>Stack messaging na VPS — Chatwoot + N8N</li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicHome />} />
      <Route path="/public/eventos" element={<PublicEventos />} />
      <Route path="/public/eventos/:id" element={<PublicEventoDetalhe />} />
      <Route path="/public/agendar" element={<PublicAgendar />} />
      <Route path="/public/contato" element={<PublicContato />} />
      <Route path="/public/livraria" element={<PublicLivraria />} />
      <Route path="/public/termos" element={<PublicTermos />} />
      <Route path="/public/acompanhar/:protocolo" element={<PublicAcompanhar />} />
      {/* aliases Lovable → rotas canônicas */}
      <Route path="/" element={<Navigate to="/public" replace />} />
      <Route path="/eventos" element={<Navigate to="/public/eventos" replace />} />
      <Route path="/eventos/:id" element={<PublicEventoDetalhe />} />
      <Route path="/agendar" element={<Navigate to="/public/agendar" replace />} />
      <Route path="/livraria" element={<Navigate to="/public/livraria" replace />} />
      <Route path="/termos" element={<PublicTermos />} />
      <Route path="/acompanhar/:protocolo" element={<PublicAcompanhar />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RequireRole path="/app/dashboard">
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="financeiro"
          element={
            <RequireRole path="/app/financeiro">
              <FinanceiroLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="lancamentos" replace />} />
          <Route path="lancamentos" element={<FinanceiroLancamentosPage />} />
          <Route path="fluxo" element={<FinanceiroFluxoPage />} />
          <Route path="atrasados" element={<FinanceiroAtrasadosPage />} />
          <Route path="conciliacao" element={<FinanceiroConciliacaoPage />} />
          <Route path="contas" element={<FinanceiroContasPage />} />
          <Route
            path="cobrancas"
            element={
              <RequireRole path="/app/financeiro/cobrancas">
                <FinanceiroCobrancasPage />
              </RequireRole>
            }
          />
          <Route
            path="transparencia"
            element={
              <RequireRole path="/app/financeiro/transparencia">
                <FinanceiroTransparenciaPage />
              </RequireRole>
            }
          />
          <Route
            path="alertas"
            element={
              <RequireRole path="/app/financeiro/alertas">
                <AlertasPage />
              </RequireRole>
            }
          />
        </Route>
        <Route
          path="marketing"
          element={
            <RequireRole path="/app/marketing">
              <MarketingPage />
            </RequireRole>
          }
        />
        <Route
          path="recepcao"
          element={
            <RequireRole path="/app/recepcao">
              <RecepcaoPage />
            </RequireRole>
          }
        />
        <Route
          path="livraria"
          element={
            <RequireRole path="/app/livraria">
              <LivrariaPage />
            </RequireRole>
          }
        />
        <Route
          path="eventos"
          element={
            <RequireRole path="/app/eventos">
              <EventosPage />
            </RequireRole>
          }
        />
        <Route
          path="pessoas"
          element={
            <RequireRole path="/app/pessoas">
              <PessoasPage />
            </RequireRole>
          }
        />
        <Route
          path="auditoria"
          element={
            <RequireRole path="/app/auditoria">
              <AuditoriaPage />
            </RequireRole>
          }
        />
        <Route
          path="usuarios"
          element={
            <RequireRole path="/app/usuarios">
              <UsuariosPage />
            </RequireRole>
          }
        />
        <Route
          path="ecommerce"
          element={
            <RequireRole path="/app/ecommerce">
              <EcommerceAdminPage />
            </RequireRole>
          }
        />
        <Route path="minha-senha" element={<AlterarSenhaPage />} />
        <Route
          path="integracoes"
          element={
            <RequireRole path="/app/integracoes">
              <IntegracoesPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/public" replace />} />
    </Routes>
  );
}
