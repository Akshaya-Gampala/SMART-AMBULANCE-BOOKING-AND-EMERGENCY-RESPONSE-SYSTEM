const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const ambulanceRoutes = require('./routes/ambulance');
const bookingRoutes = require('./routes/booking');
const adminRoutes = require('./routes/admin');
const handleSockets = require('./sockets/tracking');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Attach io to app so routes can broadcast
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'Smart Ambulance Booking API', timestamp: new Date().toISOString() });
});

// Setup WebSockets
handleSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚑 Smart Ambulance Server running on http://localhost:${PORT}`);
});
