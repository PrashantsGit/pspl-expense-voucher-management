import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeVouchers from './pages/employee/EmployeeVouchers';
import VoucherForm from './pages/employee/VoucherForm';

import DirectorDashboard from './pages/director/DirectorDashboard';
import PendingApprovals from './pages/director/PendingApprovals';
import DirectorVouchers from './pages/director/DirectorVouchers';

import AccountsDashboard from './pages/accounts/AccountsDashboard';
import AccountsVouchers from './pages/accounts/AccountsVouchers';

import VoucherDetail from './pages/common/VoucherDetail';
import NotFound from './pages/NotFound';

const RootRedirect = () => {
  const { isAuthenticated, loading, getDashboardRoute } = useAuth();
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }
  return <Navigate to={isAuthenticated ? getDashboardRoute() : '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-vh-100 d-flex flex-column bg-light">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Authentication */}
              <Route path="/login" element={<Login />} />

              {/* Employee Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_EMPLOYEE']} />}>
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                <Route path="/employee/vouchers" element={<EmployeeVouchers />} />
                <Route path="/employee/vouchers/new" element={<VoucherForm />} />
                <Route path="/employee/vouchers/:id/edit" element={<VoucherForm />} />
              </Route>

              {/* Director Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_DIRECTOR']} />}>
                <Route path="/director/dashboard" element={<DirectorDashboard />} />
                <Route path="/director/pending" element={<PendingApprovals />} />
                <Route path="/director/vouchers" element={<DirectorVouchers />} />
              </Route>

              {/* Accounts Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ROLE_ACCOUNTS']} />}>
                <Route path="/accounts/dashboard" element={<AccountsDashboard />} />
                <Route path="/accounts/vouchers" element={<AccountsVouchers />} />
              </Route>

              {/* Universal Voucher Details (Accessible by authorized roles) */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['ROLE_EMPLOYEE', 'ROLE_DIRECTOR', 'ROLE_ACCOUNTS']}
                  />
                }
              >
                <Route path="/vouchers/:id" element={<VoucherDetail />} />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-white border-top py-3 text-center text-muted small d-print-none mt-auto">
            <div className="container">
              © {new Date().getFullYear()} Prachay Securities Private Limited (PSPL). Expense Voucher Management System.
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
