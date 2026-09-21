import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AddVehicleModal from '../components/AddVehicleModal';
import { useLanguage } from '../context/LanguageContext';

const statusKey = {
  Available: 'status_available',
  Rented: 'status_rented',
  Active_Taxi: 'status_active_taxi',
  Maintenance: 'status_maintenance'
};

export default function Vehicles() {
  const { t } = useLanguage();
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
          <h1>{t('vehicles_title')}</h1>
          <p>{t('vehicles_subtitle', { count: vehicles.length })}</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>
          {t('add_vehicle')}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20 }}>{t('loading')}</p>
        ) : vehicles.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--ink-muted)' }}>{t('no_vehicles')}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col_plate')}</th>
                  <th>{t('col_make_model')}</th>
                  <th>{t('col_status')}</th>
                  <th>{t('col_mileage')}</th>
                  <th>{t('col_insurance_expiry')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td>{v.plateNumber}</td>
                    <td>{v.makeModel}</td>
                    <td>
                      <span className={`badge ${v.status.toLowerCase()}`}>{t(statusKey[v.status] || v.status)}</span>
                    </td>
                    <td>{v.currentMileage.toLocaleString()} km</td>
                    <td>{new Date(v.documents.insuranceExpiry).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/vehicles/${v._id}`}>{t('view')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </>
  );
}
