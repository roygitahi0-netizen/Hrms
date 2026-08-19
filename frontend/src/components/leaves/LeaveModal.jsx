import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitLeaveRequest } from '../../store/slices/leaveSlice';
import { closeModal, showToast } from '../../store/slices/uiSlice';
import Modal from '../common/Modal';
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  Sparkles,
  Info,
  Check,
  Palmtree,
  Stethoscope,
  Coffee,
  Heart
} from 'lucide-react';

const LeaveModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { types: leaveTypes, balances } = useSelector((state) => state.leaves);

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [calcDays, setCalcDays] = useState(1);

  // Set default leave type when types load
  useEffect(() => {
    if (leaveTypes && leaveTypes.length > 0 && !formData.leave_type_id) {
      setFormData((prev) => ({ ...prev, leave_type_id: leaveTypes[0].id }));
    }
  }, [leaveTypes, formData.leave_type_id]);

  // Calculate day difference dynamically
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalcDays(diffDays);
      } else {
        setCalcDays(0);
      }
    }
  }, [formData.start_date, formData.end_date]);

  const selectedBalance = balances.find((b) => b.leave_type_id === Number(formData.leave_type_id));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (calcDays <= 0) {
      dispatch(showToast({ message: 'End date must be on or after start date.', type: 'error' }));
      return;
    }

    try {
      await dispatch(submitLeaveRequest({
        ...formData,
        leave_type_id: Number(formData.leave_type_id)
      })).unwrap();
      dispatch(showToast({ message: 'Leave request submitted successfully!', type: 'success' }));
      dispatch(closeModal());
    } catch (err) {
      dispatch(showToast({ message: err || 'Submission failed', type: 'error' }));
    }
  };

  // Icon & color styling map for leave types
  const typeStyleMap = {
    'Annual Leave': { icon: Palmtree, color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.12)' },
    'Sick Leave': { icon: Stethoscope, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
    'Casual Leave': { icon: Coffee, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    'Parental Leave': { icon: Heart, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
  };

  const getTypeStyle = (name) => {
    return typeStyleMap[name] || { icon: CalendarIcon, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' };
  };

  return (
    <Modal
      isOpen={activeModal === 'leave'}
      onClose={() => dispatch(closeModal())}
      title="Request Time Off"
    >
      <form onSubmit={handleSubmit}>
        {/* Subtitle / Context Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Select your leave category, specify the dates, and submit your request for automated balance tracking and approval.
          </p>
        </div>

        {/* Leave Type Cards Picker */}
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Select Leave Category *</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Automated Balance Tracking</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {leaveTypes.map((t) => {
              const isSelected = String(formData.leave_type_id) === String(t.id);
              const style = getTypeStyle(t.name);
              const Icon = style.icon;
              const bal = balances.find((b) => b.leave_type_id === t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => setFormData({ ...formData, leave_type_id: t.id })}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? style.bg : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${isSelected ? style.color : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? `0 0 12px ${style.bg}` : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={18} color={style.color} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isSelected ? style.color : '#ffffff' }}>
                        {t.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={12} color="#000000" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {bal ? (
                      <span><strong>{bal.remaining_days}</strong> / {bal.allocated_days} days left</span>
                    ) : (
                      <span>{t.default_days_per_year} days/yr</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Balance Info Banner */}
        {selectedBalance && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              margin: '0.5rem 0 1.25rem',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Info size={16} color="var(--accent-cyan)" />
              <span>Available Allocation:</span>
            </div>
            <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {selectedBalance.remaining_days} Days Remaining
            </span>
          </div>
        )}

        {/* Date Row with Dynamic Duration Calculation */}
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

        {/* Dynamic Duration Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="var(--accent-purple)" /> Calculated Request Duration:
          </span>
          <span style={{ fontWeight: 800, color: calcDays > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {calcDays > 0 ? `${calcDays} ${calcDays === 1 ? 'Day' : 'Days'}` : 'Invalid Date Range'}
          </span>
        </div>

        {/* Reason Textarea */}
        <div className="form-group">
          <label className="form-label">Reason for Request *</label>
          <textarea
            name="reason"
            className="form-control"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Specify reason or context for your time off request..."
            required
          />
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(closeModal())}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            <Send size={16} /> Submit Time Off Request
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveModal;
