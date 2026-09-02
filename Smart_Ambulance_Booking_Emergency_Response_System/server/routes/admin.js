const express = require('express');
const router = express.Router();
const { ambulances, users, bookings, hospitals } = require('../store');

// GET /api/admin/analytics - Overview metrics for dashboard
router.get('/analytics', (req, res) => {
  const totalBookings = bookings.length;
  const activeEmergencies = bookings.filter(b => !['COMPLETED', 'CANCELLED'].includes(b.status)).length;
  const totalAmbulances = ambulances.length;
  const availableAmbulances = ambulances.filter(a => a.status === 'AVAILABLE').length;
  const busyAmbulances = ambulances.filter(a => a.status === 'BUSY').length;
  const offlineAmbulances = ambulances.filter(a => a.status === 'OFFLINE').length;

  const totalDrivers = users.filter(u => u.role === 'driver').length;
  const totalPatients = users.filter(u => u.role === 'patient').length;

  // Average response time simulation (e.g. 5.8 mins)
  const avgResponseTime = '5.4 mins';

  res.json({
    totalBookings,
    activeEmergencies,
    totalAmbulances,
    availableAmbulances,
    busyAmbulances,
    offlineAmbulances,
    totalDrivers,
    totalPatients,
    avgResponseTime,
    totalHospitals: hospitals.length
  });
});

// POST /api/admin/dispatch - Manual Dispatch Assignment Override
router.post('/dispatch', (req, res) => {
  const { bookingId, ambulanceId } = req.body;
  const booking = bookings.find(b => b.id === bookingId);
  const amb = ambulances.find(a => a.id === ambulanceId);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (!amb) return res.status(404).json({ error: 'Ambulance not found' });

  booking.ambulanceId = amb.id;
  booking.ambulanceType = amb.type;
  booking.driverId = amb.driverId;
  booking.driverName = amb.driverName;
  booking.driverPhone = amb.driverPhone;
  booking.vehicleNumber = amb.vehicleNumber;
  booking.status = 'ACCEPTED';
  amb.status = 'BUSY';

  booking.logs.push({
    status: 'ACCEPTED',
    timestamp: new Date().toISOString(),
    note: `Manually dispatched by Admin Controller to Driver ${amb.driverName}`
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('booking-status-updated', booking);
  }

  res.json(booking);
});

module.exports = router;
