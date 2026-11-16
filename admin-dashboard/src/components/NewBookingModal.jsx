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
    totalCost: '',
    driverId: ''
  });
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
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

  // Only drivers free for the chosen dates can be assigned. If the dates
  // change and the current pick becomes busy, clear it.
  useEffect(() => {
    if (!form.startDate || !form.endDate) {
      setDrivers([]);
      return;
    }
    setLoadingDrivers(true);
    client
      .get('/drivers', { params: { startDate: form.startDate, endDate: form.endDate } })
      .then((res) => {
        const list = res.data.drivers || [];
        setDrivers(list);
        setForm((f) => {
          const pick = list.find((d) => d._id === f.driverId);
          return pick && pick.available === false ? { ...f, driverId: '' } : f;
        });
      })
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, [form.startDate, form.endDate]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { driverId, ...rest } = form;
      const { data } = await client.post('/rentals', {
        ...rest,
        ...(driverId ? { driverId } : {}),
        securityDeposit: Number(form.securityDeposit) || 0,
        totalCost: Number(form.totalCost) || 0
      });
      onCreated(data.contract);
    } catch (err) {
      const serverMessage = err.response?.data?.error || '';
      let message = err.response?.status === 409 ? t('booking_conflict_error') : serverMessage || t('booking_generic_error');
      if (err.response?.status === 409 && /driver/i.test(serverMessage)) message = t('driver_conflict_error');
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
        <div className="form-row">
          <div className="form-field">
            <label>{t('start_date')}</label>
            <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>{t('end_date')}</label>
            <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required />
          </div>
        </div>

        {checkingAvailability && <p className="hint-line">{t('checking_availability')}</p>}
        {availability === true && <p className="hint-line ok">{t('available_for_dates')}</p>}
        {availability === false && <p className="hint-line bad">{t('already_booked')}</p>}

        <div className="form-field">
          <label>{t('chauffeur_optional')}</label>
          <select value={form.driverId} onChange={(e) => update('driverId', e.target.value)} disabled={!form.startDate || !form.endDate || loadingDrivers}>
            <option value="">{t('self_drive')}</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id} disabled={d.available === false}>
                {d.name}
                {d.available === false ? ` — ${t('driver_busy')}` : ''}
              </option>
            ))}
          </select>
          {(!form.startDate || !form.endDate) && <span className="muted-small">{t('pick_dates_for_drivers')}</span>}
        </div>

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
        <div className="form-row">
          <div className="form-field">
            <label>{t('security_deposit')}</label>
            <input type="number" value={form.securityDeposit} onChange={(e) => update('securityDeposit', e.target.value)} required />
          </div>
          <div className="form-field">
            <label>{t('total_cost')}</label>
            <input type="number" value={form.totalCost} onChange={(e) => update('totalCost', e.target.value)} required />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button
          className="btn btn-primary btn-block"
          disabled={submitting || availability === false}
        >
          {submitting ? t('booking') : t('confirm_booking')}
        </button>
      </form>
    </Modal>
  );
}
