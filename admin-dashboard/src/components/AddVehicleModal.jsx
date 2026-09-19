import React, { useState } from 'react';
import Modal from './Modal';
import client from '../api/client';

export default function AddVehicleModal({ onClose, onCreated }) {
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
    <Modal title="Add vehicle" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Plate number</label>
          <input value={form.plateNumber} onChange={(e) => update('plateNumber', e.target.value)} placeholder="LT 123-AA" required />
        </div>
        <div className="form-field">
          <label>Make / model</label>
          <input value={form.makeModel} onChange={(e) => update('makeModel', e.target.value)} placeholder="Toyota Prado VIP" required />
        </div>
        <div className="form-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Active_Taxi">Active taxi</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
        <div className="form-field">
          <label>Current mileage (km)</label>
          <input type="number" value={form.currentMileage} onChange={(e) => update('currentMileage', e.target.value)} />
        </div>
        <div className="form-field">
          <label>Next oil change at (km)</label>
          <input type="number" value={form.nextOilChangeMileage} onChange={(e) => update('nextOilChangeMileage', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Insurance expiry</label>
          <input type="date" value={form.insuranceExpiry} onChange={(e) => update('insuranceExpiry', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Vignette expiry</label>
          <input type="date" value={form.vignetteExpiry} onChange={(e) => update('vignetteExpiry', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Carte grise number</label>
          <input value={form.carteGriseNumber} onChange={(e) => update('carteGriseNumber', e.target.value)} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add vehicle'}
        </button>
      </form>
    </Modal>
  );
}
