import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Award,
  Zap
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* Navigation Bar */}
      <header
        style={{
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 3rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(6, 9, 19, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="logo-badge">TH</div>
          <span className="logo-text" style={{ fontSize: '1.4rem' }}>Team Hub</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/login?tab=login')}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/login?tab=register')}>
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '6rem 2rem 4rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-cyan)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.75rem'
          }}
        >
          <Sparkles size={16} /> Next-Generation HRMS Platform
        </div>

        <h1
          style={{
            fontSize: '3.75rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Unify Your People, Operations & Payroll Workflows in <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Team Hub</span>
        </h1>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          Eliminate fragmented spreadsheets and paper chains. Centralize employee records, automate leave approval workflows, track real-time attendance, and maintain strict role-based data security.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigate('/login?tab=register')}>
            Launch Workspace <ArrowRight size={20} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} onClick={() => navigate('/login?tab=login')}>
            Sign In to Account
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', marginBottom: '1.25rem' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Employee Directory</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Maintain a single source of truth for personal data, departments, job titles, and sensitive field permissions.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ background: 'rgba(0, 242, 254, 0.15)', color: 'var(--accent-cyan)', marginBottom: '1.25rem' }}>
              <Calendar size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Leave & Approvals</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Automated leave balances, time-off requests, and one-click manager approval queues with notifications.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', marginBottom: '1.25rem' }}>
              <Clock size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Attendance Clocking</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Real-time daily clock in/out tracking with automatic shift hours, LATE detection, and exportable CSV reports.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent-rose)', marginBottom: '1.25rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Role-Based Audit Security</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Strict RBAC enforcement for Admins, HR Staff, Managers, and Employees with complete audit logging.
            </p>
          </div>
        </div>
      </section>

      {/* Role Capabilities Section */}
      <section style={{ background: 'var(--bg-secondary)', padding: '5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>Designed for Every User Role</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Customized permissions and streamlined interfaces tailored to your position</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <span className="badge badge-admin" style={{ marginBottom: '1rem' }}>ADMIN</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>System Owner</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Full CRUD employee management</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Department & role configuration</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> System audit log viewer</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <span className="badge badge-hr" style={{ marginBottom: '1rem' }}>HR STAFF</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Operations Manager</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Employee onboarding & salary data</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Organization leave approvals</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Exportable CSV reports</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <span className="badge badge-manager" style={{ marginBottom: '1rem' }}>MANAGER</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Team Leader</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Direct report leave approvals</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Team attendance calendar</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Team roster visibility</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <span className="badge badge-employee" style={{ marginBottom: '1rem' }}>EMPLOYEE</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Staff Member</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Profile self-service updates</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Submit leave requests & balance</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--accent-emerald)" /> Daily shift clock in/out widget</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © {new Date().getFullYear()} Team Hub Enterprise HRMS. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
