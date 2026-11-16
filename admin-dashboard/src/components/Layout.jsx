import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Icon from './Icon';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <img src="/icon.png" alt="FlotteGuard" />
          <span>FlotteGuard</span>
        </div>
        <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Icon name="list" size={22} />
        </button>
      </div>

      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <main className="main">{children}</main>
    </div>
  );
}
