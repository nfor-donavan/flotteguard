import React from 'react';

const paths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-6a2 2 0 0 1 2-1.500h10a2 2 0 0 1 2 1.500l2 6v5a1 1 0 0 1-1 1h-1.500a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <circle cx="7.500" cy="14" r="1" />
      <circle cx="16.500" cy="14" r="1" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M16 7l3 3M14 9l2 2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.500" />
      <path d="M2.500 20c0-3.600 2.900-6 6.500-6s6.500 2.400 6.500 6" />
      <path d="M16 4.500a3.500 3.500 0 0 1 0 7M18 14.500c2.200.7 3.500 2.600 3.500 5.500" />
    </>
  ),
  steering: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.500" />
      <path d="M3.200 10.500c3 .6 5.200.9 8.800 1.500 3.600-.6 5.800-.9 8.800-1.500M12 14.500V21" />
    </>
  ),
  wrench: <path d="M14.700 6.300a4 4 0 0 0 5 5l1.300 1.300-2.400 2.400-1.300-1.300a4 4 0 0 0-1.500.2L6.500 22 3 18.500l8.300-9.300a4 4 0 0 0 .2-1.500L10 6.300 12.300 4z" />,
  alert: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v4.500M12 17.500v.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
      <circle cx="12" cy="13" r="3.500" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.500" height="7.500" rx="1.500" />
      <rect x="13.500" y="3" width="7.500" height="7.500" rx="1.500" />
      <rect x="3" y="13.500" width="7.500" height="7.500" rx="1.500" />
      <rect x="13.500" y="13.500" width="7.500" height="7.500" rx="1.500" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.500 6h.5M3.500 12h.5M3.500 18h.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  phone: <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  id: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M14 10h4M14 14h4M6 16c.5-1.500 5.500-1.500 6 0" />
    </>
  ),
  coins: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.500 9a2.500 2.500 0 0 0-2.500-1.500c-1.500 0-2.500.8-2.500 2s1 1.800 2.500 2 2.500.8 2.500 2-1 2-2.500 2A2.500 2.500 0 0 1 9.500 15M12 6v1.500M12 16.500V18" />
    </>
  ),
  trend: <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />,
  check: <path d="M5 12l5 5L20 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 0 0-14.500-3.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14.500 3.500L20 15M20 20v-5h-5" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.800" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" />
};

export default function Icon({ name, size = 18, className, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
