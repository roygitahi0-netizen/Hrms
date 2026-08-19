import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearAuthError } from '../store/slices/authSlice';
import api from '../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  Building2,
  Check,
  Code,
  Users,
  TrendingUp,
  DollarSign,
  Info
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

  // Register form state (Phone & Country excluded per user request)
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDepartmentId, setRegDepartmentId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Departments list for registration
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    dispatch(clearAuthError());
    setValidationError('');
  }, [activeTab, dispatch]);

  useEffect(() => {
    // Fetch departments for department selector
    api.get('/departments')
      .then((res) => {
        const depts = res.data.departments || [];
        setDepartmentsList(depts);
        if (depts.length > 0) {
          setRegDepartmentId(depts[0].id);
        }
      })
      .catch(() => {
        // Fallback default list
        const fallbackDepts = [
          { id: 1, name: 'Engineering', code: 'ENG' },
          { id: 2, name: 'Human Resources', code: 'HR' },
          { id: 3, name: 'Sales & Marketing', code: 'SALES' },
          { id: 4, name: 'Finance', code: 'FIN' },
        ];
        setDepartmentsList(fallbackDepts);
        setRegDepartmentId(1);
      });
  }, []);

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

    if (!regDepartmentId) {
      setValidationError('Please select your company department.');
      return;
    }

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
      password: regPassword,
      department_id: Number(regDepartmentId)
    }));
  };

  // High-contrast, eligible department styling definitions
  const departmentStyleMap = {
    'Engineering': {
      accentColor: '#00f2fe',
      bgColor: 'rgba(0, 242, 254, 0.12)',
      borderColor: 'rgba(0, 242, 254, 0.5)',
      desc: 'Technical software, systems & DevOps engineering',
      icon: Code
    },
    'Human Resources': {
      accentColor: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      borderColor: 'rgba(139, 92, 246, 0.5)',
      desc: 'People operations, talent acquisition & culture',
      icon: Users
    },
    'Sales & Marketing': {
      accentColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      desc: 'Client outreach, revenue growth & brand marketing',
      icon: TrendingUp
    },
    'Finance': {
      accentColor: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      desc: 'Financial planning, accounting & payroll operations',
      icon: DollarSign
    }
  };

  const getDeptStyle = (name) => {
    return departmentStyleMap[name] || {
      accentColor: '#00f2fe',
      bgColor: 'rgba(0, 242, 254, 0.12)',
      borderColor: 'rgba(0, 242, 254, 0.5)',
      desc: 'Company functional operational unit',
      icon: Building2
    };
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card" style={{ maxWidth: activeTab === 'register' ? '600px' : '480px' }}>
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
                  placeholder="admin@teamhub.com"
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password *</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              </div>
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
          /* Tab 2: Registration Form (Clean - Excludes Phone & Country) */
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

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label">Password <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>(min 6, letter + number)</span></label>
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
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            {/* Vibrant, High-Contrast Company Department Cards Picker */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Select Company Department *</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Eligible Department Assignment</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {departmentsList.map((d) => {
                  const style = getDeptStyle(d.name);
                  const isSelected = String(regDepartmentId) === String(d.id);
                  const Icon = style.icon;

                  return (
                    <div
                      key={d.id}
                      onClick={() => setRegDepartmentId(d.id)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? style.bgColor : 'rgba(255, 255, 255, 0.03)',
                        border: `2px solid ${isSelected ? style.accentColor : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 0 15px ${style.bgColor}` : 'none',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon size={18} color={style.accentColor} />
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? style.accentColor : '#ffffff' }}>
                            {d.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: style.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#000000" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '0.74rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3 }}>
                        {style.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Role Policy Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.2)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                marginTop: '0.5rem',
                marginBottom: '1.25rem'
              }}
            >
              <Info size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--accent-cyan)' }}>Automated Department Access</strong>
                <p style={{ marginTop: '2px' }}>
                  Your account will automatically log into your selected department. Specific managerial roles (Manager, HR Staff, Admin) are governed by Admin verification.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : (
                <>
                  Register & Access Department <ArrowRight size={18} />
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
