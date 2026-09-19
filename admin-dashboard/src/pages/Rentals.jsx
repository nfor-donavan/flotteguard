import React, { useEffect, useState } from 'react';
import client from '../api/client';
import NewBookingModal from '../components/NewBookingModal';

export default function Rentals() {
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
    load(); // re-fetch so the new contract shows with its populated vehicle
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking? This frees up the vehicle for those dates.')) return;
    await client.post(`/rentals/${id}/cancel`);
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rentals</h1>
          <p>{contracts.length} contracts on file</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowModal(true)}>
          New booking
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading…</p>
        ) : contracts.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>No bookings yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Vehicle</th>
                <th>Dates</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
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
                        Cancel
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <NewBookingModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
