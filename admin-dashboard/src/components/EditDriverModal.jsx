import React, { useState } from 'react';
import Modal from './Modal';
import { PortraitUploader } from './Photos';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { toDateInputValue } from '../utils/docs';

export default function EditDriverModal({ driver, onClose, onSaved }) {
  const { t } = useLanguage();
  const p = driver.driverProfile || {};
  const [form, setForm] = useState({
    photoUrl: driver.photoUrl || '',
    licenseNumber: p.licenseNumber || '',
    licenseExpiry: toDateInputValue(p.licenseExpiry),
    yearsExperience: p.yearsExperience ?? '',
    languages: (p.languages || []).join(', '),
    bio: p.bio || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Full driverProfile every time - nested objects are replaced wholesale.
      const { data } = await client.patch(`/tenant/staff/${driver._id}`, {
        photoUrl: form.photoUrl,
        driverProfile: {
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry || null,
          yearsExperience: form.yearsExperience === '' ? 0 : Number(form.yearsExperience),
          languages: form.languages
            .split(',')
            .map((l) => l.trim())
            .filter(Boolean),
          bio: form.bio
        }
      });
      onSaved(data.user);
    } catch (err) {
      setError(err.response?.data?.error || t('save_failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`${t('edit_profile')} · ${driver.name}`} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>{t('profile_photo')}</label>
          <PortraitUploader value={form.photoUrl} onChange={(url) => update('photoUrl', url)} signaturePath="/tenant/upload-signature" />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>{t('licence_number')}</label>
            <input value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} />
          </div>
          <div className="form-field">
            <label>{t('licence_expiry')}</label>
            <input type="date" value={form.licenseExpiry} onChange={(e) => update('licenseExpiry', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>{t('years_experience')}</label>
            <input type="number" min="0" value={form.yearsExperience} onChange={(e) => update('yearsExperience', e.target.value)} />
          </div>
          <div className="form-field">
            <label>{t('languages_label')}</label>
            <input value={form.languages} onChange={(e) => update('languages', e.target.value)} placeholder="Français, English" />
          </div>
        </div>
        <div className="form-field">
          <label>{t('driver_bio')}</label>
          <textarea rows={3} value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder={t('driver_bio_placeholder')} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={saving}>
          {saving ? t('saving') : t('save_changes')}
        </button>
      </form>
    </Modal>
  );
}
