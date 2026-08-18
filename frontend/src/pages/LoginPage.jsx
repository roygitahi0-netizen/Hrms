import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearAuthError } from '../store/slices/authSlice';
import {
  User,
  Lock,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Building2,
  Check
} from 'lucide-react';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('EMPLOYEE');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
    setValidationError('');
  }, [activeTab, dispatch]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    dispatch(loginUser({ email: loginEmail, password: loginPassword }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (regPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(regPassword)) {
      setValidationError('Password must contain at least one letter and one number.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    dispatch(registerUser({
      first_name: regFirstName,
      last_name: regLastName,
      email: regEmail,
      phone: regPhone,
      country: regCountry,
      password: regPassword,
      role: regRole
    }));
  };

  const roleOptions = [
    {
      id: 'EMPLOYEE',
      title: 'Employee',
      desc: 'Self-service profile & attendance clocking',
      badgeClass: 'badge-employee',
      accentColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      icon: User
    },
    {
      id: 'MANAGER',
      title: 'Manager',
      desc: 'Team oversight & direct report approvals',
      badgeClass: 'badge-manager',
      accentColor: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      icon: Briefcase
    },
    {
      id: 'HR_STAFF',
      title: 'HR Staff',
      desc: 'Operations, salary & leave management',
      badgeClass: 'badge-hr',
      accentColor: '#00f2fe',
      bgColor: 'rgba(0, 242, 254, 0.12)',
      icon: Building2
    },
    {
      id: 'ADMIN',
      title: 'Admin',
      desc: 'Full system ownership & audit logging',
      badgeClass: 'badge-admin',
      accentColor: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card" style={{ maxWidth: activeTab === 'register' ? '640px' : '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="logo-badge" style={{ margin: '0 auto 0.85rem', width: '52px', height: '52px', fontSize: '1.5rem' }}>
            TH
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Team Hub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Workforce Portal Authentication
          </p>
        </div>

        {/* Auth Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Create Account
          </button>
        </div>

        {/* Global / Validation Error Alerts */}
        {(error || validationError) && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            {validationError || error}
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
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
                  Sign In to Team Hub <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Tab 2: Registration Form */
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Work Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '2.5rem' }}
                    value={regCountry}
                    onChange={(e) => setRegCountry(e.target.value)}
                    placeholder="e.g. Kenya, United States"
                  />
                  <Globe size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password * (Min 6, 1 Letter & 1 Number)</label>
                <input
                  type="password"
                  className="form-control"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="e.g. Pass123"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>

            {/* Vibrant & Eligible Role Selector Cards */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Select Desired System Role *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Eligible Access Level</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {roleOptions.map((opt) => {
                  const isSelected = regRole === opt.id;
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setRegRole(opt.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? opt.bgColor : 'rgba(255, 255, 255, 0.03)',
                        border: `2px solid ${isSelected ? opt.accentColor : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 0 15px ${opt.bgColor}` : 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon size={18} color={opt.accentColor} />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? opt.accentColor : '#ffffff' }}>
                            {opt.title}
                          </span>
                        </div>
                        {isSelected && (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: opt.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#000000" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : (
                <>
                  Create Account & Enter Portal <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Back to Team Hub Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
