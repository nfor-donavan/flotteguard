import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import AreaChart from '../components/charts/AreaChart';
import BarChart from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import Icon from '../components/Icon';
import VehiclePhoto from '../components/VehiclePhoto';
import { PhotoThumbs } from '../components/Photos';
import { Skeleton } from '../components/Skeleton';
import { docState } from '../utils/docs';

const REFRESH_MS = 30000;

function StatCard({ icon, tone, label, value, hint, wide }) {
  return (
    <div className={`card stat-card ${wide ? 'wide' : ''}`}>
      <div className={`stat-chip ${tone}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    return client
      .get('/tenant/dashboard-summary')
      .then((res) => {
        setSummary(res.data);
        setUpdatedAt(new Date());
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setRefreshing(false));
  }, []);

  // Numbers are not pushed over a socket - the page re-asks the API every
  // 30 seconds, and again whenever the tab regains focus.
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  if (!summary) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>{t('nav_dashboard')}</h1>
            <p>{t('dashboard_subtitle')}</p>
          </div>
        </div>
        {failed ? (
          <p className="error-text">{t('dashboard_load_error')}</p>
        ) : (
          <div className="stat-grid">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} h={92} r={14} />
            ))}
          </div>
        )}
      </>
    );
  }

  const statusCounts = Object.fromEntries((summary.vehiclesByStatus || []).map((s) => [s._id, s.count]));
  const month = summary.monthToDate || { expectedRevenue: 0, submittedRevenue: 0, shortfallCount: 0 };
  const collectionRate = month.expectedRevenue ? Math.round((month.submittedRevenue / month.expectedRevenue) * 100) : 0;
  const trend = summary.collectionsTrend || [];
  const revenueByMonth = summary.rentalRevenueByMonth || [];
  const maintenance = summary.maintenanceVehicles || [];
  const alerts = summary.alerts || [];

  const segments = [
    { key: 'Available', label: t('status_available'), value: statusCounts.Available || 0, color: 'var(--c-available)' },
    { key: 'Rented', label: t('status_rented'), value: statusCounts.Rented || 0, color: 'var(--c-rented)' },
    { key: 'Active_Taxi', label: t('status_active_taxi'), value: statusCounts.Active_Taxi || 0, color: 'var(--c-taxi)' },
    { key: 'Maintenance', label: t('status_maintenance'), value: statusCounts.Maintenance || 0, color: 'var(--c-maint)' }
  ];

  const timeLabel = updatedAt
    ? updatedAt.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  function alertText(a) {
    if (a.daysLeft < 0) return t('expired_ago', { n: Math.abs(a.daysLeft) });
    if (a.daysLeft === 0) return t('expires_today');
    return t('expires_in', { n: a.daysLeft });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{t('nav_dashboard')}</h1>
          <p>{t('dashboard_subtitle')}</p>
        </div>
        <div className="live-indicator" title={t('auto_refresh_hint')}>
          <span className={`live-dot ${failed ? 'off' : ''}`} />
          <span>{failed ? t('dashboard_stale') : t('updated_at', { time: timeLabel })}</span>
          <button className={`icon-btn ${refreshing ? 'spin' : ''}`} onClick={load} aria-label={t('refresh')}>
            <Icon name="refresh" size={15} />
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="car" tone="green" label={t('stat_available_vehicles')} value={statusCounts.Available || 0} />
        <StatCard icon="steering" tone="blue" label={t('stat_active_taxis')} value={statusCounts.Active_Taxi || 0} />
        <StatCard icon="wrench" tone="red" label={t('stat_in_maintenance')} value={statusCounts.Maintenance || 0} />
        <StatCard icon="trend" tone="gold" label={t('stat_collection_rate')} value={`${collectionRate}%`} />
        <StatCard icon="alert" tone="red" label={t('stat_shortfalls')} value={month.shortfallCount || 0} />
        <StatCard icon="key" tone="blue" label={t('stat_active_rentals')} value={summary.activeRentalsCount || 0} />
        <StatCard
          icon="coins"
          tone="gold"
          label={t('stat_upcoming_revenue')}
          value={`${(summary.upcomingRentalRevenue || 0).toLocaleString()} XAF`}
          hint={t('stat_upcoming_hint')}
          wide
        />
      </div>

      <div className="dash-grid">
        <section className="card">
          <div className="panel-head">
            <div>
              <h3>{t('panel_collections')}</h3>
              <p>{t('panel_collections_sub')}</p>
            </div>
          </div>
          <AreaChart data={trend} />
        </section>
        <section className="card">
          <div className="panel-head">
            <div>
              <h3>{t('panel_fleet')}</h3>
              <p>{t('panel_fleet_sub')}</p>
            </div>
          </div>
          <DonutChart segments={segments} />
        </section>
      </div>

      <div className="dash-grid even">
        <section className="card">
          <div className="panel-head">
            <div>
              <h3>{t('panel_rental_revenue')}</h3>
              <p>{t('panel_rental_revenue_sub')}</p>
            </div>
          </div>
          <BarChart data={revenueByMonth} />
        </section>
        <section className="card">
          <div className="panel-head">
            <div>
              <h3>{t('panel_alerts')}</h3>
              <p>{t('panel_alerts_sub')}</p>
            </div>
          </div>
          {alerts.length === 0 ? (
            <p className="panel-ok">
              <Icon name="check" size={16} /> {t('alerts_all_clear')}
            </p>
          ) : (
            <ul className="alert-list">
              {alerts.map((a) => (
                <li key={`${a.vehicleId}-${a.type}`}>
                  <Link to={`/vehicles/${a.vehicleId}`} className="alert-row">
                    <span className={`chip ${docState(a.daysLeft)}`}>{alertText(a)}</span>
                    <span className="alert-main">
                      <b>{a.plateNumber}</b>
                      <small>
                        {a.makeModel} · {a.type === 'insurance' ? t('doc_insurance') : t('doc_vignette')}
                      </small>
                    </span>
                    <span className="alert-date">{new Date(a.expiry).toLocaleDateString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="panel-head">
          <div>
            <h3>{t('panel_maintenance')}</h3>
            <p>{t('panel_maintenance_sub')}</p>
          </div>
        </div>
        {maintenance.length === 0 ? (
          <p className="panel-ok">
            <Icon name="check" size={16} /> {t('maintenance_none')}
          </p>
        ) : (
          <div className="maint-grid">
            {maintenance.map((v) => {
              const mt = v.maintenance || {};
              return (
                <article key={v._id} className="maint-card">
                  <Link to={`/vehicles/${v._id}`} className="maint-photo">
                    <VehiclePhoto vehicle={v} />
                  </Link>
                  <div className="maint-body">
                    <div className="maint-title">
                      <Link to={`/vehicles/${v._id}`}>
                        <b>{v.plateNumber}</b> <span>{v.makeModel}</span>
                      </Link>
                      {mt.severity && <span className={`sev ${mt.severity.toLowerCase()}`}>{t(`severity_${mt.severity.toLowerCase()}`)}</span>}
                    </div>
                    <p className="maint-issue">{mt.issue || t('maintenance_no_issue')}</p>
                    <div className="maint-meta">
                      {mt.reportedAt && (
                        <span>
                          {t('reported_on')} {new Date(mt.reportedAt).toLocaleDateString()}
                        </span>
                      )}
                      {mt.expectedReadyDate && (
                        <span>
                          <Icon name="clock" size={13} /> {t('ready_by')} {new Date(mt.expectedReadyDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <PhotoThumbs photos={mt.photos || []} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
