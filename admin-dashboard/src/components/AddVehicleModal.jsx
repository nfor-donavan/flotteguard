import React, { useState } from 'react';
import Modal from './Modal';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function AddVehicleModal({ onClose, onCreated }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    plateNumber: '',
    makeModel: '',
    status: 'Available',
    currentMileage: '',
    nextOilChangeMileage: '',
    insuranceExpiry: '',
    vignetteExpiry: '',
    carteGriseNumber: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await client.post('/vehicles', {
        plateNumber: form.plateNumber,
        makeModel: form.makeModel,
        status: form.status,
        currentMileage: Number(form.currentMileage) || 0,
        nextOilChangeMileage: Number(form.nextOilChangeMileage),
        documents: {
          insuranceExpiry: form.insuranceExpiry,
          vignetteExpiry: form.vignetteExpiry,
          carteGriseNumber: form.carteGriseNumber
        }
      });
      onCreated(data.vehicle);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t('add_vehicle')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>{t('plate_number')}</label>
          <input value={form.plateNumber} onChange={(e) => update('plateNumber', e.target.value)} placeholder="LT 123-AA" required />
        </div>
        <div className="form-field">
          <label>{t('make_model')}</label>
          <input value={form.makeModel} onChange={(e) => update('makeModel', e.target.value)} placeholder="Toyota Prado VIP" required />
        </div>
        <div className="form-field">
          <label>{t('status')}</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Available">{t('status_available')}</option>
            <option value="Rented">{t('status_rented')}</option>
            <option value="Active_Taxi">{t('status_active_taxi')}</option>
            <option value="Maintenance">{t('status_maintenance')}</option>
          </select>
        </div>
        <div className="form-field">
          <label>{t('current_mileage')} (km)</label>
          <input type="number" value={form.currentMileage} onChange={(e) => update('currentMileage', e.target.value)} />
        </div>
        <div className="form-field">
          <label>{t('next_oil_change')} (km)</label>
          <input type="number" value={form.nextOilChangeMileage} onChange={(e) => update('nextOilChangeMileage', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>{t('insurance_expiry')}</label>
          <input type="date" value={form.insuranceExpiry} onChange={(e) => update('insuranceExpiry', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>{t('vignette_expiry')}</label>
          <input type="date" value={form.vignetteExpiry} onChange={(e) => update('vignetteExpiry', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>{t('carte_grise_number')}</label>
          <input value={form.carteGriseNumber} onChange={(e) => update('carteGriseNumber', e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
          {submitting ? t('adding') : t('add_vehicle')}
        </button>
      </form>
    </Modal>
  );
}
