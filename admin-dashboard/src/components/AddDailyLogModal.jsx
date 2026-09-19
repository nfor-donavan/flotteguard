import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import client from '../api/client';

export default function AddDailyLogModal({ onClose, onCreated }) {
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
    <Modal title="Record daily turn-in" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Vehicle</label>
          <select value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} required>
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
        <div className="form-field">
          <label>Driver name</label>
          <input value={form.driverName} onChange={(e) => setForm((f) => ({ ...f, driverName: e.target.value }))} required />
        </div>
        <div className="form-field">
          <label>Expected revenue (XAF)</label>
          <input
            type="number"
            value={form.expectedRevenue}
            onChange={(e) => setForm((f) => ({ ...f, expectedRevenue: e.target.value }))}
            required
          />
        </div>
        <div className="form-field">
          <label>Submitted revenue (XAF)</label>
          <input
            type="number"
            value={form.submittedRevenue}
            onChange={(e) => setForm((f) => ({ ...f, submittedRevenue: e.target.value }))}
            required
          />
        </div>
        <div className="form-field">
          <label>Fuel expense (XAF)</label>
          <input type="number" value={form.fuelExpense} onChange={(e) => setForm((f) => ({ ...f, fuelExpense: e.target.value }))} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
          {submitting ? 'Saving…' : 'Record turn-in'}
        </button>
      </form>
    </Modal>
  );
}
