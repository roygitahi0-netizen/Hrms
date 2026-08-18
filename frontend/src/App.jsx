import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import Toast from './components/common/Toast';
import ProtectedRoute from './components/auth/ProtectedRoute';

import EmployeeModal from './components/employees/EmployeeModal';
import LeaveModal from './components/leaves/LeaveModal';
import DepartmentModal from './components/departments/DepartmentModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import LeavesPage from './pages/LeavesPage';
import AttendancePage from './pages/AttendancePage';
import AuditLogsPage from './pages/AuditLogsPage';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
      </div>
      <EmployeeModal />
      <LeaveModal />
      <DepartmentModal />
      <Toast />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Auth Route (Login & Registration Tabbed) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/leaves" element={<LeavesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />

            {/* Admin / HR Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR_STAFF']} />}>
              <Route path="/audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
