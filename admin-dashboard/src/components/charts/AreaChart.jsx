import React, { useRef, useState } from 'react';
import useWidth from './useWidth';
import { niceMax, compact, localeFor } from './chartUtils';
import { useLanguage } from '../../context/LanguageContext';

/** Expected vs submitted collections over time. data: [{ date, expected, submitted }] */
export default function AreaChart({ data = [], height = 260 }) {
  const { lang, t } = useLanguage();
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef, 640);
  const [hover, setHover] = useState(null);

  const m = { top: 14, right: 10, bottom: 28, left: 44 };
  const iw = Math.max(width - m.left - m.right, 10);
  const ih = height - m.top - m.bottom;
  const n = data.length;
  const max = niceMax(Math.max(0, ...data.flatMap((d) => [d.expected || 0, d.submitted || 0])));
  const x = (i) => m.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => m.top + ih - ((v || 0) / max) * ih;
  const path = (key) => data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
  const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short' });
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const labelEvery = width < 480 ? 4 : 2;

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - m.left) / iw) * (n - 1));
    setHover(Math.min(Math.max(i, 0), n - 1));
  }

  const h = hover !== null ? data[hover] : null;

  return (
    <div className="chart-wrap" ref={wrapRef}>
      {n === 0 ? (
        <p className="chart-empty">{t('chart_no_data')}</p>
      ) : (
        <>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={t('chart_collections_aria')}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ touchAction: 'pan-y' }}
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold-500)" stopOpacity="0.38" />
                <stop offset="100%" stopColor="var(--gold-500)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} className="chart-grid" />
                <text x={m.left - 8} y={y(v) + 4} textAnchor="end" className="axis-text">
                  {compact(v)}
                </text>
              </g>
            ))}
            {data.map(
              (d, i) =>
                i % labelEvery === 0 && (
                  <text key={d.date} x={x(i)} y={height - 8} textAnchor="middle" className="axis-text">
                    {fmtDay(d.date)}
                  </text>
                )
            )}
            <path d={`${path('submitted')} L${x(n - 1)},${m.top + ih} L${x(0)},${m.top + ih} Z`} fill="url(#areaFill)" />
            <path d={path('expected')} className="line-expected" />
            <path d={path('submitted')} className="line-submitted" />
            {h && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + ih} className="chart-guide" />
                <circle cx={x(hover)} cy={y(h.expected)} r="4" className="dot-expected" />
                <circle cx={x(hover)} cy={y(h.submitted)} r="5" className="dot-submitted" />
              </g>
            )}
          </svg>
          {h && (
            <div
              className="chart-tooltip"
              style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: y(Math.max(h.expected, h.submitted)) - 10 }}
            >
              <strong>{fmtDay(h.date)}</strong>
              <span>
                <i className="swatch gold" /> {t('chart_submitted')}: {(h.submitted || 0).toLocaleString()} XAF
              </span>
              <span>
                <i className="swatch dashed" /> {t('chart_expected')}: {(h.expected || 0).toLocaleString()} XAF
              </span>
            </div>
          )}
          <div className="chart-legend">
            <span>
              <i className="swatch gold" /> {t('chart_submitted')}
            </span>
            <span>
              <i className="swatch dashed" /> {t('chart_expected')}
            </span>
          </div>
          <div className="sr-only">
          <table>
            <caption>{t('chart_collections_aria')}</caption>
            <thead>
              <tr>
                <th>{t('col_date')}</th>
                <th>{t('chart_expected')}</th>
                <th>{t('chart_submitted')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.expected}</td>
                  <td>{d.submitted}</td>
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
