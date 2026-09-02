const express = require('express');
const router = express.Router();
const { ambulances, hospitals } = require('../store');

// GET /api/ambulances - Get all ambulances with optional filters
router.get('/', (req, res) => {
  const { type, status } = req.query;
  let list = ambulances;

  if (type) {
    list = list.filter(a => a.type.toUpperCase() === type.toUpperCase());
  }
  if (status) {
    list = list.filter(a => a.status.toUpperCase() === status.toUpperCase());
  }

  res.json(list);
});

// GET /api/ambulances/hospitals - Get list of emergency hospitals
router.get('/hospitals', (req, res) => {
  res.json(hospitals);
});

// GET /api/ambulances/:id - Get single ambulance details
router.get('/:id', (req, res) => {
  const amb = ambulances.find(a => a.id === req.params.id);
  if (!amb) return res.status(404).json({ error: 'Ambulance not found' });
  res.json(amb);
});

// POST /api/ambulances - Add new ambulance (Admin)
router.post('/', (req, res) => {
  const { vehicleNumber, type, typeName, driverName, driverPhone, locationName, lat, lng, equipment, basePrice, perKmPrice } = req.body;
  if (!vehicleNumber || !type) {
    return res.status(400).json({ error: 'Vehicle number and type are required' });
  }

  const newAmb = {
    id: `AMB-${Math.floor(100 + Math.random() * 900)}`,
    vehicleNumber,
    type: type.toUpperCase(),
    typeName: typeName || `${type.toUpperCase()} Unit`,
    status: 'AVAILABLE',
    driverId: null,
    driverName: driverName || 'Unassigned Driver',
    driverPhone: driverPhone || '+91 90000 00000',
    lat: lat || 17.4380,
    lng: lng || 78.4200,
    locationName: locationName || 'Central Station',
    equipment: equipment || ['Basic First Aid', 'Oxygen Cylinder', 'Stretcher'],
    basePrice: basePrice || 1000,
    perKmPrice: perKmPrice || 30
  };

  ambulances.push(newAmb);
  res.status(201).json(newAmb);
});

// PUT /api/ambulances/:id/status - Update ambulance status (AVAILABLE, BUSY, OFFLINE)
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const amb = ambulances.find(a => a.id === req.params.id);
  if (!amb) return res.status(404).json({ error: 'Ambulance not found' });

  amb.status = status;
  res.json(amb);
});

module.exports = router;
