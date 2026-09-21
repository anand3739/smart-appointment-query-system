import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { BookAppointmentPage } from './pages/customer/BookAppointmentPage';
import { AppointmentHistoryPage } from './pages/customer/AppointmentHistoryPage';
import { LiveQueuePage } from './pages/customer/LiveQueuePage';
import { WaitlistPage } from './pages/customer/WaitlistPage';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { TodayAppointmentsPage } from './pages/staff/TodayAppointmentsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BranchManagementPage } from './pages/admin/BranchManagementPage';
import { ServiceManagementPage } from './pages/admin/ServiceManagementPage';
import { ResourceManagementPage } from './pages/admin/ResourceManagementPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
  return <Navigate to="/customer" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Protected App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/book"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <BookAppointmentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/history"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <AppointmentHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/queue"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <LiveQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/waitlist"
                element={
                  <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
                    <WaitlistPage />
                  </ProtectedRoute>
                }
              />

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/queue"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/appointments"
                element={
                  <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                    <TodayAppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/branches"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <BranchManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ServiceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/resources"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ResourceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
};
