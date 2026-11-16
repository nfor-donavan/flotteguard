import React, { useRef, useState } from 'react';
import useWidth from './useWidth';
import { niceMax, compact, localeFor } from './chartUtils';
import { useLanguage } from '../../context/LanguageContext';

/** Monthly rental revenue. data: [{ month: 'YYYY-MM', revenue }] */
export default function BarChart({ data = [], height = 240 }) {
  const { lang, t } = useLanguage();
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef, 420);
  const [hover, setHover] = useState(null);

  const m = { top: 14, right: 8, bottom: 28, left: 44 };
  const iw = Math.max(width - m.left - m.right, 10);
  const ih = height - m.top - m.bottom;
  const n = data.length;
  const max = niceMax(Math.max(0, ...data.map((d) => d.revenue || 0)));
  const y = (v) => m.top + ih - ((v || 0) / max) * ih;
  const slot = iw / Math.max(n, 1);
  const bw = Math.min(40, slot * 0.58);
  const cx = (i) => m.left + slot * i + slot / 2;
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const monthLabel = (mo) => new Date(`${mo}-01T00:00:00`).toLocaleDateString(localeFor(lang), { month: 'short' });
  const currentMonth = new Date().toISOString().slice(0, 7);

  const h = hover !== null ? data[hover] : null;
  const hasRevenue = data.some((d) => d.revenue > 0);

  return (
    <div className="chart-wrap" ref={wrapRef}>
      {n === 0 || !hasRevenue ? (
        <p className="chart-empty">{t('chart_no_data')}</p>
      ) : (
        <>
          <svg width={width} height={height} role="img" aria-label={t('chart_revenue_aria')} onPointerLeave={() => setHover(null)}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} className="chart-grid" />
                <text x={m.left - 8} y={y(v) + 4} textAnchor="end" className="axis-text">
                  {compact(v)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const top = y(d.revenue);
              const bh = Math.max(m.top + ih - top, d.revenue > 0 ? 2 : 0);
              return (
                <g key={d.month} onPointerEnter={() => setHover(i)}>
                  <rect x={m.left + slot * i} y={m.top} width={slot} height={ih} fill="transparent" />
                  <rect
                    x={cx(i) - bw / 2}
                    y={m.top + ih - bh}
                    width={bw}
                    height={bh}
                    rx="6"
                    className={`bar ${d.month === currentMonth ? 'current' : ''} ${hover === i ? 'hovered' : ''}`}
                  />
                  <text x={cx(i)} y={height - 8} textAnchor="middle" className="axis-text">
                    {monthLabel(d.month)}
                  </text>
                </g>
              );
            })}
          </svg>
          {h && (
            <div className="chart-tooltip" style={{ left: Math.min(Math.max(cx(hover), 60), width - 60), top: y(h.revenue) - 8 }}>
              <strong>{new Date(`${h.month}-01T00:00:00`).toLocaleDateString(localeFor(lang), { month: 'long', year: 'numeric' })}</strong>
              <span>{(h.revenue || 0).toLocaleString()} XAF</span>
            </div>
          )}
          <div className="sr-only">
          <table>
            <caption>{t('chart_revenue_aria')}</caption>
            <tbody>
              {data.map((d) => (
                <tr key={d.month}>
                  <td>{d.month}</td>
                  <td>{d.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}
