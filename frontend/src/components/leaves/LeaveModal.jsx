import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitLeaveRequest } from '../../store/slices/leaveSlice';
import { closeModal, showToast } from '../../store/slices/uiSlice';
import Modal from '../common/Modal';

const LeaveModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { types: leaveTypes, balances } = useSelector((state) => state.leaves);

  const [formData, setFormData] = useState({
    leave_type_id: leaveTypes[0]?.id || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const selectedBalance = balances.find((b) => b.leave_type_id === Number(formData.leave_type_id));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(submitLeaveRequest(formData)).unwrap();
      dispatch(showToast({ message: 'Leave request submitted successfully!', type: 'success' }));
      dispatch(closeModal());
    } catch (err) {
      dispatch(showToast({ message: err || 'Submission failed', type: 'error' }));
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'leave'}
      onClose={() => dispatch(closeModal())}
      title="Request Time Off"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Leave Type *</label>
          <select
            name="leave_type_id"
            className="form-control"
            value={formData.leave_type_id}
            onChange={handleChange}
            required
          >
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.default_days_per_year} days/yr)
              </option>
            ))}
          </select>
        </div>

        {selectedBalance && (
          <div style={{ margin: '-0.5rem 0 1rem', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
            Available balance: <strong>{selectedBalance.remaining_days} days</strong> remaining out of {selectedBalance.allocated_days} days.
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              name="start_date"
              className="form-control"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              name="end_date"
              className="form-control"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reason for Request *</label>
          <textarea
            name="reason"
            className="form-control"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Please provide details for your manager's review..."
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(closeModal())}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveModal;
