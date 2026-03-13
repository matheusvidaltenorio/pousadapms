import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../shared/layouts/MainLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

/**
 * Configuração das rotas da aplicação.
 *
 * Rotas públicas: /login
 * Rotas protegidas: /dashboard (e demais sob MainLayout)
 *
 * Por enquanto não temos guard de autenticação - será implementado na Fase 1.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
