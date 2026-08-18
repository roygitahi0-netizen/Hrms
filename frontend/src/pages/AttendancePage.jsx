import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttendanceRecords } from '../store/slices/attendanceSlice';
import { Clock, FileSpreadsheet, Filter } from 'lucide-react';

const AttendancePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { records, loading } = useSelector((state) => state.attendance);

  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    dispatch(fetchAttendanceRecords({ date: filterDate }));
  }, [dispatch, filterDate]);

  const role = user?.role || 'EMPLOYEE';
  const canExport = ['ADMIN', 'HR_STAFF', 'MANAGER'].includes(role);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Attendance Tracking & Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Daily check-in logs, total shift duration hours, and team attendance records
          </p>
        </div>

        {canExport && (
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/export/attendance-csv`}
            className="btn btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            <FileSpreadsheet size={18} color="var(--accent-emerald)" />
            Export Attendance CSV
          </a>
        )}
      </div>

      {/* Date Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Filter size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filter by Date:</span>
        </div>
        <input
          type="date"
          className="form-control"
          style={{ width: '220px' }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        {filterDate && (
          <button className="btn btn-sm btn-secondary" onClick={() => setFilterDate('')}>
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No attendance records logged for the selected criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.date}</strong></td>
                    <td>
                      <div>
                        <strong>{r.employee_name}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.department_name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--accent-emerald)' }}>
                      {r.clock_in ? new Date(r.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td style={{ color: 'var(--accent-rose)' }}>
                      {r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Working'}
                    </td>
                    <td>
                      <strong>{r.total_hours ? `${r.total_hours} hrs` : '--'}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status?.toLowerCase().replace('_', '')}`}>
                        {r.status}
                      </span>
                    </td>
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

export default AttendancePage;
