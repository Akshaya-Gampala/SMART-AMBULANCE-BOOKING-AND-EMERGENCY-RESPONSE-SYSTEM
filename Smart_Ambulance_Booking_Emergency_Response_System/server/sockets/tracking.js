const { ambulances, bookings } = require('../store');

module.exports = function handleSockets(io) {
  io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // Join room (e.g. driver-usr-2 or booking-BK-9901)
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Driver location update stream
    socket.on('driver-location-update', (data) => {
      const { ambulanceId, bookingId, lat, lng, heading } = data;

      // Update in memory store
      const amb = ambulances.find(a => a.id === ambulanceId);
      if (amb) {
        amb.lat = lat;
        amb.lng = lng;
      }

      if (bookingId) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          booking.currentLocation = { lat, lng };
        }
      }

      // Broadcast to all clients (Patients and Admin live maps)
      io.emit('ambulance-moved', { ambulanceId, bookingId, lat, lng, heading });
    });

    // Driver trip status change
    socket.on('update-trip-status', (data) => {
      const { bookingId, status, note } = data;
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
        booking.logs.push({
          status,
          timestamp: new Date().toISOString(),
          note: note || `Trip status updated to ${status}`
        });

        if (['COMPLETED', 'CANCELLED'].includes(status)) {
          const amb = ambulances.find(a => a.id === booking.ambulanceId);
          if (amb) amb.status = 'AVAILABLE';
        }

        io.emit('booking-status-updated', booking);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
