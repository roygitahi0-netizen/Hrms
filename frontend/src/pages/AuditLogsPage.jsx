import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      setLogs(res.data.audit_logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>System Audit Trail</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Immutable security audit log tracking who changed what, when, and from where
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={16} /> Refresh Trail
        </button>
      </div>

      {/* Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Fetching audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor User</th>
                  <th>Action Event</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Event Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{log.user_email}</strong>
                        <span className={`badge badge-${log.user_role?.toLowerCase().replace('_', '')}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                          {log.user_role}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-admin">{log.action}</span>
                    </td>
                    <td>{log.target_type}</td>
                    <td><code>{log.target_id || 'N/A'}</code></td>
                    <td style={{ maxWidth: '300px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {log.details || 'N/A'}
                    </td>
                    <td><code style={{ fontSize: '0.8rem' }}>{log.ip_address || 'Localhost'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
