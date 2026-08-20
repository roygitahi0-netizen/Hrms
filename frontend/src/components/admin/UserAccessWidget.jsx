import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/uiSlice';
import { ShieldCheck, UserCheck, UserX, Clock, Building2, RefreshCw, KeyRound } from 'lucide-react';

const UserAccessWidget = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserEligibilityList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err) {
      dispatch(showToast({ message: 'Failed to fetch user access logs.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEligibilityList();
  }, []);

  const handleToggleEligibility = async (userObj) => {
    const newActiveState = !userObj.is_active;
    try {
      await api.put(`/auth/users/${userObj.id}/eligibility`, { is_active: newActiveState });
      dispatch(showToast({
        message: `Account status for ${userObj.email} updated to ${newActiveState ? 'ACTIVE' : 'INACTIVE'}`,
        type: 'success'
      }));
      fetchUserEligibilityList();
    } catch (err) {
      dispatch(showToast({ message: 'Failed to update account status.', type: 'error' }));
    }
  };

  const handleRoleChange = async (userObj, newRole) => {
    try {
      await api.put(`/auth/users/${userObj.id}/eligibility`, { role: newRole });
      dispatch(showToast({
        message: `User ${userObj.email} role updated to ${newRole}`,
        type: 'success'
      }));
      fetchUserEligibilityList();
    } catch (err) {
      dispatch(showToast({ message: 'Failed to update user role.', type: 'error' }));
    }
  };

  const handleAdminResetPassword = async (userObj) => {
    const newPass = window.prompt(
      `Set a new password for ${userObj.email}:\n(Must be at least 6 characters, with 1 letter & 1 number)`
    );

    if (!newPass) return; // User cancelled

    try {
      const res = await api.put(`/auth/users/${userObj.id}/reset-password`, { new_password: newPass });
      dispatch(showToast({
        message: res.data.message || `Password for ${userObj.email} reset successfully!`,
        type: 'success'
      }));
    } catch (err) {
      dispatch(showToast({
        message: err.response?.data?.message || 'Failed to update user password.',
        type: 'error'
      }));
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="var(--accent-cyan)" size={22} /> User Access & Eligibility Control
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Monitor company registrations, login timestamps, department assignments, and manage role permissions
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchUserEligibilityList} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Logs
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading user access records...</div>
      ) : users.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No user access records registered yet.</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Registered User</th>
                <th>Company Department</th>
                <th>Assigned Role</th>
                <th>Status / Eligibility</th>
                <th>Last Login Timestamp</th>
                <th>Admin Control Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const emp = u.employee;
                return (
                  <tr key={u.id}>
                    <td>
                      <div>
                        <strong>{emp ? emp.full_name : u.email}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                        <Building2 size={14} color="var(--accent-cyan)" />
                        {emp?.department_name || 'Unassigned'}
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: '130px' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="HR_STAFF">HR_STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td>
                      {u.is_active ? (
                        <span className="badge badge-approved">Active & Eligible</span>
                      ) : (
                        <span className="badge badge-rejected">Deactivated / Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} />
                        {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleEligibility(u)}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          {u.is_active ? (
                            <>
                              <UserX size={14} /> Revoke Eligibility
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Grant Eligibility
                            </>
                          )}
                        </button>

                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleAdminResetPassword(u)}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', background: 'rgba(0, 242, 254, 0.1)', borderColor: 'rgba(0, 242, 254, 0.3)', color: 'var(--accent-cyan)' }}
                        >
                          <KeyRound size={14} /> Set Password
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserAccessWidget;
