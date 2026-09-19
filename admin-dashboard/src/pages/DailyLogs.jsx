import React, { useEffect, useState } from 'react';
import client from '../api/client';
import AddDailyLogModal from '../components/AddDailyLogModal';

export default function DailyLogs() {
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
          <h1>Daily Logs</h1>
          <p>Driver cash turn-ins and fuel expenses</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          Record turn-in
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading…</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>No turn-ins recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Expected</th>
                <th>Submitted</th>
                <th>Fuel</th>
                <th>Status</th>
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
        )}
      </div>

      {showModal && <AddDailyLogModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
