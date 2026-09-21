import React, { useEffect, useState } from 'react';
import client from '../api/client';
import NewBookingModal from '../components/NewBookingModal';
import { useLanguage } from '../context/LanguageContext';

export default function Rentals() {
  const { t } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    client
      .get('/rentals')
      .then((res) => setContracts(res.data.contracts))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleCreated() {
    setShowModal(false);
    load();
  }

  async function handleCancel(id) {
    if (!window.confirm(t('confirm_cancel_booking'))) return;
    await client.post(`/rentals/${id}/cancel`);
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('rentals_title')}</h1>
          <p>{t('rentals_subtitle', { count: contracts.length })}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          {t('new_booking')}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>{t('loading')}</p>
        ) : contracts.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>{t('no_bookings')}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col_client')}</th>
                  <th>{t('col_vehicle')}</th>
                  <th>{t('col_dates')}</th>
                  <th>{t('col_total')}</th>
                  <th>{t('col_payment')}</th>
                  <th>{t('col_status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c._id}>
                    <td>{c.clientName}</td>
                    <td>{c.vehicleId?.plateNumber}</td>
                    <td>
                      {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
                    </td>
                    <td>{c.totalCost.toLocaleString()} XAF</td>
                    <td>
                      <span className={`badge ${c.paymentStatus.toLowerCase()}`}>{c.paymentStatus.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>
                      {c.status === 'Confirmed' && (
                        <a onClick={() => handleCancel(c._id)} style={{ cursor: 'pointer', color: 'var(--danger)' }}>
                          {t('cancel')}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <NewBookingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
