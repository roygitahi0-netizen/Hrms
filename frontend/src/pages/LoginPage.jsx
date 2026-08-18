import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { loginUser } from '../store/slices/authSlice';
import { Shield, User, Users, Briefcase, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    dispatch(loginUser({ email: demoEmail, password: 'password123' }));
  };

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-badge" style={{ margin: '0 auto 1rem', width: '56px', height: '56px', fontSize: '1.75rem' }}>
            HR
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Pulse HRMS</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Human Resource Management System
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                required
              />
              <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Portal <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center', marginBottom: '0.75rem' }}>
            ⚡ Demo Quick Switcher (One-Click Login)
          </div>

          <div className="quick-login-grid">
            <button className="btn-role" onClick={() => handleQuickLogin('admin@hrms.com')}>
              <Shield size={16} color="var(--accent-purple)" />
              <strong>Admin</strong>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>admin@hrms.com</span>
            </button>

            <button className="btn-role" onClick={() => handleQuickLogin('hr@hrms.com')}>
              <Users size={16} color="var(--accent-cyan)" />
              <strong>HR Staff</strong>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>hr@hrms.com</span>
            </button>

            <button className="btn-role" onClick={() => handleQuickLogin('manager.tech@hrms.com')}>
              <Briefcase size={16} color="var(--accent-amber)" />
              <strong>Manager</strong>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>manager.tech@hrms.com</span>
            </button>

            <button className="btn-role" onClick={() => handleQuickLogin('emp1@hrms.com')}>
              <User size={16} color="var(--accent-emerald)" />
              <strong>Employee</strong>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>emp1@hrms.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
