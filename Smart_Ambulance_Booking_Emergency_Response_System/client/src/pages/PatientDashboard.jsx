import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import MapView from '../components/MapView';
import AmbulanceCard from '../components/AmbulanceCard';
import TripTimeline from '../components/TripTimeline';
import { ShieldAlert, Ambulance, MapPin, Hospital, Phone, Clock, AlertTriangle, CheckCircle2, History, X } from 'lucide-react';
import { generateRouteWaypoints } from '../utils/geo';
import { playEmergencySiren } from '../utils/sound';

export default function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  // Form State
  const [pickupAddress, setPickupAddress] = useState('Madhapur Metro Station, Hyderabad');
  const [pickupCoords, setPickupCoords] = useState({ lat: 17.4483, lng: 78.3915 });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [emergencyType, setEmergencyType] = useState('Cardiac Alert / Medical Emergency');

  // Active Trip State
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeLine, setRouteLine] = useState([]);

  // Fetch initial data & check for active bookings
  useEffect(() => {
    fetchAmbulances();
    fetchHospitals();
    fetchUserBookings();
  }, [user]);

  // Listen for WebSocket real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('booking-status-updated', (updatedBooking) => {
      if (updatedBooking.patientId === user.id || (activeBooking && activeBooking.id === updatedBooking.id)) {
        setActiveBooking(updatedBooking);
      }
      fetchUserBookings();
    });

    socket.on('ambulance-moved', (data) => {
      const { bookingId, lat, lng } = data;
      if (activeBooking && activeBooking.id === bookingId) {
        setActiveBooking(prev => ({
          ...prev,
          currentLocation: { lat, lng }
        }));
      }
    });

    return () => {
      socket.off('booking-status-updated');
      socket.off('ambulance-moved');
    };
  }, [socket, activeBooking, user]);

  // Recalculate route polyline whenever pickup/destination or active booking changes
  useEffect(() => {
    if (activeBooking && activeBooking.pickup && activeBooking.destination) {
      const start = activeBooking.currentLocation || activeBooking.pickup;
      const waypoints = generateRouteWaypoints(start.lat, start.lng, activeBooking.destination.lat, activeBooking.destination.lng);
      setRouteLine(waypoints);
    } else if (pickupCoords && selectedHospital) {
      const waypoints = generateRouteWaypoints(pickupCoords.lat, pickupCoords.lng, selectedHospital.lat, selectedHospital.lng);
      setRouteLine(waypoints);
    } else {
      setRouteLine([]);
    }
  }, [activeBooking, pickupCoords, selectedHospital]);

  const fetchAmbulances = async () => {
    try {
      const res = await axios.get('/api/ambulances');
      setAmbulances(res.data);
    } catch (err) {
      console.error('Failed to fetch ambulances', err);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await axios.get('/api/ambulances/hospitals');
      setHospitals(res.data);
      if (res.data.length > 0) {
        setSelectedHospital(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch hospitals', err);
    }
  };

  const fetchUserBookings = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/api/bookings?patientId=${user.id}`);
      setBookingHistory(res.data);
      
      // Find active (non-completed) booking
      const active = res.data.find(b => !['COMPLETED', 'CANCELLED'].includes(b.status));
      if (active) {
        setActiveBooking(active);
      }
    } catch (err) {
      console.error('Failed to fetch user bookings', err);
    }
  };

  const handleMapClick = (latlng) => {
    if (activeBooking) return; // Locked during active trip
    setPickupCoords({ lat: latlng.lat, lng: latlng.lng });
    setPickupAddress(`Selected Map Point (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`);
  };

  const handleRequestAmbulance = async (isSOS = false) => {
    setLoading(true);
    if (isSOS) playEmergencySiren();

    try {
      const payload = {
        patientId: user.id,
        patientName: user.name,
        patientPhone: user.phone,
        emergencyType: isSOS ? 'CRITICAL SOS EMERGENCY' : emergencyType,
        severity: isSOS ? 'CRITICAL' : 'HIGH',
        ambulanceType: selectedAmbulance ? selectedAmbulance.type : (isSOS ? 'ALS' : null),
        pickup: {
          address: pickupAddress,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng
        },
        destination: selectedHospital,
        isSOS
      };

      const res = await axios.post('/api/bookings', payload);
      setActiveBooking(res.data);
      fetchUserBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch ambulance request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBooking) return;
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      await axios.put(`/api/bookings/${activeBooking.id}/status`, {
        status: 'CANCELLED',
        note: 'Cancelled by patient'
      });
      setActiveBooking(null);
      fetchUserBookings();
    } catch (err) {
      console.error('Failed to cancel booking', err);
    }
  };

  const filteredAmbulances = selectedType === 'ALL'
    ? ambulances
    : ambulances.filter(a => a.type === selectedType);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Emergency SOS Banner */}
      <div className="glass-panel" style={{ padding: '20px 28px', background: 'linear-gradient(135deg, rgba(255, 42, 75, 0.25) 0%, rgba(14, 21, 38, 0.9) 100%)', border: '1px solid rgba(255, 42, 75, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#ff2a4b', padding: '14px', borderRadius: '50%', boxShadow: '0 0 20px rgba(255,42,75,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={28} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>1-TAP CRITICAL EMERGENCY DISPATCH</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Pressing SOS instantly dispatches the nearest Advanced Life Support (ALS) unit to your GPS location.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sos-pulse-btn" onClick={() => handleRequestAmbulance(true)} disabled={loading || !!activeBooking} style={{ padding: '12px 28px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={22} />
            {activeBooking ? 'RESCUE ACTIVE' : 'DISPATCH SOS NOW'}
          </button>
          <button className="btn-secondary" onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} />
            History
          </button>
        </div>
      </div>

      {/* ACTIVE TRIP DASHBOARD VIEW */}
      {activeBooking ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Map Column */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-critical" style={{ marginBottom: '6px' }}>
                  🚨 ACTIVE EMERGENCY DISPATCH #{activeBooking.id}
                </span>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{activeBooking.emergencyType}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Arrival</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary-blue)' }}>
                  ~{activeBooking.etaMinutes || 5} mins
                </div>
              </div>
            </div>

            <MapView
              center={[activeBooking.currentLocation?.lat || activeBooking.pickup.lat, activeBooking.currentLocation?.lng || activeBooking.pickup.lng]}
              zoom={14}
              ambulances={ambulances.filter(a => a.id === activeBooking.ambulanceId)}
              pickupLocation={activeBooking.pickup}
              destinationLocation={activeBooking.destination}
              routeLine={routeLine}
              height="450px"
            />

            <TripTimeline booking={activeBooking} />
          </div>

          {/* Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Assigned Driver Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ambulance size={20} color="var(--secondary-blue)" />
                Assigned Rescue Team
              </h4>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>{activeBooking.driverName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--secondary-blue)', fontWeight: '600', margin: '4px 0' }}>
                  {activeBooking.vehicleNumber} ({activeBooking.ambulanceType})
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Driver Contact: <strong style={{ color: '#fff' }}>{activeBooking.driverPhone}</strong>
                </div>
              </div>

              <a href={`tel:${activeBooking.driverPhone}`} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '12px', textDecoration: 'none' }}>
                <Phone size={18} />
                Call Driver Immediately
              </a>

              <button className="btn-danger" onClick={handleCancelBooking} style={{ width: '100%', padding: '10px' }}>
                Cancel Booking Request
              </button>
            </div>

            {/* Trip Summary Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Trip Locations</h4>
              <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <MapPin size={18} color="#ff2a4b" style={{ shrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PICKUP</div>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{activeBooking.pickup.address}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Hospital size={18} color="#00e676" style={{ shrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DESTINATION HOSPITAL</div>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{activeBooking.destination.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeBooking.destination.address}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', pt: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem', color: 'var(--secondary-blue)' }}>
                  <span>Est. Fare:</span>
                  <span>₹{activeBooking.fare}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* REGULAR BOOKING INTERFACE */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          
          {/* Booking Form Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Request Ambulance</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select emergency details and hospital destination</p>
            </div>

            {/* Pickup Location */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                📍 Pickup Address / GPS Location
              </label>
              <input
                type="text"
                className="form-control"
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
                placeholder="Enter pickup point or click map..."
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-blue)', marginTop: '4px', display: 'block' }}>
                💡 Tip: You can click anywhere on the map to set pickup point!
              </span>
            </div>

            {/* Emergency Type */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                Medical Situation / Emergency Type
              </label>
              <select className="form-control" value={emergencyType} onChange={e => setEmergencyType(e.target.value)}>
                <option value="Cardiac Alert / Chest Pain">Cardiac Alert / Chest Pain</option>
                <option value="Road Accident & Trauma">Road Accident & Trauma</option>
                <option value="Breathing Difficulty / Respiratory">Breathing Difficulty / Respiratory</option>
                <option value="Pregnancy & Maternity Transport">Pregnancy & Maternity Transport</option>
                <option value="Inter-Hospital Patient Transport">Inter-Hospital Patient Transport</option>
              </select>
            </div>

            {/* Destination Hospital */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: '600' }}>
                🏥 Select Destination Hospital
              </label>
              <select
                className="form-control"
                value={selectedHospital ? selectedHospital.id : ''}
                onChange={e => {
                  const h = hospitals.find(x => x.id === e.target.value);
                  setSelectedHospital(h);
                }}
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.address}) - {h.icuBeds} Beds Free
                  </option>
                ))}
              </select>
            </div>

            {/* Ambulance Filter Tabs */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                Select Ambulance Category
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {['ALL', 'ALS', 'BLS', 'ICU', 'PEDIATRIC'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: selectedType === t ? 'var(--secondary-blue)' : 'rgba(255,255,255,0.03)',
                      color: selectedType === t ? '#000' : 'var(--text-muted)',
                      fontWeight: '700',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t} Units
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleRequestAmbulance(false)}
              disabled={loading}
              style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '1rem', marginTop: '10px' }}
            >
              <Ambulance size={20} />
              Confirm & Request Ambulance
            </button>
          </div>

          {/* Map & Available Fleet List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <MapView
              center={[pickupCoords.lat, pickupCoords.lng]}
              zoom={13}
              ambulances={filteredAmbulances}
              pickupLocation={{ ...pickupCoords, address: pickupAddress }}
              destinationLocation={selectedHospital}
              hospitals={hospitals}
              routeLine={routeLine}
              onSelectPickup={handleMapClick}
              height="340px"
            />

            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
                Nearby Available Fleet ({filteredAmbulances.filter(a => a.status === 'AVAILABLE').length} Available)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredAmbulances.map(amb => (
                  <AmbulanceCard
                    key={amb.id}
                    ambulance={amb}
                    selected={selectedAmbulance?.id === amb.id}
                    onSelect={setSelectedAmbulance}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>Emergency & Booking History</h3>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bookingHistory.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No previous emergency bookings found.</div>
              ) : (
                bookingHistory.map(b => (
                  <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', color: '#fff' }}>#{b.id} - {b.emergencyType}</span>
                      <span className={`badge ${b.status === 'COMPLETED' ? 'badge-available' : 'badge-busy'}`}>{b.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Pickup: {b.pickup.address}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Hospital: {b.destination.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-blue)', marginTop: '6px' }}>
                      {new Date(b.createdAt).toLocaleString()} • Fare: ₹{b.fare}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
