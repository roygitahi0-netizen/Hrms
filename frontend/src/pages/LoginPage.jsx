import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearAuthError } from '../store/slices/authSlice';
import api from '../services/api';
import {
  Lock, Mail, ArrowRight, Building2, Check, Code,
  Users, TrendingUp, DollarSign, Info, Eye, EyeOff,
  ShieldCheck, BarChart3, Clock, Zap, User, ChevronRight
} from 'lucide-react';

/* ── Static feature list shown on the brand panel ─────────────────── */
const FEATURES = [
  { icon: ShieldCheck, label: 'Role-Based Access Control', color: '#6366f1' },
  { icon: BarChart3,   label: 'Real-Time Analytics Dashboard', color: '#00f2fe' },
  { icon: Clock,       label: 'Attendance & Leave Management', color: '#10b981' },
  { icon: Zap,         label: 'Instant HR Notifications', color: '#f59e0b' },
];

/* ── Stat counters shown on the brand panel ───────────────────────── */
const STATS = [
  { value: '4',   label: 'Departments' },
  { value: '99%', label: 'Uptime SLA' },
  { value: '∞',   label: 'Scalability' },
];

/* ── Department colour palette ────────────────────────────────────── */
const DEPT_STYLE = {
  'Engineering':     { accent: '#00f2fe', bg: 'rgba(0,242,254,.12)',  border: 'rgba(0,242,254,.45)',  desc: 'Software, systems & DevOps',          icon: Code        },
  'Human Resources': { accent: '#8b5cf6', bg: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.45)', desc: 'People ops, talent & culture',         icon: Users       },
  'Sales & Marketing':{ accent: '#10b981', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.45)', desc: 'Revenue growth & brand marketing',      icon: TrendingUp  },
  'Finance':         { accent: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.45)', desc: 'Accounting, payroll & planning',        icon: DollarSign  },
};
const getDeptStyle = (name) =>
  DEPT_STYLE[name] || { accent: '#00f2fe', bg: 'rgba(0,242,254,.12)', border: 'rgba(0,242,254,.45)', desc: 'Functional operational unit', icon: Building2 };

