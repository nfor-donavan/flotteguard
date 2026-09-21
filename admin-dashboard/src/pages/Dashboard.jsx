import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    client.get('/tenant/dashboard-summary').then((res) => setSummary(res.data));
  }, []);

  if (!summary) return <p>{t('loading')}</p>;

  const statusCounts = Object.fromEntries(summary.vehiclesByStatus.map((s) => [s._id, s.count]));
  const collectionRate = summary.monthToDate.expectedRevenue
    ? Math.round((summary.monthToDate.submittedRevenue / summary.monthToDate.expectedRevenue) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('nav_dashboard')}</h1>
          <p>{t('dashboard_subtitle')}</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">{t('stat_available_vehicles')}</div>
          <div className="stat-value">{statusCounts.Available || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('stat_active_taxis')}</div>
          <div className="stat-value">{statusCounts.Active_Taxi || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('stat_in_maintenance')}</div>
          <div className="stat-value">{statusCounts.Maintenance || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('stat_collection_rate')}</div>
          <div className="stat-value">{collectionRate}%</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">{t('stat_shortfalls')}</div>
          <div className="stat-value">{summary.monthToDate.shortfallCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('stat_active_rentals')}</div>
          <div className="stat-value">{summary.activeRentalsCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">{t('stat_upcoming_revenue')}</div>
          <div className="stat-value">{summary.upcomingRentalRevenue.toLocaleString()} XAF</div>
        </div>
      </div>
    </>
  );
}
