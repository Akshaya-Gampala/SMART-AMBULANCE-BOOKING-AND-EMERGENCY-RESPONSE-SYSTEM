import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import MapView from '../components/MapView';
import { ShieldCheck, Ambulance, Hospital, Activity, Plus, RefreshCw, Radio, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [analytics, setAnalytics] = useState(null);
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Ambulance Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newType, setNewType] = useState('ALS');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newLocationName, setNewLocationName] = useState('Central Station');

  // Manual Dispatch State
  const [selectedBookingForDispatch, setSelectedBookingForDispatch] = useState(null);
  const [selectedAmbulanceForDispatch, setSelectedAmbulanceForDispatch] = useState('');

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-booking', () => {
      fetchAllAdminData();
    });
    socket.on('booking-status-updated', () => {
      fetchAllAdminData();
    });
    socket.on('ambulance-moved', (data) => {
      setAmbulances(prev => prev.map(a => {
        if (a.id === data.ambulanceId) {
          return { ...a, lat: data.lat, lng: data.lng };
        }
        return a;
      }));
    });

    return () => {
      socket.off('new-booking');
      socket.off('booking-status-updated');
      socket.off('ambulance-moved');
    };
  }, [socket]);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ambRes, hospRes, bookRes] = await Promise.all([
        axios.get('/api/admin/analytics'),
        axios.get('/api/ambulances'),
        axios.get('/api/ambulances/hospitals'),
        axios.get('/api/bookings')
      ]);

      setAnalytics(analyticsRes.data);
      setAmbulances(ambRes.data);
      setHospitals(hospRes.data);
      setBookings(bookRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmbulance = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/ambulances', {
        vehicleNumber: newVehicleNumber,
        type: newType,
        driverName: newDriverName,
        driverPhone: newDriverPhone,
        locationName: newLocationName,
        basePrice: newType === 'ICU' ? 3000 : (newType === 'ALS' ? 1500 : 800)
      });
      setShowAddModal(false);
      setNewVehicleNumber('');
      setNewDriverName('');
      setNewDriverPhone('');
      fetchAllAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add ambulance');
    }
  };

  const handleManualDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForDispatch || !selectedAmbulanceForDispatch) return;

    try {
      await axios.post('/api/admin/dispatch', {
        bookingId: selectedBookingForDispatch.id,
        ambulanceId: selectedAmbulanceForDispatch
      });
      setSelectedBookingForDispatch(null);
      setSelectedAmbulanceForDispatch('');
      fetchAllAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Manual dispatch failed');
    }
  };

  const activeEmergencyBookings = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #00d2ff, #0072ff)', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>COMMAND & DISPATCH CONTROL CENTER</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time Emergency Response & Fleet Supervision Dashboard</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            Register Ambulance
          </button>
          <button className="btn-secondary" onClick={fetchAllAdminData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ACTIVE EMERGENCIES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ff2a4b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {analytics.activeEmergencies}
              <Radio size={24} color="#ff2a4b" />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#ff2a4b', marginTop: '4px' }}>Real-time dispatches active</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AVAILABLE FLEET</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#00e676', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {analytics.availableAmbulances} / {analytics.totalAmbulances}
              <Ambulance size={24} color="#00e676" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ready for immediate dispatch</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>AVG RESPONSE TIME</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {analytics.avgResponseTime}
              <Activity size={24} color="var(--secondary-blue)" />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#00e676', marginTop: '4px' }}>↓ 1.2 mins faster than average</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TOTAL BOOKINGS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {analytics.totalBookings}
              <ShieldCheck size={24} color="#fff" />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total processed requests</div>
          </div>

        </div>
      )}

      {/* Global Live Fleet Map & Active Emergencies */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Map Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="#ff2a4b" />
            Global Fleet & Active Emergency Map
          </h3>

          <MapView
            center={[17.4380, 78.4200]}
            zoom={12}
            ambulances={ambulances}
            hospitals={hospitals}
            height="480px"
          />
        </div>

        {/* Active Emergency Radar & Manual Dispatch Override */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#ff9100" />
            Active Emergency Queue ({activeEmergencyBookings.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px' }}>
            {activeEmergencyBookings.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '24px' }}>No pending active emergencies.</div>
            ) : (
              activeEmergencyBookings.map(b => (
                <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', color: '#ff2a4b', fontSize: '0.9rem' }}>#{b.id} - {b.emergencyType}</span>
                    <span className="badge badge-critical">{b.severity}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '4px' }}>
                    👤 <strong>Patient:</strong> {b.patientName} ({b.patientPhone})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📍 Pickup: {b.pickup.address}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    🚑 Vehicle: <strong style={{ color: 'var(--secondary-blue)' }}>{b.vehicleNumber}</strong> ({b.driverName})
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedBookingForDispatch(b);
                    }}
                    style={{ width: '100%', fontSize: '0.75rem', padding: '6px', justifyContent: 'center' }}
                  >
                    Manual Re-Assign Ambulance
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Fleet Management Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ambulance size={20} color="var(--secondary-blue)" />
          Ambulance Fleet & Driver Roster
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>VEHICLE NO</th>
                <th style={{ padding: '12px' }}>CATEGORY</th>
                <th style={{ padding: '12px' }}>DRIVER NAME</th>
                <th style={{ padding: '12px' }}>STATUS</th>
                <th style={{ padding: '12px' }}>STATION LOCATION</th>
                <th style={{ padding: '12px' }}>BASE RATE</th>
              </tr>
            </thead>
            <tbody>
              {ambulances.map(amb => (
                <tr key={amb.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#fff' }}>🚑 {amb.vehicleNumber}</td>
                  <td style={{ padding: '12px' }}><span className="badge badge-enroute">{amb.type}</span></td>
                  <td style={{ padding: '12px', color: '#fff' }}>{amb.driverName} ({amb.driverPhone})</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${amb.status === 'AVAILABLE' ? 'badge-available' : 'badge-busy'}`}>
                      {amb.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{amb.locationName || 'Abids Emergency Base'}</td>
                  <td style={{ padding: '12px', color: 'var(--secondary-blue)', fontWeight: '600' }}>₹{amb.basePrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Dispatch Modal */}
      {selectedBookingForDispatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Manual Dispatch Override</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Reassign Emergency #{selectedBookingForDispatch.id} ({selectedBookingForDispatch.emergencyType}) to an available ambulance.
            </p>

            <form onSubmit={handleManualDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Select Available Ambulance</label>
                <select className="form-control" value={selectedAmbulanceForDispatch} onChange={e => setSelectedAmbulanceForDispatch(e.target.value)} required>
                  <option value="">-- Choose Ambulance --</option>
                  {ambulances.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.vehicleNumber} ({a.typeName}) - Driver {a.driverName} [{a.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Assign & Dispatch
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelectedBookingForDispatch(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Ambulance Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Register New Ambulance Unit</h3>

            <form onSubmit={handleAddAmbulance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Vehicle Registration Number</label>
                <input type="text" className="form-control" placeholder="TS 09 EQ 5544" value={newVehicleNumber} onChange={e => setNewVehicleNumber(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category Type</label>
                <select className="form-control" value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="ALS">ALS - Advanced Life Support</option>
                  <option value="BLS">BLS - Basic Life Support</option>
                  <option value="ICU">ICU Mobile Unit</option>
                  <option value="PEDIATRIC">Pediatric & Neonatal</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Assigned Driver Name</label>
                <input type="text" className="form-control" placeholder="Ramesh Patel" value={newDriverName} onChange={e => setNewDriverName(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Driver Phone Number</label>
                <input type="text" className="form-control" placeholder="+91 99887 76655" value={newDriverPhone} onChange={e => setNewDriverPhone(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Register Vehicle
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
