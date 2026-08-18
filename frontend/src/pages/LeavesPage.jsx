import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaveRequests, fetchLeaveBalances, updateLeaveStatus, setStatusFilter } from '../store/slices/leaveSlice';
import { openModal, showToast } from '../store/slices/uiSlice';
import { Calendar, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const LeavesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { requests, balances, loading, statusFilter } = useSelector((state) => state.leaves);

  useEffect(() => {
    dispatch(fetchLeaveBalances());
    dispatch(fetchLeaveRequests());
  }, [dispatch]);

  const handleStatusUpdate = async (id, status) => {
    const comment = window.prompt(`Optional comment for setting status to ${status}:`, '');
    if (comment === null) return; // User cancelled prompt

    try {
      await dispatch(updateLeaveStatus({ id, status, comment })).unwrap();
      dispatch(showToast({ message: `Leave request ${status.toLowerCase()} successfully`, type: 'success' }));
      dispatch(fetchLeaveBalances());
    } catch (err) {
      dispatch(showToast({ message: err || 'Status update failed', type: 'error' }));
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const role = user?.role || 'EMPLOYEE';
  const canApprove = ['ADMIN', 'HR_STAFF', 'MANAGER'].includes(role);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Leave Management & History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Submit time off requests, track approval statuses, and manage remaining leave allocations
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => dispatch(openModal({ type: 'leave' }))}>
          <Plus size={18} /> Submit Time Off Request
        </button>
      </div>

      {/* Leave Balances Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {balances.map((b) => (
          <div key={b.id} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              {b.leave_type_name}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '0.25rem 0' }}>
              {b.remaining_days} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>days left</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Allocated: {b.allocated_days} | Used: {b.used_days}
            </div>
          </div>
        ))}
      </div>

      {/* Request Filters & Table */}
      <div className="glass-card">
        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => dispatch(setStatusFilter(st))}
            >
              {st}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading leave requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leave requests found in this category.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer & Note</th>
                  {canApprove && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.employee_name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.department_name}</div>
                    </td>
                    <td><span className="badge badge-hr">{req.leave_type_name}</span></td>
                    <td>{req.start_date}</td>
                    <td>{req.end_date}</td>
                    <td><strong>{req.total_days} days</strong></td>
                    <td style={{ maxWidth: '220px' }}>{req.reason}</td>
                    <td>
                      <span className={`badge badge-${req.status?.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.reviewer_name ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.reviewer_name}</div>
                          {req.reviewer_comment && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>"{req.reviewer_comment}"</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting review</span>
                      )}
                    </td>
                    {canApprove && (
                      <td>
                        {req.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</span>
                        )}
                      </td>
                    )}
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

export default LeavesPage;
