import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function NewBookingModal({ onClose, onCreated }) {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicleId: '',
    clientName: '',
    clientPhone: '',
    clientIdPassport: '',
    startDate: '',
    endDate: '',
    securityDeposit: '',
    totalCost: ''
  });
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/vehicles').then((res) => setVehicles(res.data.vehicles));
  }, []);

  useEffect(() => {
    if (!form.vehicleId || !form.startDate || !form.endDate) {
      setAvailability(null);
      return;
    }
    setCheckingAvailability(true);
    const timeout = setTimeout(() => {
      client
        .get('/rentals/availability', {
          params: { vehicleId: form.vehicleId, startDate: form.startDate, endDate: form.endDate }
        })
        .then((res) => setAvailability(res.data.available))
        .catch(() => setAvailability(null))
        .finally(() => setCheckingAvailability(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.vehicleId, form.startDate, form.endDate]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await client.post('/rentals', {
        ...form,
        securityDeposit: Number(form.securityDeposit) || 0,
        totalCost: Number(form.totalCost) || 0
      });
      onCreated(data.contract);
    } catch (err) {
      const message = err.response?.status === 409 ? t('booking_conflict_error') : err.response?.data?.error || t('booking_generic_error');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t('new_booking')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>{t('vehicle')}</label>
          <select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} required>
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
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>{t('start_date')}</label>
            <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>{t('end_date')}</label>
            <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required />
          </div>
        </div>

        {checkingAvailability && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: -8 }}>{t('checking_availability')}</p>}
        {availability === true && <p style={{ fontSize: 13, color: 'var(--success)', marginTop: -8 }}>{t('available_for_dates')}</p>}
        {availability === false && <p className="error-text" style={{ marginTop: -8 }}>{t('already_booked')}</p>}

        <div className="form-field">
          <label>{t('client_name')}</label>
          <input value={form.clientName} onChange={(e) => update('clientName', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>{t('client_phone')}</label>
          <input value={form.clientPhone} onChange={(e) => update('clientPhone', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>{t('id_passport_number')}</label>
          <input value={form.clientIdPassport} onChange={(e) => update('clientIdPassport', e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>{t('security_deposit')}</label>
            <input type="number" value={form.securityDeposit} onChange={(e) => update('securityDeposit', e.target.value)} required />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>{t('total_cost')}</label>
            <input type="number" value={form.totalCost} onChange={(e) => update('totalCost', e.target.value)} required />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={submitting || availability === false}
        >
          {submitting ? t('booking') : t('confirm_booking')}
        </button>
      </form>
    </Modal>
  );
}
