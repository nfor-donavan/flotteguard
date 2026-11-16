import React, { useEffect, useState } from 'react';
import client from '../api/client';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import { SkeletonTable } from '../components/Skeleton';
import { useLanguage } from '../context/LanguageContext';

export default function Staff() {
  const { t } = useLanguage();
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
          <h1>{t('staff_title')}</h1>
          <p>{t('staff_subtitle')}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={16} />
          {t('add_person')}
        </button>
      </div>

      <div className="card flush">
        {loading ? (
          <SkeletonTable />
        ) : users.length === 0 ? (
          <EmptyState icon="users" title={t('no_staff_title')} text={t('no_staff_text')} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col_name')}</th>
                  <th>{t('col_phone')}</th>
                  <th>{t('col_role')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="cell-media">
                        <Avatar name={u.name} src={u.photoUrl} size={32} />
                        <b>{u.name}</b>
                      </div>
                    </td>
                    <td>{u.phone}</td>
                    <td>
                      <span className={`role-pill ${u.role}`}>{t(`role_${u.role}`) === `role_${u.role}` ? u.role : t(`role_${u.role}`)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={t('add_person')} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>{t('full_name')}</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>{t('phone_number')}</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="form-field">
              <label>{t('role')}</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="manager">{t('role_manager')}</option>
                <option value="driver">{t('role_driver')}</option>
                <option value="renter">{t('role_renter')}</option>
              </select>
            </div>
            <div className="form-field">
              <label>{t('temporary_password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? t('adding') : t('add_person')}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
