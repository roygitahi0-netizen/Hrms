import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaveRequests, fetchLeaveBalances, fetchLeaveTypes, updateLeaveStatus, setStatusFilter } from '../store/slices/leaveSlice';
import { openModal, showToast } from '../store/slices/uiSlice';
import LeaveCategoryWidget from '../components/leaves/LeaveCategoryWidget';
import { Calendar, Plus, CheckCircle, XCircle, Clock, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';

const LeavesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { requests, balances, types: leaveTypes, loading, statusFilter } = useSelector((state) => state.leaves);
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    dispatch(fetchLeaveTypes());
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

  const handleExportLeaveCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/reports/export/leave-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hrms_leave_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      dispatch(showToast({ message: 'Leave CSV report downloaded to your computer!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: 'Failed to export Leave report.', type: 'error' }));
    } finally {
      setExporting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesCategory = selectedCategory === 'ALL' || r.leave_type_id === Number(selectedCategory);
    return matchesStatus && matchesCategory;
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

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canApprove && (
            <button className="btn btn-secondary" onClick={handleExportLeaveCSV} disabled={exporting}>
              <FileSpreadsheet size={18} color="var(--accent-emerald)" />
              {exporting ? 'Exporting...' : 'Export Leave CSV'}
            </button>
          )}

          <button className="btn btn-primary" onClick={() => dispatch(openModal({ type: 'leave' }))}>
            <Plus size={18} /> Submit Time Off Request
          </button>
        </div>
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

      {/* Organization Leave Category Policy Management Widget for Admins & HR */}
      <LeaveCategoryWidget />

      {/* Request Filters & Table */}
      <div className="glass-card">
        {/* Tab & Category Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Category:</span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Leave Categories</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading leave requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No leave requests found matching the selected filters.
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
