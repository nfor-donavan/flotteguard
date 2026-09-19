import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AddVehicleModal from '../components/AddVehicleModal';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  function loadVehicles() {
    setLoading(true);
    client
      .get('/vehicles')
      .then((res) => setVehicles(res.data.vehicles))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  function handleCreated(vehicle) {
    setVehicles((prev) => [vehicle, ...prev]);
    setShowAddModal(false);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Vehicles</h1>
          <p>{vehicles.length} vehicles in your fleet</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>
          Add vehicle
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading…</p>
        ) : vehicles.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>
            No vehicles yet. Add your first one to get started.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Plate</th>
                <th>Make / model</th>
                <th>Status</th>
                <th>Mileage</th>
                <th>Insurance expiry</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v._id}>
                  <td>{v.plateNumber}</td>
                  <td>{v.makeModel}</td>
                  <td>
                    <span className={`badge ${v.status.toLowerCase()}`}>{v.status.replace('_', ' ')}</span>
                  </td>
                  <td>{v.currentMileage.toLocaleString()} km</td>
                  <td>{new Date(v.documents.insuranceExpiry).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/vehicles/${v._id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </>
  );
}
