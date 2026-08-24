import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createLeaveType, updateLeaveType, deleteLeaveType, fetchLeaveTypes, fetchLeaveBalances } from '../../store/slices/leaveSlice';
import { showToast } from '../../store/slices/uiSlice';
import { Plus, Edit2, Trash2, ShieldCheck, Layers, Calendar, Check, X } from 'lucide-react';

const LeaveCategoryWidget = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { types: leaveTypes } = useSelector((state) => state.leaves);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    default_days_per_year: 20,
    description: ''
  });

  const role = user?.role || 'EMPLOYEE';
  const isAdminOrHR = ['ADMIN', 'HR_STAFF', 'MANAGER'].includes(role);

  if (!isAdminOrHR) return null;

  const handleOpenAdd = () => {
    setFormData({ name: '', default_days_per_year: 20, description: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (type) => {
    setFormData({
      name: type.name,
      default_days_per_year: type.default_days_per_year,
      description: type.description || ''
    });
    setEditingId(type.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await dispatch(updateLeaveType({ id: editingId, ...formData })).unwrap();
        dispatch(showToast({ message: `Leave category "${formData.name}" updated successfully`, type: 'success' }));
      } else {
        await dispatch(createLeaveType(formData)).unwrap();
        dispatch(showToast({ message: `Leave category "${formData.name}" created with employee allocations`, type: 'success' }));
      }
      dispatch(fetchLeaveTypes());
      dispatch(fetchLeaveBalances());
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      dispatch(showToast({ message: err || 'Action failed', type: 'error' }));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete leave category "${name}"?`)) return;

    try {
      await dispatch(deleteLeaveType(id)).unwrap();
      dispatch(showToast({ message: `Leave category "${name}" deleted`, type: 'info' }));
      dispatch(fetchLeaveTypes());
      dispatch(fetchLeaveBalances());
    } catch (err) {
      dispatch(showToast({ message: err || 'Delete failed', type: 'error' }));
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Organization Leave Categories</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Manage organization leave policy types, annual day allocations, and employee entitlement quotas
          </p>
        </div>

        {!isAdding && (
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ padding: '0.6rem 1.1rem', fontSize: '0.85rem' }}>
            <Plus size={16} /> Add Leave Category
          </button>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isAdding && (
        <form onSubmit={handleSubmit} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-cyan)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
            {editingId ? 'Edit Leave Category' : 'Create New Leave Category'}
          </h4>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Study Leave, Maternity Leave"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default Days Per Year *</label>
              <input
                type="number"
                className="form-control"
                min="1"
                max="365"
                value={formData.default_days_per_year}
                onChange={(e) => setFormData({ ...formData, default_days_per_year: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category Description / Policy Notes</label>
            <input
              type="text"
              className="form-control"
              placeholder="Brief description of eligibility or policy details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              <X size={16} /> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> {editingId ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      )}

      {/* Category Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {leaveTypes.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{t.name}</h4>
                <span className="badge badge-hr" style={{ fontSize: '0.75rem' }}>
                  {t.default_days_per_year} days/yr
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {t.description || 'Standard organization policy category.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => handleOpenEdit(t)}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="btn btn-sm btn-secondary" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDelete(t.id, t.name)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveCategoryWidget;
