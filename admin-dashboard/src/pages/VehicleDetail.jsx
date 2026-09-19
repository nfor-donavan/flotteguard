import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ status: '', currentMileage: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    client.get(`/vehicles/${id}`).then((res) => {
      setVehicle(res.data.vehicle);
      setForm({ status: res.data.vehicle.status, currentMileage: res.data.vehicle.currentMileage });
    });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await client.patch(`/vehicles/${id}`, {
        status: form.status,
        currentMileage: Number(form.currentMileage)
      });
      setVehicle(data.vehicle);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove ${vehicle.plateNumber} from your fleet? This cannot be undone.`)) return;
    await client.delete(`/vehicles/${id}`);
    navigate('/vehicles');
  }

  if (!vehicle) return <p>Loading…</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{vehicle.plateNumber}</h1>
          <p>{vehicle.makeModel}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${vehicle.status.toLowerCase()}`}>{vehicle.status.replace('_', ' ')}</span>
          <button className="btn btn-primary" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSave}>
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Active_Taxi">Active taxi</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-field">
              <label>Current mileage (km)</label>
              <input
                type="number"
                value={form.currentMileage}
                onChange={(e) => setForm((f) => ({ ...f, currentMileage: e.target.value }))}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn" style={{ background: '#fdeceb', color: 'var(--danger)' }} onClick={handleDelete}>
                Remove vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">Current mileage</div>
          <div className="stat-value">{vehicle.currentMileage.toLocaleString()} km</div>
        </div>
        <div className="card">
          <div className="stat-label">Next oil change</div>
          <div className="stat-value">{vehicle.nextOilChangeMileage.toLocaleString()} km</div>
        </div>
        <div className="card">
          <div className="stat-label">Carte grise</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{vehicle.documents.carteGriseNumber || '—'}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Document status</h3>
        <table>
          <tbody>
            <tr>
              <td>Insurance expiry</td>
              <td>{new Date(vehicle.documents.insuranceExpiry).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>Vignette expiry</td>
              <td>{new Date(vehicle.documents.vignetteExpiry).toLocaleDateString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
