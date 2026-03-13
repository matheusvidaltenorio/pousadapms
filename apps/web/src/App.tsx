import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './shared/components/ProtectedRoute'
import { AdminRoute } from './shared/components/AdminRoute'
import { MainLayout } from './shared/layouts/MainLayout'
import { OfflineIndicator } from './shared/components/OfflineIndicator'
import { SyncEffect } from './core/offline/SyncEffect'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { UsersPage } from './features/users/pages/UsersPage'
import { DashboardPage } from './features/dashboard/pages/DashboardPage'
import { CalendarPage } from './features/calendar/pages/CalendarPage'
import { RoomsPage } from './features/rooms/pages/RoomsPage'
import { GuestsPage } from './features/guests/pages/GuestsPage'
import { BookingsPage } from './features/bookings/pages/BookingsPage'
import { NewBookingPage } from './features/bookings/pages/NewBookingPage'
import { BookingDetailPage } from './features/bookings/pages/BookingDetailPage'
import { ExpensesPage } from './features/financial/pages/ExpensesPage'
import { FinancialPage } from './features/financial/pages/FinancialPage'
import { IntegrationsPage } from './features/integrations/pages/IntegrationsPage'

/**
 * Componente raiz com configuração de rotas.
 * - OfflineIndicator: banner quando sem conexão
 * - SyncEffect: processa fila ao voltar online
 * - /login: tela de autenticação (pública)
 * - Rotas sob /: protegidas por ProtectedRoute (exige login)
 */
function App() {
  return (
    <>
      <SyncEffect />
      <OfflineIndicator />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/new" element={<NewBookingPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="financial" element={<FinancialPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
