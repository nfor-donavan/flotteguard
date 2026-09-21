import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ isOpen, onNavigate }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  const links = [
    { to: '/', label: t('nav_dashboard'), end: true },
    { to: '/vehicles', label: t('nav_vehicles') },
    { to: '/rentals', label: t('nav_rentals') },
    { to: '/daily-logs', label: t('nav_daily_logs') },
    { to: '/staff', label: t('nav_staff') }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/icon.png" alt="FlotteGuard" />
        <span>FlotteGuard</span>
      </div>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} onClick={onNavigate} className={({ isActive }) => (isActive ? 'active' : '')}>
          {l.label}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto' }}>
        <div className="sidebar-controls">
          <button className="pill-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button className="pill-toggle" onClick={toggleLanguage}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12.5, padding: '0 12px 8px' }}>{user?.name}</div>
        <a onClick={logout} style={{ cursor: 'pointer' }}>
          {t('sign_out')}
        </a>
      </div>
    </aside>
  );
}
