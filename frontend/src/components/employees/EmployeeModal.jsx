import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, updateEmployee } from '../../store/slices/employeeSlice';
import { setEmployeeData } from '../../store/slices/authSlice';
import { closeModal, showToast } from '../../store/slices/uiSlice';
import Modal from '../common/Modal';

const EmployeeModal = () => {
  const dispatch = useDispatch();
  const { activeModal, modalData } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { departments, positions } = useSelector((state) => state.departments);
  const { list: employees } = useSelector((state) => state.employees);

  const isEditing = !!modalData?.id;
  const isSelfEdit = modalData?.isSelfEdit || (isEditing && user?.employee?.id === modalData?.id && user?.role === 'EMPLOYEE');
  const isAdminOrHR = ['ADMIN', 'HR_STAFF'].includes(user?.role);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    department_id: '',
    position_id: '',
    manager_id: '',
    employment_status: 'FULL_TIME',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    national_id: '',
    role: 'EMPLOYEE',
    password: 'password123',
  });

  useEffect(() => {
    if (modalData) {
      setFormData({
        first_name: modalData.first_name || '',
        last_name: modalData.last_name || '',
        email: modalData.email || '',
        phone: modalData.phone || '',
        country: modalData.country || '',
        address: modalData.address || '',
        emergency_contact_name: modalData.emergency_contact_name || '',
        emergency_contact_phone: modalData.emergency_contact_phone || '',
        department_id: modalData.department_id || '',
        position_id: modalData.position_id || '',
        manager_id: modalData.manager_id || '',
        employment_status: modalData.employment_status || 'FULL_TIME',
        hire_date: modalData.hire_date || new Date().toISOString().split('T')[0],
        salary: modalData.salary || '',
        national_id: modalData.national_id || '',
        role: modalData.role || 'EMPLOYEE',
        password: '',
      });
    }
  }, [modalData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const updated = await dispatch(updateEmployee({ id: modalData.id, data: formData })).unwrap();
        if (isSelfEdit) {
          dispatch(setEmployeeData(updated));
        }
        dispatch(showToast({ message: 'Employee profile updated successfully!', type: 'success' }));
      } else {
        await dispatch(createEmployee(formData)).unwrap();
        dispatch(showToast({ message: 'New employee created successfully!', type: 'success' }));
      }
      dispatch(closeModal());
    } catch (err) {
      dispatch(showToast({ message: err || 'Operation failed', type: 'error' }));
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'employee'}
      onClose={() => dispatch(closeModal())}
      title={isEditing ? (isSelfEdit ? 'My Profile Self-Service' : 'Edit Employee Profile') : 'Onboard New Employee'}
    >
      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="first_name"
              className="form-control"
              value={formData.first_name}
              onChange={handleChange}
              disabled={isSelfEdit}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              name="last_name"
              className="form-control"
              value={formData.last_name}
              onChange={handleChange}
              disabled={isSelfEdit}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            disabled={isEditing}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              className="form-control"
              value={formData.country}
              onChange={handleChange}
              placeholder="e.g. Kenya, United States"
            />
          </div>
        </div>

        {/* Address & Emergency Contacts (Self-Service Allowed) */}
        <div className="form-group">
          <label className="form-label">Residential Address</label>
          <input
            type="text"
            name="address"
            className="form-control"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street address, City, State"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Emergency Contact Name</label>
            <input
              type="text"
              name="emergency_contact_name"
              className="form-control"
              value={formData.emergency_contact_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact Phone</label>
            <input
              type="text"
              name="emergency_contact_phone"
              className="form-control"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* HR / Admin Only Section */}
        {isAdminOrHR && !isSelfEdit && (
          <>
            <div style={{ margin: '1rem 0 0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
              Employment Details (HR Management)
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  name="department_id"
                  className="form-control"
                  value={formData.department_id}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Job Position</label>
                <select
                  name="position_id"
                  className="form-control"
                  value={formData.position_id}
                  onChange={handleChange}
                >
                  <option value="">Select Position</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reporting Manager</label>
                <select
                  name="manager_id"
                  className="form-control"
                  value={formData.manager_id}
                  onChange={handleChange}
                >
                  <option value="">No Direct Manager</option>
                  {employees.filter(e => e.id !== modalData?.id).map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.department_name || 'N/A'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Employment Status</label>
                <select
                  name="employment_status"
                  className="form-control"
                  value={formData.employment_status}
                  onChange={handleChange}
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  className="form-control"
                  value={formData.hire_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Access Role</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_STAFF">HR Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* Sensitive Fields Section */}
            <div style={{ margin: '1rem 0 0.5rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-amber)' }}>
              Sensitive Information (Restricted Access)
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Annual Base Salary ($)</label>
                <input
                  type="number"
                  name="salary"
                  className="form-control"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="e.g. 85000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">National ID / SSN</label>
                <input
                  type="text"
                  name="national_id"
                  className="form-control"
                  value={formData.national_id}
                  onChange={handleChange}
                  placeholder="e.g. SSN-998877661"
                />
              </div>
            </div>

            {!isEditing && (
              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(closeModal())}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;
