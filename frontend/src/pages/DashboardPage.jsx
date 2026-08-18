import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import { fetchTodayStatus, clockIn, clockOut } from '../store/slices/attendanceSlice';
import { fetchLeaveBalances, fetchLeaveRequests, updateLeaveStatus } from '../store/slices/leaveSlice';
import { openModal, showToast } from '../store/slices/uiSlice';
import StatCard from '../components/common/StatCard';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { hasClockedIn, hasClockedOut, todayRecord, clockingLoading } = useSelector((state) => state.attendance);
  const { balances, requests: pendingRequests } = useSelector((state) => state.leaves);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/reports/dashboard');
      setStats(res.data.stats);
      dispatch(fetchTodayStatus());
      dispatch(fetchLeaveBalances());
      dispatch(fetchLeaveRequests({ status: 'PENDING' }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await dispatch(clockIn()).unwrap();
      dispatch(showToast({ message: 'Successfully clocked in today!', type: 'success' }));
      fetchDashboardData();
    } catch (err) {
      dispatch(showToast({ message: err || 'Clock in failed', type: 'error' }));
    }
  };

  const handleClockOut = async () => {
    try {
      await dispatch(clockOut()).unwrap();
      dispatch(showToast({ message: 'Successfully clocked out!', type: 'success' }));
      fetchDashboardData();
    } catch (err) {
      dispatch(showToast({ message: err || 'Clock out failed', type: 'error' }));
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await dispatch(updateLeaveStatus({ id, status: 'APPROVED', comment: 'Approved from dashboard' })).unwrap();
      dispatch(showToast({ message: 'Leave request approved', type: 'success' }));
      fetchDashboardData();
    } catch (err) {
      dispatch(showToast({ message: err || 'Failed to approve', type: 'error' }));
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await dispatch(updateLeaveStatus({ id, status: 'REJECTED', comment: 'Rejected from dashboard' })).unwrap();
      dispatch(showToast({ message: 'Leave request rejected', type: 'info' }));
      fetchDashboardData();
    } catch (err) {
      dispatch(showToast({ message: err || 'Failed to reject', type: 'error' }));
    }
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <div className="page-container">
      {/* Page Title & Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Centralized analytics and core HR operations summary for {user?.employee?.first_name || 'User'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => dispatch(openModal({ type: 'leave' }))}>
            <PlusCircle size={18} /> Request Time Off
          </button>
          {['ADMIN', 'HR_STAFF'].includes(role) && (
            <button className="btn btn-secondary" onClick={() => dispatch(openModal({ type: 'employee' }))}>
              <Users size={18} /> Onboard Employee
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Total Headcount"
          value={stats?.total_employees || 0}
          subtext="Active employees across org"
          color="var(--accent-cyan)"
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value={stats?.total_departments || 0}
          subtext="Active functional divisions"
          color="var(--accent-purple)"
        />
        <StatCard
          icon={UserCheck}
          label="Today Attendance Rate"
          value={`${stats?.attendance_rate || 0}%`}
          subtext={`${stats?.clocked_in_today || 0} staff clocked in today`}
          color="var(--accent-emerald)"
        />
        <StatCard
          icon={Calendar}
          label="Pending Leave Requests"
          value={stats?.pending_leaves_count || 0}
          subtext="Awaiting manager/HR approval"
          color="var(--accent-amber)"
        />
      </div>

      {/* Secondary Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Widget: Attendance Control & Pending Approvals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Employee Clock In/Out Control Widget */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Daily Attendance Clocking</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Record your daily shift presence with exact timestamps</p>
              </div>
              <span className={`badge ${hasClockedOut ? 'badge-present' : hasClockedIn ? 'badge-late' : 'badge-pending'}`}>
                {hasClockedOut ? 'Clocked Out' : hasClockedIn ? 'Working (Clocked In)' : 'Not Clocked In'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)' }}>
                  <Clock size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clock In Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {todayRecord?.clock_in ? new Date(todayRecord.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="stat-icon" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)' }}>
                  <Clock size={28} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Clock Out Time</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {todayRecord?.clock_out ? new Date(todayRecord.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                </div>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                {!hasClockedIn ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleClockIn}
                    disabled={clockingLoading}
                  >
                    <CheckCircle size={18} /> Clock In Now
                  </button>
                ) : !hasClockedOut ? (
                  <button
                    className="btn btn-secondary"
                    style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.4)' }}
                    onClick={handleClockOut}
                    disabled={clockingLoading}
                  >
                    <XCircle size={18} /> Clock Out Now
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>Shift Completed Today</span>
                )}
              </div>
            </div>
          </div>

          {/* Pending Approvals Queue (For Admin, HR Staff, Manager) */}
          {['ADMIN', 'HR_STAFF', 'MANAGER'].includes(role) && (
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pending Leave Approvals Queue</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pendingRequests.length} pending requests</span>
              </div>

              {pendingRequests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No pending leave requests requiring review.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Dates</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.slice(0, 5).map((req) => (
                        <tr key={req.id}>
                          <td>
                            <strong>{req.employee_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.department_name}</div>
                          </td>
                          <td>{req.leave_type_name}</td>
                          <td>{req.start_date} to {req.end_date}</td>
                          <td><strong>{req.total_days}</strong></td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {req.reason}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-sm btn-primary" onClick={() => handleApproveLeave(req.id)}>
                                Approve
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => handleRejectLeave(req.id)}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Widget: Leave Balances & Quick CSV Exports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Personal Leave Balances Card */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>My Leave Balances</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {balances.map((b) => {
                const pct = Math.round((b.used_days / b.allocated_days) * 100);
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600 }}>{b.leave_type_name}</span>
                      <span><strong>{b.remaining_days}</strong> / {b.allocated_days} days left</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: pct > 80 ? 'var(--gradient-danger)' : 'var(--gradient-primary)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown Widget */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Department Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.dept_breakdown?.map((d) => (
                <div key={d.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name} ({d.code})</span>
                  <span className="badge badge-employee" style={{ fontSize: '0.75rem' }}>{d.count} staff</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Reports Quick Links */}
          {['ADMIN', 'HR_STAFF', 'MANAGER'].includes(role) && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Export Reports</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/leave-csv`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <FileSpreadsheet size={18} color="var(--accent-emerald)" />
                  Export Leave Log CSV
                </a>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/attendance-csv`}
                  className="btn btn-secondary"
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <FileSpreadsheet size={18} color="var(--accent-cyan)" />
                  Export Attendance Log CSV
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
