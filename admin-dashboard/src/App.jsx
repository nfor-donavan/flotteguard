import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Rentals from './pages/Rentals';
import DailyLogs from './pages/DailyLogs';
import Staff from './pages/Staff';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
      <Route path="/vehicles/:id" element={<PrivateRoute><VehicleDetail /></PrivateRoute>} />
      <Route path="/rentals" element={<PrivateRoute><Rentals /></PrivateRoute>} />
      <Route path="/daily-logs" element={<PrivateRoute><DailyLogs /></PrivateRoute>} />
      <Route path="/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
    </Routes>
  );
}
