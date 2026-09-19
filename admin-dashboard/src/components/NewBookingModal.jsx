import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import client from '../api/client';

export default function NewBookingModal({ onClose, onCreated }) {
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
  const [availability, setAvailability] = useState(null); // null = not checked yet
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/vehicles').then((res) => setVehicles(res.data.vehicles));
  }, []);

  // Re-check availability whenever the vehicle or dates change, so the
  // person sees a conflict before they even try to submit - the actual
  // guarantee against double-booking still lives in the transaction on
  // the server, this is just a fast, friendly preview of it.
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
      // The transactional lock is what actually produces this 409 - the
      // availability check above is just a preview and could in theory be
      // stale by the time of submission (another tab, another device).
      const message =
        err.response?.status === 409
          ? 'This vehicle just got booked for part of these dates. Pick different dates.'
          : err.response?.data?.error || 'Could not create this booking.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New booking" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Vehicle</label>
          <select value={form.vehicleId} onChange={(e) => update('vehicleId', e.target.value)} required>
            <option value="" disabled>
              Select a vehicle
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
            <label>Start date</label>
            <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>End date</label>
            <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required />
          </div>
        </div>

        {checkingAvailability && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: -8 }}>Checking availability…</p>}
        {availability === true && (
          <p style={{ fontSize: 13, color: 'var(--success)', marginTop: -8 }}>Available for these dates.</p>
        )}
        {availability === false && (
          <p className="error-text" style={{ marginTop: -8 }}>Already booked for part of these dates.</p>
        )}

        <div className="form-field">
          <label>Client name</label>
          <input value={form.clientName} onChange={(e) => update('clientName', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>Client phone</label>
          <input value={form.clientPhone} onChange={(e) => update('clientPhone', e.target.value)} required />
        </div>
        <div className="form-field">
          <label>ID / passport number</label>
          <input value={form.clientIdPassport} onChange={(e) => update('clientIdPassport', e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Security deposit (XAF)</label>
            <input type="number" value={form.securityDeposit} onChange={(e) => update('securityDeposit', e.target.value)} required />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Total cost (XAF)</label>
            <input type="number" value={form.totalCost} onChange={(e) => update('totalCost', e.target.value)} required />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={submitting || availability === false}
        >
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </Modal>
  );
}
