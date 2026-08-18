import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Clock,
  ShieldCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'EMPLOYEE';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Employees', path: '/employees', icon: Users, roles: ['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Departments', path: '/departments', icon: Building2, roles: ['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Leave Requests', path: '/leaves', icon: Calendar, roles: ['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Attendance', path: '/attendance', icon: Clock, roles: ['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, roles: ['ADMIN', 'HR_STAFF'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">TH</div>
        <div>
          <h1 className="logo-text">Team Hub</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Workforce Suite</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Team Hub Enterprise v2.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
