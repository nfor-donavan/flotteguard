import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/rentals', label: 'Rentals' },
  { to: '/daily-logs', label: 'Daily Logs' },
  { to: '/staff', label: 'Staff' }
];

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/icon.png" alt="FlotteGuard" />
        <span>FlotteGuard</span>
      </div>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
          {l.label}
        </NavLink>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12.5, padding: '0 12px 8px' }}>
          {user?.name}
        </div>
        <a onClick={logout} style={{ cursor: 'pointer' }}>
          Sign out
        </a>
      </div>
    </aside>
  );
}
