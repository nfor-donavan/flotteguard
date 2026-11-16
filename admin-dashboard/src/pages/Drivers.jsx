import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import Avatar from '../components/Avatar';
import EditDriverModal from '../components/EditDriverModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { SkeletonCards } from '../components/Skeleton';
import { assetUrl, initials } from '../utils/assets';
import { daysUntil, docState } from '../utils/docs';

function Portrait({ driver }) {
  const url = assetUrl(driver.photoUrl);
  return (
    <div className="driver-portrait">
      {url ? <img src={url} alt={driver.name} loading="lazy" /> : <span>{initials(driver.name)}</span>}
    </div>
  );
}

export default function Drivers() {
  const { t } = useLanguage();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    client
      .get('/tenant/staff')
      .then((res) => setDrivers(res.data.users.filter((u) => u.role === 'driver')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSaved(user) {
    setDrivers((prev) => prev.map((d) => (d._id === user._id ? user : d)));
    setEditing(null);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('drivers_title')}</h1>
          <p>{t('drivers_subtitle')}</p>
        </div>
        <Link to="/staff" className="btn btn-gold">
          <Icon name="plus" size={16} />
          {t('add_driver_account')}
        </Link>
      </div>

      {loading ? (
        <SkeletonCards count={4} h={340} />
      ) : drivers.length === 0 ? (
        <div className="card">
          <EmptyState icon="steering" title={t('no_drivers_title')} text={t('no_drivers_text')} />
        </div>
      ) : (
        <div className="driver-grid">
          {drivers.map((d) => {
            const p = d.driverProfile || {};
            const days = p.licenseExpiry ? daysUntil(p.licenseExpiry) : null;
            const state = docState(days);
            return (
              <article key={d._id} className="driver-card">
                <Portrait driver={d} />
                <div className="driver-body">
                  <h3>{d.name}</h3>
                  <a className="driver-phone" href={`tel:${d.phone}`}>
                    <Icon name="phone" size={14} /> {d.phone}
                  </a>

                  <div className="driver-facts">
                    {p.yearsExperience !== undefined && p.yearsExperience !== null && (
                      <span className="fact">
                        <b>{p.yearsExperience}</b> {t('years_short')}
                      </span>
                    )}
                    {(p.languages || []).map((l) => (
                      <span key={l} className="fact lang">
                        {l}
                      </span>
                    ))}
                  </div>

                  <div className="driver-licence">
                    <Icon name="id" size={15} />
                    <div>
                      <b>{p.licenseNumber || t('licence_missing')}</b>
                      {p.licenseExpiry && (
                        <small>
                          {t('licence_expires')} {new Date(p.licenseExpiry).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                    {state !== 'ok' && days !== null && (
                      <span className={`chip ${state}`}>{days < 0 ? t('doc_expired_short') : t('expires_in', { n: days })}</span>
                    )}
                  </div>

                  {p.bio && <p className="driver-bio">{p.bio}</p>}

                  <button className="btn btn-soft" onClick={() => setEditing(d)}>
                    {t('edit_profile')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && <EditDriverModal driver={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </>
  );
}
