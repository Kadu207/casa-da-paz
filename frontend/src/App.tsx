import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FinanceiroPage from './pages/FinanceiroPage';
import RecepcaoPage from './pages/RecepcaoPage';
import LivrariaPage from './pages/LivrariaPage';
import UsuariosPage from './pages/UsuariosPage';
import PublicHome from './pages/public/PublicHome';
import PublicEventos from './pages/public/PublicEventos';
import PublicAgendar from './pages/public/PublicAgendar';
import PublicContato from './pages/public/PublicContato';
import AppLayout from './components/AppLayout';
import { RequireRole } from './guards/RequireRole';

export default function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicHome />} />
      <Route path="/public/eventos" element={<PublicEventos />} />
      <Route path="/public/agendar" element={<PublicAgendar />} />
      <Route path="/public/contato" element={<PublicContato />} />
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
              <FinanceiroPage />
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
          path="usuarios"
          element={
            <RequireRole path="/app/usuarios">
              <UsuariosPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/public" replace />} />
    </Routes>
  );
}
