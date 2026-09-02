const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { users, ambulances } = require('../store');

const JWT_SECRET = 'super_secret_emergency_key_2026';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ error: `Account exists but role is '${user.role}', not '${role}'` });
  }

  // Attach driver's assigned ambulance if driver
  let assignedAmbulance = null;
  if (user.role === 'driver') {
    assignedAmbulance = ambulances.find(a => a.driverId === user.id || a.driverName.includes(user.name.split(' ')[0]));
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      emergencyContact: user.emergencyContact,
      assignedAmbulance
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone, role, emergencyContact } = req.body;
  
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    phone,
    role: role || 'patient',
    emergencyContact: emergencyContact || ''
  };

  users.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      emergencyContact: newUser.emergencyContact
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let assignedAmbulance = null;
    if (user.role === 'driver') {
      assignedAmbulance = ambulances.find(a => a.driverId === user.id || a.driverName.includes(user.name.split(' ')[0]));
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyContact: user.emergencyContact,
        assignedAmbulance
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
