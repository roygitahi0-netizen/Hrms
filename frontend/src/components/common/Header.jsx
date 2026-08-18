import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markNotificationsRead } from '../../store/slices/notificationSlice';
import { openModal } from '../../store/slices/uiSlice';
import { Bell, LogOut, User as UserIcon, Check } from 'lucide-react';

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount, list: notifications } = useSelector((state) => state.notifications);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleOpenMyProfile = () => {
    if (user?.employee) {
      dispatch(openModal({ type: 'employee', data: { ...user.employee, isSelfEdit: true } }));
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'HR_STAFF': return 'badge-hr';
      case 'MANAGER': return 'badge-manager';
      default: return 'badge-employee';
    }
  };

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Welcome back, {user?.employee?.first_name || user?.email}</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {user?.employee?.department_name || 'Organization'} • {user?.employee?.position_title || 'Staff Member'}
        </span>
      </div>

      <div className="user-profile-widget">
        {/* Notifications dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{ position: 'relative', borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-rose)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                right: 0,
                top: '50px',
                width: '340px',
                zIndex: 100,
                padding: '1rem',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => dispatch(markNotificationsRead())}
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No notifications yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: n.is_read ? 'transparent' : 'rgba(0, 242, 254, 0.08)',
                        borderLeft: `3px solid ${n.type === 'danger' ? 'var(--accent-rose)' : n.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}`,
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Badge */}
        <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
          {user?.role?.replace('_', ' ')}
        </span>

        {/* Avatar / Profile */}
        <button
          className="user-avatar"
          style={{ cursor: 'pointer', border: 'none' }}
          onClick={handleOpenMyProfile}
          title="View / Edit Profile"
        >
          {user?.employee?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
        </button>

        {/* Logout */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleLogout}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
