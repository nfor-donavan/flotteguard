import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

const statusKey = {
  Available: 'status_available',
  Rented: 'status_rented',
  Active_Taxi: 'status_active_taxi',
  Maintenance: 'status_maintenance'
};

// Turns a stored ISO date into the yyyy-MM-dd string an <input type="date">
// needs, without a timezone shift (toISOString() alone can roll the date
// back a day depending on the browser's local timezone).
function toDateInputValue(isoDate) {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function VehicleDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    client.get(`/vehicles/${id}`).then((res) => {
      setVehicle(res.data.vehicle);
      setForm(vehicleToForm(res.data.vehicle));
    });
  }

  function vehicleToForm(v) {
    return {
      status: v.status,
      currentMileage: v.currentMileage,
      nextOilChangeMileage: v.nextOilChangeMileage,
      insuranceExpiry: toDateInputValue(v.documents.insuranceExpiry),
      vignetteExpiry: toDateInputValue(v.documents.vignetteExpiry),
      carteGriseNumber: v.documents.carteGriseNumber || ''
    };
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Always send the full "documents" object, not just the field that
      // changed. The backend does a plain findOneAndUpdate, which replaces
      // a nested object wholesale rather than merging it field by field -
      // sending only { insuranceExpiry } here would silently wipe out
      // vignetteExpiry and carteGriseNumber on save.
      const { data } = await client.patch(`/vehicles/${id}`, {
        status: form.status,
        currentMileage: Number(form.currentMileage),
        nextOilChangeMileage: Number(form.nextOilChangeMileage),
        documents: {
          insuranceExpiry: form.insuranceExpiry,
          vignetteExpiry: form.vignetteExpiry,
          carteGriseNumber: form.carteGriseNumber
        }
      });
      setVehicle(data.vehicle);
      setForm(vehicleToForm(data.vehicle));
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('confirm_remove_vehicle', { plate: vehicle.plateNumber }))) return;
    await client.delete(`/vehicles/${id}`);
    navigate('/vehicles');
  }

  if (!vehicle || !form) return <p>{t('loading')}</p>;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{vehicle.plateNumber}</h1>
          <p>{vehicle.makeModel}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className={`badge ${vehicle.status.toLowerCase()}`}>{t(statusKey[vehicle.status] || vehicle.status)}</span>
          <button className="btn btn-primary" onClick={() => setEditing((v) => !v)}>
            {editing ? t('cancel') : t('edit')}
          </button>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label>{t('status')}</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="Available">{t('status_available')}</option>
                  <option value="Rented">{t('status_rented')}</option>
                  <option value="Active_Taxi">{t('status_active_taxi')}</option>
                  <option value="Maintenance">{t('status_maintenance')}</option>
                </select>
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label>{t('current_mileage')} (km)</label>
                <input
                  type="number"
                  value={form.currentMileage}
                  onChange={(e) => setForm((f) => ({ ...f, currentMileage: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-field">
              <label>{t('next_oil_change')} (km)</label>
              <input
                type="number"
                value={form.nextOilChangeMileage}
                onChange={(e) => setForm((f) => ({ ...f, nextOilChangeMileage: e.target.value }))}
              />
            </div>

            {/* This is the part that was missing: renewing a document just
                means picking a new date here and saving - no separate
                "renew" flow needed, and no risk of the old date sticking
                around once it's expired. */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label>{t('insurance_expiry')}</label>
                <input
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
                  required
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label>{t('vignette_expiry')}</label>
                <input
                  type="date"
                  value={form.vignetteExpiry}
                  onChange={(e) => setForm((f) => ({ ...f, vignetteExpiry: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>{t('carte_grise_number')}</label>
              <input
                value={form.carteGriseNumber}
                onChange={(e) => setForm((f) => ({ ...f, carteGriseNumber: e.target.value }))}
              />
            </div>

            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? t('saving') : t('save_changes')}
              </button>
              <button type="button" className="btn" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={handleDelete}>
                {t('remove_vehicle')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">{t('current_mileage')}</div>
          <div className="stat-value">{vehicle.currentMileage.toLocaleString()} km</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('next_oil_change')}</div>
          <div className="stat-value">{vehicle.nextOilChangeMileage.toLocaleString()} km</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('carte_grise')}</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{vehicle.documents.carteGriseNumber || '—'}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>{t('document_status')}</h3>
        <table>
          <tbody>
            <tr>
              <td>{t('insurance_expiry')}</td>
              <td>{new Date(vehicle.documents.insuranceExpiry).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td>{t('vignette_expiry')}</td>
              <td>{new Date(vehicle.documents.vignetteExpiry).toLocaleDateString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
