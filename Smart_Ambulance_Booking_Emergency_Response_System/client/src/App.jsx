import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d2ff', fontWeight: 'bold' }}>
        ⚡ Initializing Smart Ambulance Rescue System...
      </div>
    );
  }

  const renderDashboardByRole = () => {
    if (!user) return <Login />;
    if (user.role === 'patient') return <PatientDashboard />;
    if (user.role === 'driver') return <DriverDashboard />;
    if (user.role === 'admin') return <AdminDashboard />;
    return <PatientDashboard />;
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {renderDashboardByRole()}
      </main>
    </div>
  );
}
