import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom SVG Icons for Leaflet
const createCustomIcon = (svgString, size = [36, 36]) => {
  return L.divIcon({
    html: svgString,
    className: 'custom-leaflet-icon',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2]
  });
};

const ambulanceSvg = `
  <div style="background: #00d2ff; border: 2px solid #ffffff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(0,210,255,0.8); cursor: pointer;">
    <span style="font-size: 18px;">🚑</span>
  </div>
`;

const patientPickupSvg = `
  <div style="background: #ff2a4b; border: 2px solid #ffffff; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(255,42,75,0.9); animation: pulse-sos 1.5s infinite; cursor: pointer;">
    <span style="font-size: 16px;">📍</span>
  </div>
`;

const hospitalSvg = `
  <div style="background: #00e676; border: 2px solid #ffffff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(0,230,118,0.7); cursor: pointer;">
    <span style="font-size: 18px;">🏥</span>
  </div>
`;

const ambulanceIcon = createCustomIcon(ambulanceSvg);
const patientIcon = createCustomIcon(patientPickupSvg);
const hospitalIcon = createCustomIcon(hospitalSvg);

// Auto re-center map component
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

// Map Click Listener
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

export default function MapView({
  center = [17.4380, 78.4200],
  zoom = 13,
  ambulances = [],
  pickupLocation = null,
  destinationLocation = null,
  hospitals = [],
  routeLine = [],
  onSelectPickup = null,
  activeBooking = null,
  height = '100%'
}) {
  return (
    <div style={{ width: '100%', height, minHeight: '380px', position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} zoom={zoom} />
        <MapEvents onMapClick={onSelectPickup} />

        {/* Dark Mode Map Tiles (CartoDB Dark Matter) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route Line */}
        {routeLine && routeLine.length > 0 && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: '#00d2ff', weight: 5, opacity: 0.8, dashArray: '10, 10' }}
          />
        )}

        {/* Patient Pickup Marker */}
        {pickupLocation && (
          <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={patientIcon}>
            <Popup>
              <div style={{ color: '#000', fontWeight: 'bold' }}>
                📍 Patient Pickup Point
                <br />
                {pickupLocation.address || 'Selected Location'}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Hospital Marker */}
        {destinationLocation && (
          <Marker position={[destinationLocation.lat, destinationLocation.lng]} icon={hospitalIcon}>
            <Popup>
              <div style={{ color: '#000', fontWeight: 'bold' }}>
                🏥 {destinationLocation.name || 'Destination Hospital'}
                <br />
                {destinationLocation.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fleet Hospitals */}
        {hospitals && hospitals.length > 0 && !destinationLocation && hospitals.map(h => (
          <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
            <Popup>
              <div style={{ color: '#000' }}>
                <strong>🏥 {h.name}</strong><br />
                {h.address}<br />
                <span style={{ color: '#00e676', fontWeight: '600' }}>ICU Beds Available: {h.icuBeds}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ambulances */}
        {ambulances && ambulances.map(amb => (
          <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={ambulanceIcon}>
            <Popup>
              <div style={{ color: '#000', minWidth: '180px' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0072ff' }}>🚑 {amb.vehicleNumber}</div>
                <div><strong>Type:</strong> {amb.typeName || amb.type}</div>
                <div><strong>Driver:</strong> {amb.driverName} ({amb.driverPhone})</div>
                <div><strong>Status:</strong> <span style={{ color: amb.status === 'AVAILABLE' ? 'green' : 'orange', fontWeight: 'bold' }}>{amb.status}</span></div>
                <div><strong>Location:</strong> {amb.locationName || 'On Route'}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 999, background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.75rem', display: 'flex', gap: '14px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🚑</span> Available Ambulance</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>📍</span> Patient Pickup Point</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span>🏥</span> Emergency Hospital</div>
      </div>
    </div>
  );
}
