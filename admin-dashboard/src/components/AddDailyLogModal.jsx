import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function AddDailyLogModal({ onClose, onCreated }) {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicleId: '',
    driverName: '',
    expectedRevenue: '',
    submittedRevenue: '',
    fuelExpense: '0'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/vehicles', { params: { status: 'Active_Taxi' } }).then((res) => setVehicles(res.data.vehicles));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await client.post('/daily-logs', {
        ...form,
        expectedRevenue: Number(form.expectedRevenue),
        submittedRevenue: Number(form.submittedRevenue),
        fuelExpense: Number(form.fuelExpense) || 0
      });
      onCreated(data.log);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record this log.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t('record_daily_turn_in')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>{t('vehicle')}</label>
          <select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} required>
            <option value="" disabled>
              {t('select_a_vehicle')}
            </option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.plateNumber} — {v.makeModel}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>{t('driver_name')}</label>
          <input value={form.driverName} onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label>{t('expected_revenue')}</label>
          <input
            type="number"
            value={form.expectedRevenue}
            onChange={(e) => setForm((f) => ({ ...f, expectedRevenue: e.target.value }))}
            required
          />
        </div>
        <div className="form-field">
          <label>{t('submitted_revenue')}</label>
          <input
            type="number"
            value={form.submittedRevenue}
            onChange={(e) => setForm((f) => ({ ...f, submittedRevenue: e.target.value }))}
            required
          />
        </div>
        <div className="form-field">
          <label>{t('fuel_expense')}</label>
          <input type="number" value={form.fuelExpense} onChange={(e) => setForm((f) => ({ ...f, fuelExpense: e.target.value }))} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
          {submitting ? t('saving') : t('record_turn_in')}
        </button>
      </form>
    </Modal>
  );
}
