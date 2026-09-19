import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    client.get('/tenant/dashboard-summary').then((res) => setSummary(res.data));
  }, []);

  if (!summary) return <p>Loading…</p>;

  const statusCounts = Object.fromEntries(summary.vehiclesByStatus.map((s) => [s._id, s.count]));
  const collectionRate = summary.monthToDate.expectedRevenue
    ? Math.round((summary.monthToDate.submittedRevenue / summary.monthToDate.expectedRevenue) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Fleet health and this month's collections at a glance.</p>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">Available vehicles</div>
          <div className="stat-value">{statusCounts.Available || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">Active taxis</div>
          <div className="stat-value">{statusCounts.Active_Taxi || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">In maintenance</div>
          <div className="stat-value">{statusCounts.Maintenance || 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">Collection rate (MTD)</div>
          <div className="stat-value">{collectionRate}%</div>
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="stat-label">Shortfalls this month</div>
          <div className="stat-value">{summary.monthToDate.shortfallCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">Active rentals</div>
          <div className="stat-value">{summary.activeRentalsCount}</div>
        </div>
        <div className="card">
          <div className="stat-label">Upcoming rental revenue</div>
          <div className="stat-value">{summary.upcomingRentalRevenue.toLocaleString()} XAF</div>
        </div>
      </div>
    </>
  );
}
