import React, { useEffect, useState } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'driver', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    client
      .get('/tenant/staff')
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await client.post('/tenant/staff', form);
      setShowModal(false);
      setForm({ name: '', phone: '', role: 'driver', password: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this person.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Staff</h1>
          <p>Managers, drivers, and renter accounts on your team</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          Add person
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Add person" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>Phone number</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="manager">Manager</option>
                <option value="driver">Driver</option>
                <option value="renter">Renter</option>
              </select>
            </div>
            <div className="form-field">
              <label>Temporary password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? 'Adding…' : 'Add person'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
