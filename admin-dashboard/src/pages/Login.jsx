import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(phone, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/icon.png" alt="FlotteGuard" style={{ width: 56, height: 56, borderRadius: 14 }} />
          <h2 style={{ marginTop: 12 }}>FlotteGuard</h2>
          <p style={{ color: 'var(--ink-muted)', margin: 0, fontSize: 13 }}>Sign in to your fleet dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" required />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
