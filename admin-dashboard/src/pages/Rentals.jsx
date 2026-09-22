import React, { useEffect, useState } from 'react';
import client from '../api/client';
import NewBookingModal from '../components/NewBookingModal';
import { useLanguage } from '../context/LanguageContext';

const paymentLabelKey = {
  Pending: 'payment_status_pending',
  Deposit_Paid: 'payment_status_deposit_paid',
  Fully_Paid: 'payment_status_fully_paid',
  Refunded: 'payment_status_refunded'
};

const contractStatusKey = {
  Confirmed: 'contract_status_confirmed',
  Cancelled: 'contract_status_cancelled',
  Completed: 'contract_status_completed'
};

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

  // Manual overrides for the two fields that otherwise only ever change
  // via a live Mobile Money webhook (paymentStatus) or never change at all
  // once confirmed (status -> Completed) - needed for cash payments and
  // for closing out a rental once the vehicle's back, regardless of
  // whether MoMo integration is live yet.
  async function handlePaymentChange(id, paymentStatus) {
    const { data } = await client.patch(`/rentals/${id}`, { paymentStatus });
    setContracts((prev) => prev.map((c) => (c._id === id ? data.contract : c)));
  }

  async function handleMarkCompleted(id) {
    const { data } = await client.patch(`/rentals/${id}`, { status: 'Completed' });
    setContracts((prev) => prev.map((c) => (c._id === id ? data.contract : c)));
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
                      <select
                        className="select-inline"
                        value={c.paymentStatus}
                        onChange={(e) => handlePaymentChange(c._id, e.target.value)}
                        disabled={c.status === 'Cancelled'}
                      >
                        {Object.entries(paymentLabelKey).map(([value, key]) => (
                          <option key={value} value={value}>
                            {t(key)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${c.status.toLowerCase()}`}>{t(contractStatusKey[c.status] || c.status)}</span>
                    </td>
                    <td>
                      {c.status === 'Confirmed' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                          <a onClick={() => handleMarkCompleted(c._id)} style={{ cursor: 'pointer' }}>
                            {t('mark_completed')}
                          </a>
                          <a onClick={() => handleCancel(c._id)} style={{ cursor: 'pointer', color: 'var(--danger)' }}>
                            {t('cancel')}
                          </a>
                        </div>
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
