import React, { useRef, useState } from 'react';
import { assetUrl } from '../utils/assets';
import { uploadImages } from '../utils/upload';
import { useLanguage } from '../context/LanguageContext';
import Lightbox from './Lightbox';
import Icon from './Icon';

function useUploader(signaturePath) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(files) {
    setError('');
    setBusy(true);
    try {
      return await uploadImages(files, signaturePath);
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('upload_failed'));
      return [];
    } finally {
      setBusy(false);
    }
  }
  return { upload, busy, error };
}

function AddButton({ busy, onFiles, label, multiple = true }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn btn-soft" onClick={() => ref.current?.click()} disabled={busy}>
        <Icon name="camera" size={16} />
        {busy ? t('uploading') : label}
      </button>
    </>
  );
}

/** Large gallery: cover image, thumbnails, lightbox, add/remove. `onChange` receives the new array of URLs. */
export function PhotoGallery({ photos = [], onChange, signaturePath, saving }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const { upload, busy, error } = useUploader(signaturePath);
  const safeActive = Math.min(active, Math.max(photos.length - 1, 0));

  async function handleFiles(files) {
    const urls = await upload(files);
    if (urls.length) onChange([...photos, ...urls]);
  }

  return (
    <div className="gallery">
      {photos.length ? (
        <button type="button" className="gallery-main" onClick={() => setLightbox(safeActive)} aria-label={t('open_photo')}>
          <img src={assetUrl(photos[safeActive])} alt="" />
        </button>
      ) : (
        <div className="gallery-main gallery-empty">
          <Icon name="image" size={34} />
          <span>{t('no_photos_yet')}</span>
        </div>
      )}

      <div className="gallery-thumbs">
        {photos.map((p, i) => (
          <div key={p + i} className={`thumb ${i === safeActive ? 'active' : ''}`}>
            <button type="button" onClick={() => setActive(i)} aria-label={t('open_photo')}>
              <img src={assetUrl(p)} alt="" loading="lazy" />
            </button>
            <button
              type="button"
              className="thumb-remove"
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              aria-label={t('remove_photo')}
              title={t('remove_photo')}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        <AddButton busy={busy} onFiles={handleFiles} label={t('add_photos')} />
        {saving && <span className="muted-small">{t('saving')}</span>}
      </div>
      {error && <p className="error-text">{error}</p>}

      {lightbox !== null && <Lightbox images={photos} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/** Compact strip of thumbnails with add/remove (used for "what is wrong" photos). */
export function PhotoStrip({ photos = [], onChange, signaturePath, label }) {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState(null);
  const { upload, busy, error } = useUploader(signaturePath);

  async function handleFiles(files) {
    const urls = await upload(files);
    if (urls.length) onChange([...photos, ...urls]);
  }

  return (
    <div>
      <div className="strip">
        {photos.map((p, i) => (
          <div key={p + i} className="thumb">
            <button type="button" onClick={() => setLightbox(i)} aria-label={t('open_photo')}>
              <img src={assetUrl(p)} alt="" loading="lazy" />
            </button>
            <button
              type="button"
              className="thumb-remove"
              onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
              aria-label={t('remove_photo')}
            >
              <Icon name="x" size={12} />
            </button>
          </div>
        ))}
        <AddButton busy={busy} onFiles={handleFiles} label={label || t('add_photos')} />
      </div>
      {error && <p className="error-text">{error}</p>}
      {lightbox !== null && <Lightbox images={photos} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

/** Read-only thumbnails that open the lightbox (dashboard maintenance panel). */
export function PhotoThumbs({ photos = [], size = 44 }) {
  const [lightbox, setLightbox] = useState(null);
  const { t } = useLanguage();
  if (!photos.length) return null;
  return (
    <>
      <div className="thumb-row">
        {photos.map((p, i) => (
          <button
            key={p + i}
            type="button"
            className="thumb-ro"
            style={{ width: size, height: size }}
            onClick={() => setLightbox(i)}
            aria-label={t('open_photo')}
          >
            <img src={assetUrl(p)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {lightbox !== null && <Lightbox images={photos} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

/** Single portrait uploader for driver profiles. */
export function PortraitUploader({ value, onChange, signaturePath, name }) {
  const { t } = useLanguage();
  const { upload, busy, error } = useUploader(signaturePath);
  async function handleFiles(files) {
    const [url] = await upload([files[0]]);
    if (url) onChange(url);
  }
  return (
    <div className="portrait-uploader">
      <div className="portrait-preview">
        {value ? <img src={assetUrl(value)} alt="" /> : <Icon name="users" size={30} />}
      </div>
      <div>
        <AddButton busy={busy} onFiles={handleFiles} label={value ? t('change_photo') : t('upload_photo')} multiple={false} />
        {error && <p className="error-text" style={{ marginTop: 8 }}>{error}</p>}
        {name && <p className="muted-small" style={{ marginTop: 6 }}>{name}</p>}
      </div>
    </div>
  );
}
