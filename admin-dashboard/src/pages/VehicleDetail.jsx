import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import Icon from '../components/Icon';
import { PhotoGallery, PhotoStrip, PhotoThumbs } from '../components/Photos';
import { Skeleton } from '../components/Skeleton';
import { daysUntil, docState, toDateInputValue } from '../utils/docs';

const statusKey = {
  Available: 'status_available',
  Rented: 'status_rented',
  Active_Taxi: 'status_active_taxi',
  Maintenance: 'status_maintenance'
};

function maintenanceToForm(v) {
  const m = v.maintenance || {};
  return {
    issue: m.issue || '',
    severity: m.severity || 'Medium',
    reportedAt: toDateInputValue(m.reportedAt) || toDateInputValue(new Date()),
    expectedReadyDate: toDateInputValue(m.expectedReadyDate),
    photos: m.photos || [],
    markMaintenance: true
  };
}

function DocRow({ label, date }) {
  const { t } = useLanguage();
  const days = daysUntil(date);
  const state = docState(days);
  return (
    <tr>
      <td>{label}</td>
      <td>{new Date(date).toLocaleDateString()}</td>
      <td>
        {state === 'ok' ? (
          <span className="chip ok">{t('doc_valid')}</span>
        ) : (
          <span className={`chip ${state}`}>{days < 0 ? t('doc_expired_short') : t('expires_in', { n: days })}</span>
        )}
      </td>
    </tr>
  );
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
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [maint, setMaint] = useState(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintSaving, setMaintSaving] = useState(false);
  const [maintError, setMaintError] = useState('');

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

  function applyVehicle(v) {
    setVehicle(v);
    setForm(vehicleToForm(v));
    setMaint(maintenanceToForm(v));
  }

  function load() {
    client.get(`/vehicles/${id}`).then((res) => applyVehicle(res.data.vehicle));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Always send the full "documents" object: the backend replaces nested
      // objects wholesale, so a partial one would wipe the other fields.
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
      applyVehicle(data.vehicle);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || t('save_failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('confirm_remove_vehicle', { plate: vehicle.plateNumber }))) return;
    await client.delete(`/vehicles/${id}`);
    navigate('/vehicles');
  }

  async function savePhotos(next) {
    const previous = vehicle;
    setVehicle({ ...vehicle, photos: next });
    setPhotoError('');
    setPhotoSaving(true);
    try {
      const { data } = await client.patch(`/vehicles/${id}`, { photos: next });
      setVehicle(data.vehicle);
    } catch (err) {
      setVehicle(previous);
      setPhotoError(err.response?.data?.error || t('save_failed'));
    } finally {
      setPhotoSaving(false);
    }
  }

  async function saveMaintenance(e) {
    e.preventDefault();
    setMaintError('');
    setMaintSaving(true);
    try {
      // Full `maintenance` object every time - nested updates replace wholesale.
      const payload = {
        maintenance: {
          issue: maint.issue,
          severity: maint.severity,
          reportedAt: maint.reportedAt || null,
          expectedReadyDate: maint.expectedReadyDate || null,
          photos: maint.photos
        }
      };
      if (maint.markMaintenance && vehicle.status !== 'Maintenance') payload.status = 'Maintenance';
      const { data } = await client.patch(`/vehicles/${id}`, payload);
      applyVehicle(data.vehicle);
      setMaintOpen(false);
    } catch (err) {
      setMaintError(err.response?.data?.error || t('save_failed'));
    } finally {
      setMaintSaving(false);
    }
  }

  async function markRepaired() {
    setMaintError('');
    setMaintSaving(true);
    try {
      const { data } = await client.patch(`/vehicles/${id}`, { status: 'Available', maintenance: { photos: [] } });
      applyVehicle(data.vehicle);
      setMaintOpen(false);
    } catch (err) {
      setMaintError(err.response?.data?.error || t('save_failed'));
    } finally {
      setMaintSaving(false);
    }
  }

  if (!vehicle || !form) {
    return (
      <>
        <Skeleton h={34} w={220} style={{ marginBottom: 24 }} />
        <Skeleton h={320} r={16} />
      </>
    );
  }

  const inMaintenance = vehicle.status === 'Maintenance';
  const m = vehicle.maintenance || {};
  const hasIssue = Boolean(m.issue) || (m.photos || []).length > 0;
  const showMaintForm = maintOpen || (inMaintenance && !hasIssue);

  return (
    <>
      <Link to="/vehicles" className="back-link">
        <Icon name="chevronLeft" size={15} /> {t('nav_vehicles')}
      </Link>
      <div className="page-header">
        <div>
          <h1>{vehicle.makeModel}</h1>
          <p>
            <span className="plate">{vehicle.plateNumber}</span>
          </p>
        </div>
        <div className="header-actions">
          <span className={`badge ${vehicle.status.toLowerCase()}`}>{t(statusKey[vehicle.status] || vehicle.status)}</span>
          <button className="btn btn-primary" onClick={() => setEditing((v) => !v)}>
            {editing ? t('cancel') : t('edit')}
          </button>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label>{t('status')}</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="Available">{t('status_available')}</option>
                  <option value="Rented">{t('status_rented')}</option>
                  <option value="Active_Taxi">{t('status_active_taxi')}</option>
                  <option value="Maintenance">{t('status_maintenance')}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('current_mileage')} (km)</label>
                <input type="number" value={form.currentMileage} onChange={(e) => setForm((f) => ({ ...f, currentMileage: e.target.value }))} />
              </div>
            </div>

            <div className="form-field">
              <label>{t('next_oil_change')} (km)</label>
              <input type="number" value={form.nextOilChangeMileage} onChange={(e) => setForm((f) => ({ ...f, nextOilChangeMileage: e.target.value }))} />
            </div>

            {/* Renewing a document is just picking a new date and saving. */}
            <div className="form-row">
              <div className="form-field">
                <label>{t('insurance_expiry')}</label>
                <input type="date" value={form.insuranceExpiry} onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))} required />
              </div>
              <div className="form-field">
                <label>{t('vignette_expiry')}</label>
                <input type="date" value={form.vignetteExpiry} onChange={(e) => setForm((f) => ({ ...f, vignetteExpiry: e.target.value }))} required />
              </div>
            </div>

            <div className="form-field">
              <label>{t('carte_grise_number')}</label>
              <input value={form.carteGriseNumber} onChange={(e) => setForm((f) => ({ ...f, carteGriseNumber: e.target.value }))} />
            </div>

            {error && <p className="error-text">{error}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? t('saving') : t('save_changes')}
              </button>
              <button type="button" className="btn btn-danger-soft" onClick={handleDelete}>
                {t('remove_vehicle')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="detail-top">
        <section className="card">
          <div className="panel-head">
            <div>
              <h3>{t('photos_title')}</h3>
              <p>{t('photos_sub')}</p>
            </div>
          </div>
          <PhotoGallery photos={vehicle.photos || []} onChange={savePhotos} signaturePath="/vehicles/upload-signature" saving={photoSaving} />
          {photoError && <p className="error-text">{photoError}</p>}
        </section>

        <div className="detail-side">
          <div className="stat-grid compact">
            <div className="card stat-card">
              <div>
                <div className="stat-label">{t('current_mileage')}</div>
                <div className="stat-value sm">{vehicle.currentMileage.toLocaleString()} km</div>
              </div>
            </div>
            <div className="card stat-card">
              <div>
                <div className="stat-label">{t('next_oil_change')}</div>
                <div className="stat-value sm">{vehicle.nextOilChangeMileage.toLocaleString()} km</div>
              </div>
            </div>
            <div className="card stat-card">
              <div>
                <div className="stat-label">{t('carte_grise')}</div>
                <div className="stat-value sm">{vehicle.documents.carteGriseNumber || '—'}</div>
              </div>
            </div>
          </div>

          <section className="card flush">
            <div className="panel-head pad">
              <h3>{t('document_status')}</h3>
            </div>
            <table>
              <tbody>
                <DocRow label={t('insurance_expiry')} date={vehicle.documents.insuranceExpiry} />
                <DocRow label={t('vignette_expiry')} date={vehicle.documents.vignetteExpiry} />
              </tbody>
            </table>
          </section>
        </div>
      </div>

      <section className={`card maint-section ${inMaintenance ? 'active' : ''}`}>
        <div className="panel-head">
          <div>
            <h3>{t('maintenance_section')}</h3>
            <p>{inMaintenance ? t('maintenance_section_sub_active') : t('maintenance_section_sub')}</p>
          </div>
          {!showMaintForm && (
            <button className="btn btn-soft" onClick={() => setMaintOpen(true)}>
              <Icon name="wrench" size={16} />
              {hasIssue ? t('edit_report') : t('report_issue')}
            </button>
          )}
        </div>

        {!showMaintForm && hasIssue && (
          <div className="maint-readout">
            <div className="maint-title">
              {m.severity && <span className={`sev ${m.severity.toLowerCase()}`}>{t(`severity_${m.severity.toLowerCase()}`)}</span>}
              <span className="muted-small">
                {m.reportedAt && `${t('reported_on')} ${new Date(m.reportedAt).toLocaleDateString()}`}
                {m.expectedReadyDate && ` · ${t('ready_by')} ${new Date(m.expectedReadyDate).toLocaleDateString()}`}
              </span>
            </div>
            <p className="maint-issue">{m.issue}</p>
            <PhotoThumbs photos={m.photos || []} size={84} />
            {inMaintenance && (
              <button className="btn btn-primary" onClick={markRepaired} disabled={maintSaving}>
                <Icon name="check" size={16} />
                {t('mark_repaired')}
              </button>
            )}
            {maintError && <p className="error-text">{maintError}</p>}
          </div>
        )}

        {showMaintForm && maint && (
          <form onSubmit={saveMaintenance}>
            <div className="form-field">
              <label>{t('issue_description')}</label>
              <textarea
                rows={3}
                value={maint.issue}
                onChange={(e) => setMaint((f) => ({ ...f, issue: e.target.value }))}
                placeholder={t('issue_placeholder')}
                required
              />
            </div>
            <div className="form-row three">
              <div className="form-field">
                <label>{t('severity')}</label>
                <select value={maint.severity} onChange={(e) => setMaint((f) => ({ ...f, severity: e.target.value }))}>
                  <option value="Low">{t('severity_low')}</option>
                  <option value="Medium">{t('severity_medium')}</option>
                  <option value="High">{t('severity_high')}</option>
                </select>
              </div>
              <div className="form-field">
                <label>{t('reported_date')}</label>
                <input type="date" value={maint.reportedAt} onChange={(e) => setMaint((f) => ({ ...f, reportedAt: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>{t('expected_ready_date')}</label>
                <input type="date" value={maint.expectedReadyDate} onChange={(e) => setMaint((f) => ({ ...f, expectedReadyDate: e.target.value }))} />
              </div>
            </div>

            <div className="form-field">
              <label>{t('issue_photos')}</label>
              <PhotoStrip
                photos={maint.photos}
                onChange={(photos) => setMaint((f) => ({ ...f, photos }))}
                signaturePath="/vehicles/upload-signature"
                label={t('add_issue_photos')}
              />
            </div>

            {!inMaintenance && (
              <label className="check-row">
                <input type="checkbox" checked={maint.markMaintenance} onChange={(e) => setMaint((f) => ({ ...f, markMaintenance: e.target.checked }))} />
                {t('also_mark_maintenance')}
              </label>
            )}

            {maintError && <p className="error-text">{maintError}</p>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={maintSaving}>
                {maintSaving ? t('saving') : t('save_report')}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMaint(maintenanceToForm(vehicle));
                  setMaintOpen(false);
                }}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
