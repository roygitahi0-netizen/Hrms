import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-rose)', fontSize: '1.5rem', marginBottom: '1rem' }}>403 - Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have the required permissions to view this page.</p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
