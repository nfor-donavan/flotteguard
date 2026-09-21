import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const year = new Date().getFullYear();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('login_error_default'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-brand-panel">
        <div className="login-brand-top">
          <img src="/icon.png" alt="FlotteGuard" />
          <span>{t('login_title')}</span>
        </div>
        <div className="login-tagline">{t('login_tagline')}</div>
        <div className="login-copyright">{t('copyright', { year })}</div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-controls">
          <button type="button" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button type="button" onClick={toggleLanguage}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>
        </div>

        <div className="login-card">
          <h2 style={{ marginBottom: 4 }}>{t('login_heading')}</h2>
          <p style={{ color: 'var(--ink-muted)', margin: '0 0 24px', fontSize: 13.5 }}>{t('login_subheading')}</p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>{t('phone_number')}</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" required />
            </div>
            <div className="form-field">
              <label>{t('password')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? t('signing_in') : t('sign_in')}
            </button>
          </form>

          <p className="login-mobile-copyright">{t('copyright', { year })}</p>
        </div>
      </div>
    </div>
  );
}
