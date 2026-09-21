import React, { useEffect, useState } from 'react';
import client from '../api/client';
import AddDailyLogModal from '../components/AddDailyLogModal';
import { useLanguage } from '../context/LanguageContext';

export default function DailyLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    client
      .get('/daily-logs')
      .then((res) => setLogs(res.data.logs))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleCreated() {
    setShowModal(false);
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('daily_logs_title')}</h1>
          <p>{t('daily_logs_subtitle')}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          {t('record_turn_in')}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>{t('loading')}</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>{t('no_logs')}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col_date')}</th>
                  <th>{t('col_vehicle')}</th>
                  <th>{t('col_driver')}</th>
                  <th>{t('col_expected')}</th>
                  <th>{t('col_submitted')}</th>
                  <th>{t('col_fuel')}</th>
                  <th>{t('col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td>{new Date(l.date).toLocaleDateString()}</td>
                    <td>{l.vehicleId?.plateNumber}</td>
                    <td>{l.driverName}</td>
                    <td>{l.expectedRevenue.toLocaleString()} XAF</td>
                    <td>{l.submittedRevenue.toLocaleString()} XAF</td>
                    <td>{l.fuelExpense.toLocaleString()} XAF</td>
                    <td>
                      <span className={`badge ${l.status.toLowerCase()}`}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddDailyLogModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