/* ═══════════════════════════════════════════════════════════════════ */
const LoginPage = () => {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);

  /* Login form */
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);

  /* Register form */
  const [reg, setReg] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm: '', department_id: ''
  });
  const [showRegPwd,  setShowRegPwd]  = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [validationError, setValidationError] = useState('');

  /* Departments */
  const [departments, setDepartments] = useState([]);

  useEffect(() => { dispatch(clearAuthError()); setValidationError(''); }, [activeTab, dispatch]);

  useEffect(() => {
    api.get('/departments')
      .then((r) => {
        const list = r.data.departments || [];
        setDepartments(list);
        if (list.length) setReg((p) => ({ ...p, department_id: list[0].id }));
      })
      .catch(() => {
        const fallback = [
          { id: 1, name: 'Engineering' }, { id: 2, name: 'Human Resources' },
          { id: 3, name: 'Sales & Marketing' }, { id: 4, name: 'Finance' },
        ];
        setDepartments(fallback);
        setReg((p) => ({ ...p, department_id: 1 }));
      });
  }, []);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  /* ── handlers ───────────────────────────────────────────────────── */
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    dispatch(loginUser({ email: loginEmail, password: loginPassword }));
  };

  const handleRegChange = (key, val) => setReg((p) => ({ ...p, [key]: val }));

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    if (!reg.department_id) return setValidationError('Please select your department.');
    if (reg.password.length < 6) return setValidationError('Password must be at least 6 characters.');
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(reg.password)) return setValidationError('Password must include a letter and a number.');
    if (reg.password !== reg.confirm) return setValidationError('Passwords do not match.');
    dispatch(registerUser({
      first_name: reg.first_name, last_name: reg.last_name,
      email: reg.email, password: reg.password, department_id: Number(reg.department_id)
    }));
  };

  /* ── shared small components ────────────────────────────────────── */
  const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required, showToggle, onToggle, showPwd, autoComplete }) => (
    <div className="lp-field">
      <label className="lp-label">{label}</label>
      <div className="lp-input-wrap">
        <Icon size={17} className="lp-input-icon" />
        <input
          type={showToggle ? (showPwd ? 'text' : 'password') : type}
          className="lp-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        {showToggle && (
          <button type="button" className="lp-eye-btn" onClick={onToggle} tabIndex={-1} aria-label="Toggle password visibility">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div className="lp-root">
      {/* ── Floating ambient orbs ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      <div className={`lp-shell ${activeTab === 'register' ? 'lp-shell--wide' : ''}`}>

        {/* ═══════ LEFT — Brand Panel ═══════ */}
        <div className="lp-brand">
          {/* Logo */}
          <div className="lp-brand-logo">
            <span className="lp-brand-initials">TH</span>
          </div>
          <h2 className="lp-brand-title">Team Hub</h2>
          <p className="lp-brand-sub">Modern Workforce Management Platform</p>

          {/* Stats row */}
          <div className="lp-stats">
            {STATS.map((s) => (
              <div key={s.label} className="lp-stat">
                <span className="lp-stat-value">{s.value}</span>
                <span className="lp-stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul className="lp-feature-list">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <li key={label} className="lp-feature-item">
                <span className="lp-feature-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <Icon size={16} color={color} />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* Decorative bottom quote */}
          <div className="lp-brand-footer">
            "Empowering teams through intelligent HR operations."
          </div>
        </div>

        {/* ═══════ RIGHT — Form Panel ═══════ */}
        <div className="lp-form-panel">
          {/* Tab switcher */}
          <div className="lp-tabs">
            <button
              id="tab-signin"
              className={`lp-tab ${activeTab === 'login' ? 'lp-tab--active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              <User size={15} /> Sign In
            </button>
            <button
              id="tab-register"
              className={`lp-tab ${activeTab === 'register' ? 'lp-tab--active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              <Users size={15} /> Create Account
            </button>
          </div>

          {/* ── Heading ── */}
          <div className="lp-form-header">
            <h1 className="lp-form-title">
              {activeTab === 'login' ? 'Welcome back' : 'Join Team Hub'}
            </h1>
            <p className="lp-form-desc">
              {activeTab === 'login'
                ? 'Sign in to your workforce portal'
                : 'Create your employee account below'}
            </p>
          </div>

          {/* ── Error banner ── */}
          {(error || validationError) && (
            <div className="lp-error-banner" role="alert">
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              {validationError || error}
            </div>
          )}

          {/* ══════════ LOGIN FORM ══════════ */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="lp-form" noValidate>
              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="admin@teamhub.com"
                required
                autoComplete="email"
              />

              <InputField
                label="Password"
                icon={Lock}
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••••"
                required
                showToggle
                showPwd={showLoginPwd}
                onToggle={() => setShowLoginPwd((v) => !v)}
                autoComplete="current-password"
              />

              <div className="lp-forgot-row">
                <button type="button" className="lp-forgot-btn" onClick={() => navigate('/forgot-password')}>
                  Forgot password?
                </button>
              </div>

              <button
                id="btn-signin"
                type="submit"
                className="lp-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <span className="lp-spinner" />
                  : <><span>Sign In to Team Hub</span><ArrowRight size={18} /></>
                }
              </button>

              {/* Demo credentials hint */}
              <div className="lp-hint">
                <span className="lp-hint-tag">Demo</span>
                admin@teamhub.com · use your set password
              </div>
            </form>

          ) : (
            /* ══════════ REGISTER FORM ══════════ */
            <form onSubmit={handleRegisterSubmit} className="lp-form" noValidate>
              <div className="lp-row-2">
                <InputField label="First Name" icon={User} value={reg.first_name} onChange={(v) => handleRegChange('first_name', v)} placeholder="John" required autoComplete="given-name" />
                <InputField label="Last Name"  icon={User} value={reg.last_name}  onChange={(v) => handleRegChange('last_name', v)}  placeholder="Doe"  required autoComplete="family-name" />
              </div>

              <InputField
                label="Work Email"
                icon={Mail}
                type="email"
                value={reg.email}
                onChange={(v) => handleRegChange('email', v)}
                placeholder="name@company.com"
                required
                autoComplete="email"
              />

              <div className="lp-row-2">
                <InputField
                  label="Password"
                  icon={Lock}
                  value={reg.password}
                  onChange={(v) => handleRegChange('password', v)}
                  placeholder="Min 6 chars"
                  required
                  showToggle
                  showPwd={showRegPwd}
                  onToggle={() => setShowRegPwd((v) => !v)}
                  autoComplete="new-password"
                />
                <InputField
                  label="Confirm Password"
                  icon={Lock}
                  value={reg.confirm}
                  onChange={(v) => handleRegChange('confirm', v)}
                  placeholder="Repeat password"
                  required
                  showToggle
                  showPwd={showConfPwd}
                  onToggle={() => setShowConfPwd((v) => !v)}
                  autoComplete="new-password"
                />
              </div>

              {/* Department picker */}
              <div className="lp-field" style={{ marginTop: '0.25rem' }}>
                <div className="lp-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Select Department *</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                    Auto-assigned on join
                  </span>
                </div>
                <div className="lp-dept-grid">
                  {departments.map((d) => {
                    const ds = getDeptStyle(d.name);
                    const DIcon = ds.icon;
                    const sel = String(reg.department_id) === String(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        id={`dept-${d.id}`}
                        className={`lp-dept-card ${sel ? 'lp-dept-card--sel' : ''}`}
                        style={sel ? { borderColor: ds.accent, boxShadow: `0 0 18px ${ds.bg}, inset 0 0 30px ${ds.bg}` } : {}}
                        onClick={() => handleRegChange('department_id', d.id)}
                      >
                        <div className="lp-dept-top">
                          <DIcon size={17} color={sel ? ds.accent : '#94a3b8'} />
                          <span className="lp-dept-name" style={sel ? { color: ds.accent } : {}}>{d.name}</span>
                          {sel && (
                            <span className="lp-dept-check" style={{ background: ds.accent }}>
                              <Check size={10} color="#000" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <p className="lp-dept-desc">{ds.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info banner */}
              <div className="lp-info-banner">
                <Info size={16} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p>
                  <strong style={{ color: 'var(--accent-cyan)' }}>Role assignment</strong> — Your account starts as
                  <em> Employee</em>. Elevated roles are granted by the Admin after verification.
                </p>
              </div>

              <button
                id="btn-register"
                type="submit"
                className="lp-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <span className="lp-spinner" />
                  : <><span>Create My Account</span><ChevronRight size={18} /></>
                }
              </button>
            </form>
          )}

          <button className="lp-back-btn" onClick={() => navigate('/')}>
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
