import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, createPosition } from '../../store/slices/departmentSlice';
import { closeModal, showToast } from '../../store/slices/uiSlice';
import Modal from '../common/Modal';

const DepartmentModal = () => {
  const dispatch = useDispatch();
  const { activeModal, modalData } = useSelector((state) => state.ui);
  const { list: employees } = useSelector((state) => state.employees);
  const { departments } = useSelector((state) => state.departments);

  const isPositionMode = modalData?.isPosition;

  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', manager_id: '' });
  const [posForm, setPosForm] = useState({ title: '', department_id: departments[0]?.id || '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isPositionMode) {
        await dispatch(createPosition(posForm)).unwrap();
        dispatch(showToast({ message: 'Job Position created successfully!', type: 'success' }));
      } else {
        await dispatch(createDepartment(deptForm)).unwrap();
        dispatch(showToast({ message: 'Department created successfully!', type: 'success' }));
      }
      dispatch(closeModal());
    } catch (err) {
      dispatch(showToast({ message: err || 'Creation failed', type: 'error' }));
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'department'}
      onClose={() => dispatch(closeModal())}
      title={isPositionMode ? 'Create New Job Position' : 'Create New Department'}
    >
      <form onSubmit={handleSubmit}>
        {isPositionMode ? (
          <>
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input
                type="text"
                className="form-control"
                value={posForm.title}
                onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                placeholder="e.g. Senior Backend Engineer"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-control"
                value={posForm.department_id}
                onChange={(e) => setPosForm({ ...posForm, department_id: e.target.value })}
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={posForm.description}
                onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Marketing"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MKT"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department Head / Manager</label>
              <select
                className="form-control"
                value={deptForm.manager_id}
                onChange={(e) => setDeptForm({ ...deptForm, manager_id: e.target.value })}
              >
                <option value="">No Manager Assigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(closeModal())}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DepartmentModal;
