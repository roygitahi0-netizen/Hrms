import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDepartments, fetchPositions } from '../store/slices/departmentSlice';
import { openModal } from '../store/slices/uiSlice';
import { Building2, Plus, Briefcase, Users, UserCheck } from 'lucide-react';

const DepartmentsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { departments, positions, loading } = useSelector((state) => state.departments);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchPositions());
  }, [dispatch]);

  const isAdminOrHR = ['ADMIN', 'HR_STAFF'].includes(user?.role);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Departments & Job Positions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure organizational divisions, department managers, and positions
          </p>
        </div>

        {isAdminOrHR && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => dispatch(openModal({ type: 'department', data: { isPosition: true } }))}>
              <Briefcase size={18} /> Add Position
            </button>
            <button className="btn btn-primary" onClick={() => dispatch(openModal({ type: 'department', data: { isPosition: false } }))}>
              <Plus size={18} /> Add Department
            </button>
          </div>
        )}
      </div>

      {/* Departments Cards Grid */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Building2 color="var(--accent-cyan)" size={22} /> Organization Departments ({departments.length})
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {departments.map((dept) => (
          <div key={dept.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{dept.name}</div>
                <span className="badge badge-hr">{dept.code}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', minHeight: '40px' }}>
                {dept.description || 'No department description set.'}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <UserCheck size={16} color="var(--accent-amber)" />
                <span>Head: <strong>{dept.manager?.name || 'Unassigned'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                <Users size={16} />
                <span>{dept.employee_count} Staff</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Positions Table Section */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Briefcase color="var(--accent-purple)" size={22} /> Defined Job Positions ({positions.length})
      </h2>

      <div className="glass-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Description</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id}>
                  <td><strong>{pos.title}</strong></td>
                  <td><span className="badge badge-manager">{pos.department_name}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{pos.description || 'N/A'}</td>
                  <td>{pos.created_at ? new Date(pos.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
