import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import LeadsListPage from './pages/leads/LeadsListPage';
import LeadDetailPage from './pages/leads/LeadDetailPage';
import ContactsListPage from './pages/contacts/ContactsListPage';
import ContactDetailPage from './pages/contacts/ContactDetailPage';
import AccountsListPage from './pages/accounts/AccountsListPage';
import AccountDetailPage from './pages/accounts/AccountDetailPage';
import DealsListPage from './pages/deals/DealsListPage';
import DealDetailPage from './pages/deals/DealDetailPage';
import DealsPipelinePage from './pages/deals/DealsPipelinePage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import TicketsListPage from './pages/tickets/TicketsListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsListPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="contacts" element={<ContactsListPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="accounts" element={<AccountsListPage />} />
        <Route path="accounts/:id" element={<AccountDetailPage />} />
        <Route path="deals" element={<DealsListPage />} />
        <Route path="deals/pipeline" element={<DealsPipelinePage />} />
        <Route path="deals/:id" element={<DealDetailPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="tickets" element={<TicketsListPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
