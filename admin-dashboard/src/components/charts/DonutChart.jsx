import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/** Fleet status donut with legend. segments: [{ key, label, value, color }] */
export default function DonutChart({ segments = [], size = 176, stroke = 24 }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(null);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  let offset = 0;
  const arcs = segments.map((s) => {
    const len = total ? (s.value / total) * C : 0;
    const arc = { ...s, len: Math.max(len - gap, 0), offset };
    offset += len;
    return arc;
  });
  const focus = active !== null ? segments.find((s) => s.key === active) : null;

  return (
    <div className="donut">
      <div className="donut-svg" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={t('chart_fleet_aria')}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="donut-track" />
            {arcs.map(
              (a) =>
                a.len > 0 && (
                  <circle
                    key={a.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={active === a.key ? stroke + 4 : stroke}
                    strokeDasharray={`${a.len} ${C - a.len}`}
                    strokeDashoffset={-a.offset}
                    strokeLinecap="butt"
                    opacity={active && active !== a.key ? 0.3 : 1}
                    style={{ transition: 'opacity .15s, stroke-width .15s' }}
                    onPointerEnter={() => setActive(a.key)}
                    onPointerLeave={() => setActive(null)}
                  />
                )
            )}
          </g>
        </svg>
        <div className="donut-center">
          <strong>{focus ? focus.value : total}</strong>
          <span>{focus ? focus.label : t('chart_vehicles_total')}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li
            key={s.key}
            className={active === s.key ? 'on' : ''}
            onPointerEnter={() => setActive(s.key)}
            onPointerLeave={() => setActive(null)}
          >
            <i style={{ background: s.color }} />
            <span>{s.label}</span>
            <b>{s.value}</b>
            <em>{total ? Math.round((s.value / total) * 100) : 0}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
