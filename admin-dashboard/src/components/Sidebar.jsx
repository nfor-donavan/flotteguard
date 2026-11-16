import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';
import Avatar from './Avatar';

export default function Sidebar({ isOpen, onNavigate }) {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  const links = [
    { to: '/', label: t('nav_dashboard'), icon: 'dashboard', end: true },
    { to: '/vehicles', label: t('nav_vehicles'), icon: 'car' },
    { to: '/rentals', label: t('nav_rentals'), icon: 'key' },
    { to: '/drivers', label: t('nav_drivers'), icon: 'steering' },
    { to: '/daily-logs', label: t('nav_daily_logs'), icon: 'receipt' },
    { to: '/staff', label: t('nav_staff'), icon: 'users' }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/icon.png" alt="FlotteGuard" />
        <span>FlotteGuard</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name={l.icon} size={18} />
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-controls">
          <button className="pill-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button className="pill-toggle" onClick={toggleLanguage}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
        <div className="sidebar-user">
          <Avatar name={user?.name} src={user?.photoUrl} size={30} />
          <div>
            <b>{user?.name}</b>
            <a onClick={logout} className="signout">
              {t('sign_out')}
            </a>
          </div>
        </div>
        <div className="sidebar-powered-by">
          <img src="/nexus-emblem.png" alt="Nexus Tech Labs" />
          <span>{t('powered_by')}</span>
        </div>
      </div>
    </aside>
  );
}
