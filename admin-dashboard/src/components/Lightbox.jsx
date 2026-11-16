import React, { useEffect } from 'react';
import { assetUrl } from '../utils/assets';
import { useLanguage } from '../context/LanguageContext';
import Icon from './Icon';

export default function Lightbox({ images, index, onClose, onIndex }) {
  const { t } = useLanguage();
  const count = images.length;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count]);

  if (!count) return null;
  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label={t('close')}>
        <Icon name="x" size={22} />
      </button>
      {count > 1 && (
        <button
          className="lightbox-nav prev"
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index - 1 + count) % count);
          }}
          aria-label={t('previous')}
        >
          <Icon name="chevronLeft" size={24} />
        </button>
      )}
      <img src={assetUrl(images[index])} alt="" onClick={(e) => e.stopPropagation()} />
      {count > 1 && (
        <button
          className="lightbox-nav next"
          onClick={(e) => {
            e.stopPropagation();
            onIndex((index + 1) % count);
          }}
          aria-label={t('next')}
        >
          <Icon name="chevron" size={24} />
        </button>
      )}
      <div className="lightbox-count">
        {index + 1} / {count}
      </div>
    </div>
  );
}
