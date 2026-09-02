import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import MapView from '../components/MapView';
import TripTimeline from '../components/TripTimeline';
import { Ambulance, Power, Phone, MapPin, Navigation, Play, Pause, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { generateRouteWaypoints } from '../utils/geo';
import { playDispatchAlert } from '../utils/sound';

export default function DriverDashboard() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [driverStatus, setDriverStatus] = useState('ONLINE'); // ONLINE, BUSY, OFFLINE
  const [assignedAmbulance, setAssignedAmbulance] = useState(user?.assignedAmbulance || null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [dispatchAlert, setDispatchAlert] = useState(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [routeWaypoints, setRouteWaypoints] = useState([]);

  useEffect(() => {
    fetchDriverAmbulance();
    fetchActiveTrip();
  }, [user]);

  // Join driver socket room & listen for dispatch signals
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join-room', `driver-${user.id}`);

    socket.on('dispatch-request', (newBooking) => {
      playDispatchAlert();
      setDispatchAlert(newBooking);
    });

    socket.on('booking-status-updated', (updatedBooking) => {
      if (activeTrip && activeTrip.id === updatedBooking.id) {
        setActiveTrip(updatedBooking);
      }
    });

    return () => {
      socket.off('dispatch-request');
      socket.off('booking-status-updated');
    };
  }, [socket, user, activeTrip]);

  // Simulation auto-tick effect
  useEffect(() => {
    let timer;
    if (isSimulating && routeWaypoints.length > 0 && simulationIndex < routeWaypoints.length) {
      timer = setInterval(() => {
        const nextCoord = routeWaypoints[simulationIndex];
        if (nextCoord && socket && activeTrip && assignedAmbulance) {
          // Emit socket event
          socket.emit('driver-location-update', {
            ambulanceId: assignedAmbulance.id,
            bookingId: activeTrip.id,
            lat: nextCoord[0],
            lng: nextCoord[1]
          });

          setActiveTrip(prev => ({
            ...prev,
            currentLocation: { lat: nextCoord[0], lng: nextCoord[1] }
          }));

          setSimulationIndex(prev => prev + 1);
        } else {
          setIsSimulating(false);
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isSimulating, simulationIndex, routeWaypoints, socket, activeTrip, assignedAmbulance]);

  const fetchDriverAmbulance = async () => {
    try {
      const res = await axios.get('/api/ambulances');
      const found = res.data.find(a => a.driverId === user.id || a.driverName.includes(user.name.split(' ')[0]));
      if (found) {
        setAssignedAmbulance(found);
        setDriverStatus(found.status);
      }
    } catch (err) {
      console.error('Failed to fetch driver ambulance', err);
    }
  };

  const fetchActiveTrip = async () => {
    try {
      const res = await axios.get(`/api/bookings?driverId=${user.id}`);
      const active = res.data.find(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
      if (active) {
        setActiveTrip(active);
        setupRouteSimulation(active);
      }
    } catch (err) {
      console.error('Failed to fetch active trip', err);
    }
  };

  const setupRouteSimulation = (trip) => {
    if (!trip) return;
    const start = trip.currentLocation || trip.pickup;
    const end = trip.destination;
    const waypoints = generateRouteWaypoints(start.lat, start.lng, end.lat, end.lng, 20);
    setRouteWaypoints(waypoints);
    setSimulationIndex(0);
  };

  const handleToggleOnline = async () => {
    const newStatus = driverStatus === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    setDriverStatus(newStatus);
    if (assignedAmbulance) {
      try {
        await axios.put(`/api/ambulances/${assignedAmbulance.id}/status`, { status: newStatus });
      } catch (err) {
        console.error('Status update failed', err);
      }
    }
  };

  const handleAcceptDispatch = async (booking) => {
    try {
      const res = await axios.put(`/api/bookings/${booking.id}/status`, {
        status: 'EN_ROUTE_TO_PICKUP',
        note: `Driver ${user.name} accepted dispatch and is en route`
      });
      setActiveTrip(res.data);
      setDispatchAlert(null);
      setupRouteSimulation(res.data);
    } catch (err) {
      alert('Failed to accept dispatch');
    }
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!activeTrip) return;
    try {
      const res = await axios.put(`/api/bookings/${activeTrip.id}/status`, {
        status: nextStatus,
        note: `Status updated to ${nextStatus} by driver`
      });
      setActiveTrip(res.data);
      if (nextStatus === 'COMPLETED') {
        setIsSimulating(false);
        setActiveTrip(null);
        setDriverStatus('AVAILABLE');
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Driver Console Header */}
      <div className="glass-panel" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#ff9100', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255,145,0,0.4)' }}>
            <Ambulance size={28} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              DRIVER NAVIGATION CONSOLE
              <span className={`badge ${driverStatus === 'AVAILABLE' ? 'badge-available' : 'badge-busy'}`}>
                {driverStatus}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Assigned Vehicle: <strong style={{ color: 'var(--secondary-blue)' }}>{assignedAmbulance ? assignedAmbulance.vehicleNumber : 'TS 09 EQ 1008'}</strong> ({assignedAmbulance ? assignedAmbulance.typeName : 'ALS Unit'})
            </div>
          </div>
        </div>

        {/* Toggle Online Duty */}
        <button
          onClick={handleToggleOnline}
          className="btn-secondary"
          style={{
            background: driverStatus === 'OFFLINE' ? 'rgba(255,42,75,0.2)' : 'rgba(0,230,118,0.2)',
            borderColor: driverStatus === 'OFFLINE' ? '#ff2a4b' : '#00e676',
            color: driverStatus === 'OFFLINE' ? '#ff2a4b' : '#00e676',
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: '700'
          }}
        >
          <Power size={18} />
          {driverStatus === 'OFFLINE' ? 'GO ONLINE (AVAILABLE)' : 'GO OFFLINE'}
        </button>
      </div>

      {/* DISPATCH RADAR ALERT MODAL */}
      {dispatchAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '32px', border: '2px solid #ff2a4b', boxShadow: '0 0 40px rgba(255,42,75,0.6)', animation: 'pulse-sos 1.5s infinite' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', background: '#ff2a4b', padding: '16px', borderRadius: '50%', marginBottom: '12px' }}>
                <ShieldAlert size={36} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ff2a4b' }}>INCOMING EMERGENCY DISPATCH!</h2>
              <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>#{dispatchAlert.id} - {dispatchAlert.emergencyType}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>👤 <strong>Patient:</strong> {dispatchAlert.patientName} ({dispatchAlert.patientPhone})</div>
              <div>📍 <strong>Pickup:</strong> {dispatchAlert.pickup.address}</div>
              <div>🏥 <strong>Hospital:</strong> {dispatchAlert.destination.name}</div>
              <div>⚡ <strong>Severity:</strong> <span className="badge badge-critical">{dispatchAlert.severity}</span></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn-primary" onClick={() => handleAcceptDispatch(dispatchAlert)} style={{ padding: '14px', justifyContent: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, #00e676, #00b0ff)' }}>
                ACCEPT TRIP
              </button>
              <button className="btn-secondary" onClick={() => setDispatchAlert(null)} style={{ padding: '14px', justifyContent: 'center' }}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DRIVER INTERFACE */}
      {activeTrip ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Live Navigation Map */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-enroute" style={{ marginBottom: '6px' }}>
                  NAVIGATION MODE - TRIP #{activeTrip.id}
                </span>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>En Route to Destination</h3>
              </div>

              {/* Simulation Controller */}
              <button
                className="btn-primary"
                onClick={() => setIsSimulating(!isSimulating)}
                style={{ background: isSimulating ? '#ff9100' : 'var(--secondary-blue)', padding: '10px 18px', fontSize: '0.85rem' }}
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                {isSimulating ? 'Pause GPS Drive' : 'Simulate Live GPS Drive'}
              </button>
            </div>

            <MapView
              center={[activeTrip.currentLocation?.lat || activeTrip.pickup.lat, activeTrip.currentLocation?.lng || activeTrip.pickup.lng]}
              zoom={14}
              ambulances={assignedAmbulance ? [{ ...assignedAmbulance, lat: activeTrip.currentLocation?.lat || activeTrip.pickup.lat, lng: activeTrip.currentLocation?.lng || activeTrip.pickup.lng }] : []}
              pickupLocation={activeTrip.pickup}
              destinationLocation={activeTrip.destination}
              routeLine={routeWaypoints}
              height="450px"
            />

            <TripTimeline booking={activeTrip} />
          </div>

          {/* Action & Patient Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Action Buttons */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Trip Status Controls</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <button
                  className="btn-primary"
                  onClick={() => handleUpdateStatus('EN_ROUTE_TO_PICKUP')}
                  disabled={activeTrip.status === 'EN_ROUTE_TO_PICKUP'}
                  style={{ justifyContent: 'center', opacity: activeTrip.status === 'EN_ROUTE_TO_PICKUP' ? 0.6 : 1 }}
                >
                  1. En Route to Pickup Point
                </button>

                <button
                  className="btn-primary"
                  onClick={() => handleUpdateStatus('PATIENT_PICKED_UP')}
                  disabled={activeTrip.status === 'PATIENT_PICKED_UP'}
                  style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #ff9100, #ff6d00)', opacity: activeTrip.status === 'PATIENT_PICKED_UP' ? 0.6 : 1 }}
                >
                  2. Patient Loaded Onboard
                </button>

                <button
                  className="btn-primary"
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #00e676, #00c853)' }}
                >
                  3. Arrived at Hospital & Complete Trip
                </button>
              </div>
            </div>

            {/* Patient Info Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Patient Details</h4>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px', color: '#cbd5e1' }}>
                <div>👤 <strong>Name:</strong> {activeTrip.patientName}</div>
                <div>📞 <strong>Phone:</strong> {activeTrip.patientPhone}</div>
                <div>🚨 <strong>Type:</strong> {activeTrip.emergencyType}</div>
                <div>📍 <strong>Pickup:</strong> {activeTrip.pickup.address}</div>
                <div>🏥 <strong>Hospital:</strong> {activeTrip.destination.name}</div>
              </div>

              <a href={`tel:${activeTrip.patientPhone}`} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', textDecoration: 'none' }}>
                <Phone size={18} />
                Call Patient
              </a>
            </div>

          </div>
        </div>
      ) : (
        /* IDLE DRIVER VIEW */
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(0,210,255,0.1)', padding: '24px', borderRadius: '50%', border: '1px solid rgba(0,210,255,0.2)' }}>
            <Navigation size={48} color="var(--secondary-blue)" />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>Radar Active - Waiting for Dispatch</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', fontSize: '0.9rem' }}>
            You are online and available. When a nearby patient triggers an Emergency SOS or books your unit, an audio alert and dispatch card will pop up immediately.
          </p>
        </div>
      )}

    </div>
  );
}
