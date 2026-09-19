import React from 'react';

export default function Modal({ title, onClose, children }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(11, 31, 58, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50
};

const cardStyle = {
  background: '#fff',
  borderRadius: 14,
  padding: 24,
  width: 420,
  maxHeight: '85vh',
  overflowY: 'auto'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16
};

const closeButtonStyle = {
  border: 'none',
  background: 'none',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  color: '#5B6478'
};
