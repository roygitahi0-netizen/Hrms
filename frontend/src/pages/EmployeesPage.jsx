import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee, setSearchTerm, setDepartmentFilter, setStatusFilter } from '../store/slices/employeeSlice';
import { fetchDepartments, fetchPositions } from '../store/slices/departmentSlice';
import { openModal, showToast } from '../store/slices/uiSlice';
import { Search, Filter, Plus, Edit, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

const EmployeesPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { list: employees, loading, searchTerm, departmentFilter, statusFilter } = useSelector((state) => state.employees);
  const { departments } = useSelector((state) => state.departments);

  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchPositions());
    dispatch(fetchEmployees({
      search: searchTerm,
      department_id: departmentFilter,
      status: statusFilter
    }));
  }, [dispatch, searchTerm, departmentFilter, statusFilter]);

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleSoftDelete = async (emp) => {
    if (window.confirm(`Are you sure you want to soft delete employee profile for ${emp.full_name}?`)) {
      try {
        await dispatch(deleteEmployee(emp.id)).unwrap();
        dispatch(showToast({ message: `Employee ${emp.full_name} soft deleted.`, type: 'success' }));
      } catch (err) {
        dispatch(showToast({ message: err || 'Soft delete failed', type: 'error' }));
      }
    }
  };

  const role = user?.role || 'EMPLOYEE';
  const isAdminOrHR = ['ADMIN', 'HR_STAFF'].includes(role);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Employee Records Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Maintain single source of truth for organization headcount, profiles, and roles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdminOrHR && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                title="Toggle sensitive columns (Salary & National ID)"
              >
                {showSensitiveInfo ? <EyeOff size={18} /> : <Eye size={18} />}
                {showSensitiveInfo ? 'Hide Sensitive Data' : 'Show Sensitive Data'}
              </button>
              <button className="btn btn-primary" onClick={() => dispatch(openModal({ type: 'employee' }))}>
                <Plus size={18} /> Onboard New Employee
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, email, employee code..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="form-control"
            value={departmentFilter}
            onChange={(e) => dispatch(setDepartmentFilter(e.target.value))}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
          >
            <option value="">All Statuses</option>
            <option value="FULL_TIME">Full-Time</option>
            <option value="PART_TIME">Part-Time</option>
            <option value="CONTRACT">Contract</option>
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading employee profiles...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No employee records found matching filter criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Full Name</th>
                  <th>Department & Position</th>
                  <th>Contact Info & Location</th>
                  <th>Status</th>
                  <th>Hire Date</th>
                  {isAdminOrHR && showSensitiveInfo && <th>Salary ($)</th>}
                  {isAdminOrHR && showSensitiveInfo && <th>National ID</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{emp.employee_code}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{emp.full_name}</strong>
                        <span className={`badge badge-${emp.role?.toLowerCase().replace('_', '')}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>
                          {emp.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp.department_name || 'Unassigned'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.position_title || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{emp.phone || 'N/A'}</div>
                      {emp.country && <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>📍 {emp.country}</div>}
                    </td>
                    <td>
                      <span className="badge badge-present">{emp.employment_status?.replace('_', ' ')}</span>
                    </td>
                    <td>{emp.hire_date || 'N/A'}</td>
                    {isAdminOrHR && showSensitiveInfo && (
                      <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {emp.salary ? `$${emp.salary.toLocaleString()}` : 'N/A'}
                      </td>
                    )}
                    {isAdminOrHR && showSensitiveInfo && (
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{emp.national_id || 'N/A'}</td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => dispatch(openModal({ type: 'employee', data: emp }))}
                          title="Edit Profile"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        {isAdminOrHR && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleSoftDelete(emp)}
                            title="Soft Delete Employee"
                          >
                            <Trash2 size={14} /> Soft Delete
                          </button>
                        )}
                      </div>
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

export default EmployeesPage;
