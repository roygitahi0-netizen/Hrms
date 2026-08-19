import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Copy } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccessData(res.data);
      } else {
        setError(res.data.message || 'Unable to process request.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (successData?.reset_link) {
      navigator.clipboard.writeText(successData.reset_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card" style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="logo-badge" style={{ margin: '0 auto 0.85rem', width: '52px', height: '52px', fontSize: '1.5rem', background: 'var(--accent-gradient)' }}>
            <KeyRound size={26} color="#000000" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Reset Your Password</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Enter your registered email address and we'll dispatch a password reset link to your inbox.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Success Alert & Reset Link Demo Handler */}
        {successData ? (
          <div>
            <div
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 0.5rem' }} />
              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.35rem' }}>Reset Link Generated!</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {successData.message}
              </p>
            </div>

            {/* If reset link is returned in response for testing, show direct reset button */}
            {successData.reset_link && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  DIRECT TEST RESET LINK:
                </div>
                <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
                  {successData.reset_link}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyLink}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  >
                    <Copy size={14} /> {copied ? 'Copied Link!' : 'Copy Reset Link'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const url = new URL(successData.reset_link);
                      navigate(`/reset-password${url.search}`);
                    }}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  >
                    Open Reset Page <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              Return to Sign In Page
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Registered Work Email Address *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@teamhub.com"
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Processing Request...' : (
                <>
                  Send Reset Link <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
