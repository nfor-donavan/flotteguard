import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AddVehicleModal from '../components/AddVehicleModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import VehiclePhoto from '../components/VehiclePhoto';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { docState, nearestDoc } from '../utils/docs';

const statusKey = {
  Available: 'status_available',
  Rented: 'status_rented',
  Active_Taxi: 'status_active_taxi',
  Maintenance: 'status_maintenance'
};

const VIEW_KEY = 'flotteguard_vehicle_view';

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid';
  } catch {
    return 'grid';
  }
}

function DocChip({ vehicle }) {
  const { t } = useLanguage();
  const doc = nearestDoc(vehicle);
  if (!doc) return null;
  const state = docState(doc.days);
  if (state === 'ok') return null;
  const name = doc.type === 'insurance' ? t('doc_insurance') : t('doc_vignette');
  const text = doc.days < 0 ? t('doc_expired', { doc: name }) : t('doc_expires_in', { doc: name, n: doc.days });
  return <span className={`chip ${state}`}>{text}</span>;
}

export default function Vehicles() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState(readView);

  function changeView(next) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage unavailable - the choice just won't persist */
    }
  }

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
        <div className="header-actions">
          <div className="segmented" role="group" aria-label={t('view_mode')}>
            <button className={view === 'grid' ? 'on' : ''} onClick={() => changeView('grid')} aria-label={t('view_grid')} title={t('view_grid')}>
              <Icon name="grid" size={16} />
            </button>
            <button className={view === 'table' ? 'on' : ''} onClick={() => changeView('table')} aria-label={t('view_table')} title={t('view_table')}>
              <Icon name="list" size={16} />
            </button>
          </div>
          <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={16} />
            {t('add_vehicle')}
          </button>
        </div>
      </div>

      {loading ? (
        view === 'grid' ? (
          <SkeletonCards />
        ) : (
          <div className="card flush">
            <SkeletonTable />
          </div>
        )
      ) : vehicles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="car"
            title={t('no_vehicles_title')}
            text={t('no_vehicles')}
            action={
              <button className="btn btn-gold" onClick={() => setShowAddModal(true)}>
                {t('add_vehicle')}
              </button>
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="vehicle-grid">
          {vehicles.map((v) => (
            <Link key={v._id} to={`/vehicles/${v._id}`} className="vehicle-card">
              <div className="vehicle-card-photo">
                <VehiclePhoto vehicle={v} />
                <span className={`badge ${v.status.toLowerCase()} on-photo`}>{t(statusKey[v.status] || v.status)}</span>
                {v.photos?.length > 1 && (
                  <span className="photo-count">
                    <Icon name="image" size={12} /> {v.photos.length}
                  </span>
                )}
              </div>
              <div className="vehicle-card-body">
                <div className="vehicle-card-title">
                  <b>{v.makeModel}</b>
                  <span className="plate">{v.plateNumber}</span>
                </div>
                <div className="vehicle-card-meta">
                  <span>{v.currentMileage.toLocaleString()} km</span>
                  <DocChip vehicle={v} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card flush">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('col_vehicle')}</th>
                  <th>{t('col_plate')}</th>
                  <th>{t('col_status')}</th>
                  <th>{t('col_mileage')}</th>
                  <th>{t('col_insurance_expiry')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div className="cell-media">
                        <VehiclePhoto vehicle={v} className="thumb-sm" />
                        <b>{v.makeModel}</b>
                      </div>
                    </td>
                    <td>
                      <span className="plate">{v.plateNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ${v.status.toLowerCase()}`}>{t(statusKey[v.status] || v.status)}</span>
                    </td>
                    <td>{v.currentMileage.toLocaleString()} km</td>
                    <td>
                      {new Date(v.documents.insuranceExpiry).toLocaleDateString()} <DocChip vehicle={{ documents: { insuranceExpiry: v.documents.insuranceExpiry } }} />
                    </td>
                    <td>
                      <Link className="link-action" to={`/vehicles/${v._id}`}>
                        {t('view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </>
  );
}
