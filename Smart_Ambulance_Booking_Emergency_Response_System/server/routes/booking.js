const express = require('express');
const router = express.Router();
const { bookings, ambulances, hospitals } = require('../store');

// GET /api/bookings - Get all bookings (optional user or driver filter)
router.get('/', (req, res) => {
  const { patientId, driverId, status } = req.query;
  let list = bookings;

  if (patientId) {
    list = list.filter(b => b.patientId === patientId);
  }
  if (driverId) {
    list = list.filter(b => b.driverId === driverId);
  }
  if (status) {
    list = list.filter(b => b.status === status);
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// GET /api/bookings/:id - Get single booking details
router.get('/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

// POST /api/bookings - Create new ambulance booking or emergency SOS
router.post('/', (req, res) => {
  const { patientId, patientName, patientPhone, emergencyType, severity, ambulanceType, pickup, destination, isSOS } = req.body;

  if (!pickup || !pickup.address) {
    return res.status(400).json({ error: 'Pickup location is required' });
  }

  // Auto assign closest available ambulance of matching type or any available if SOS
  let availableAmbulance = ambulances.find(a => a.status === 'AVAILABLE' && (ambulanceType ? a.type === ambulanceType : true));
  if (!availableAmbulance) {
    // Fallback to any AVAILABLE ambulance
    availableAmbulance = ambulances.find(a => a.status === 'AVAILABLE');
  }

  const selectedHospital = destination && destination.name 
    ? destination 
    : { name: hospitals[0].name, address: hospitals[0].address, lat: hospitals[0].lat, lng: hospitals[0].lng };

  const pickupLat = pickup.lat || 17.4450;
  const pickupLng = pickup.lng || 78.3880;

  // Simple distance math estimation
  const dx = selectedHospital.lat - pickupLat;
  const dy = selectedHospital.lng - pickupLng;
  const distanceKm = Math.max(2.5, Math.round(Math.sqrt(dx*dx + dy*dy) * 111 * 10) / 10);
  const baseRate = availableAmbulance ? availableAmbulance.basePrice : 1200;
  const kmRate = availableAmbulance ? availableAmbulance.perKmPrice : 30;
  const fare = Math.round(baseRate + distanceKm * kmRate);
  const etaMinutes = Math.max(3, Math.round(distanceKm * 1.5));

  const newBooking = {
    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: patientId || 'usr-1',
    patientName: patientName || 'Emergency Patient',
    patientPhone: patientPhone || '+91 98765 43210',
    emergencyType: emergencyType || (isSOS ? 'CRITICAL SOS EMERGENCY' : 'Patient Transport'),
    severity: severity || (isSOS ? 'CRITICAL' : 'HIGH'),
    ambulanceId: availableAmbulance ? availableAmbulance.id : null,
    ambulanceType: ambulanceType || (availableAmbulance ? availableAmbulance.type : 'ALS'),
    driverId: availableAmbulance ? availableAmbulance.driverId : null,
    driverName: availableAmbulance ? availableAmbulance.driverName : 'Unassigned Driver',
    driverPhone: availableAmbulance ? availableAmbulance.driverPhone : '+91 90000 00000',
    vehicleNumber: availableAmbulance ? availableAmbulance.vehicleNumber : 'TS 09 EQ 1008',
    pickup: {
      address: pickup.address,
      lat: pickupLat,
      lng: pickupLng
    },
    destination: selectedHospital,
    currentLocation: availableAmbulance ? { lat: availableAmbulance.lat, lng: availableAmbulance.lng } : { lat: pickupLat + 0.02, lng: pickupLng + 0.02 },
    status: availableAmbulance ? 'ACCEPTED' : 'SEARCHING',
    etaMinutes,
    distanceKm,
    fare,
    createdAt: new Date().toISOString(),
    logs: [
      { status: 'SEARCHING', timestamp: new Date().toISOString(), note: isSOS ? 'Emergency SOS One-Tap Triggered' : 'Booking Request Initiated' }
    ]
  };

  if (availableAmbulance) {
    availableAmbulance.status = 'BUSY';
    newBooking.logs.push({
      status: 'ACCEPTED',
      timestamp: new Date().toISOString(),
      note: `Auto-assigned to Driver ${availableAmbulance.driverName} (${availableAmbulance.vehicleNumber})`
    });
  }

  bookings.unshift(newBooking);

  // Broadcast socket event if req.app.get('io') exists
  const io = req.app.get('io');
  if (io) {
    io.emit('new-booking', newBooking);
    if (newBooking.driverId) {
      io.to(`driver-${newBooking.driverId}`).emit('dispatch-request', newBooking);
    }
  }

  res.status(201).json(newBooking);
});

// PUT /api/bookings/:id/status - Update trip status (SEARCHING -> ACCEPTED -> EN_ROUTE_TO_PICKUP -> PATIENT_PICKED_UP -> COMPLETED)
router.put('/:id/status', (req, res) => {
  const { status, note, lat, lng } = req.body;
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  booking.status = status;
  if (lat && lng) {
    booking.currentLocation = { lat, lng };
  }

  booking.logs.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status}`
  });

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    const amb = ambulances.find(a => a.id === booking.ambulanceId);
    if (amb) {
      amb.status = 'AVAILABLE';
    }
  }

  // Socket broadcast
  const io = req.app.get('io');
  if (io) {
    io.emit('booking-status-updated', booking);
    io.to(`booking-${booking.id}`).emit('trip-update', booking);
  }

  res.json(booking);
});

module.exports = router;
