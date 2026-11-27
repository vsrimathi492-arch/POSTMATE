import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncomingMailPage } from './pages/IncomingMailPage';
import { OutgoingMailPage } from './pages/OutgoingMailPage';
import { DigitalRegisterPage } from './pages/DigitalRegisterPage';
import { MailDetailsPage } from './pages/MailDetailsPage';
import { SmartScanPage } from './pages/SmartScanPage';
import { SmartSortingPage } from './pages/SmartSortingPage';
import { DeliveryOverviewPage } from './pages/DeliveryOverviewPage';
import { AssignDeliveryPage } from './pages/AssignDeliveryPage';
import { MyDeliveriesPage } from './pages/MyDeliveriesPage';
import { DeliveryExceptionsPage } from './pages/DeliveryExceptionsPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { CashbookPage } from './pages/CashbookPage';
import { CashReconciliationPage } from './pages/CashReconciliationPage';
import { CustomerEnquiryPage } from './pages/CustomerEnquiryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs font-semibold">
        Loading POSTMATE Operations Terminal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="incoming" element={<IncomingMailPage />} />
              <Route path="outgoing" element={<OutgoingMailPage />} />
              <Route path="register" element={<DigitalRegisterPage />} />
              <Route path="mail/:id" element={<MailDetailsPage />} />
              <Route path="scan" element={<SmartScanPage />} />
              <Route path="sorting" element={<SmartSortingPage />} />
              <Route path="delivery" element={<DeliveryOverviewPage />} />
              <Route path="assign-delivery" element={<AssignDeliveryPage />} />
              <Route path="my-deliveries" element={<MyDeliveriesPage />} />
              <Route path="exceptions" element={<DeliveryExceptionsPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="cashbook" element={<CashbookPage />} />
              <Route path="reconciliation" element={<CashReconciliationPage />} />
              <Route path="enquiry" element={<CustomerEnquiryPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
