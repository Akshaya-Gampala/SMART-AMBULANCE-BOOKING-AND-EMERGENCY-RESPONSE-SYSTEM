// In-memory data store with realistic seed data for Smart Ambulance Booking System

const users = [
  {
    id: 'usr-1',
    name: 'Ananya Rao',
    email: 'patient@emergency.com',
    password: 'password123',
    phone: '+91 98765 43210',
    role: 'patient',
    emergencyContact: '+91 98765 99999 (Brother)'
  },
  {
    id: 'usr-2',
    name: 'Rajesh Kumar (Driver)',
    email: 'driver1@ambulance.com',
    password: 'password123',
    phone: '+91 91234 56789',
    role: 'driver',
    assignedAmbulanceId: 'AMB-101'
  },
  {
    id: 'usr-3',
    name: 'Suresh Reddy (Driver)',
    email: 'driver2@ambulance.com',
    password: 'password123',
    phone: '+91 92345 67890',
    role: 'driver',
    assignedAmbulanceId: 'AMB-102'
  },
  {
    id: 'usr-4',
    name: 'Vikram Singh (Driver)',
    email: 'driver3@ambulance.com',
    password: 'password123',
    phone: '+91 93456 78901',
    role: 'driver',
    assignedAmbulanceId: 'AMB-103'
  },
  {
    id: 'usr-5',
    name: 'Dr. Ramesh Varma (Dispatcher Admin)',
    email: 'admin@hospital.com',
    password: 'password123',
    phone: '+91 94567 89012',
    role: 'admin'
  }
];

const ambulances = [
  {
    id: 'AMB-101',
    vehicleNumber: 'TS 09 EQ 1008',
    type: 'ALS', // Advanced Life Support
    typeName: 'Advanced Life Support (ALS)',
    status: 'AVAILABLE', // AVAILABLE, BUSY, OFFLINE
    driverId: 'usr-2',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 91234 56789',
    lat: 17.3850,
    lng: 78.4867,
    locationName: 'Abids Emergency Station',
    equipment: ['Ventilator', 'Defibrillator', 'Oxygen Cylinder', 'ECG Monitor', 'Emergency Drugs'],
    basePrice: 1500,
    perKmPrice: 35
  },
  {
    id: 'AMB-102',
    vehicleNumber: 'TS 07 EA 4020',
    type: 'BLS', // Basic Life Support
    typeName: 'Basic Life Support (BLS)',
    status: 'AVAILABLE',
    driverId: 'usr-3',
    driverName: 'Suresh Reddy',
    driverPhone: '+91 92345 67890',
    lat: 17.4319,
    lng: 78.4071,
    locationName: 'Jubilee Hills Care Unit',
    equipment: ['Stretcher', 'Oxygen Mask', 'First Aid Kit', 'Suction Machine'],
    basePrice: 800,
    perKmPrice: 25
  },
  {
    id: 'AMB-103',
    vehicleNumber: 'TS 08 ICU 9900',
    type: 'ICU', // Cardiac / ICU Mobile
    typeName: 'ICU Mobile Unit',
    status: 'BUSY',
    driverId: 'usr-4',
    driverName: 'Vikram Singh',
    driverPhone: '+91 93456 78901',
    lat: 17.4399,
    lng: 78.4983,
    locationName: 'Secunderabad Express Bay',
    equipment: ['Portable ICU Bed', 'Advanced Ventilator', 'Multi-para Monitor', 'Infusion Pump'],
    basePrice: 3000,
    perKmPrice: 50
  },
  {
    id: 'AMB-104',
    vehicleNumber: 'TS 10 PED 2211',
    type: 'PEDIATRIC',
    typeName: 'Pediatric & Neonatal Transport',
    status: 'AVAILABLE',
    driverId: null,
    driverName: 'Priya Sharma',
    driverPhone: '+91 95678 12345',
    lat: 17.4401,
    lng: 78.3489,
    locationName: 'Gachibowli Medical Center',
    equipment: ['Infant Incubator', 'Pediatric Respirator', 'Warmers', 'Emergency Resuscitator'],
    basePrice: 2000,
    perKmPrice: 40
  }
];

const hospitals = [
  {
    id: 'hosp-1',
    name: 'Apollo Emergency & Trauma Hospital',
    address: 'Jubilee Hills, Hyderabad',
    lat: 17.4256,
    lng: 78.4116,
    icuBeds: 12,
    emergencyPhone: '1066 / +91 40 2360 7777'
  },
  {
    id: 'hosp-2',
    name: 'Yashoda Super Specialty Hospital',
    address: 'Somajiguda, Hyderabad',
    lat: 17.4251,
    lng: 78.4582,
    icuBeds: 8,
    emergencyPhone: '+91 40 4567 4567'
  },
  {
    id: 'hosp-3',
    name: 'Care Hospitals Emergency Center',
    address: 'Banjara Hills, Hyderabad',
    lat: 17.4115,
    lng: 78.4485,
    icuBeds: 15,
    emergencyPhone: '+91 40 6165 6565'
  },
  {
    id: 'hosp-4',
    name: 'KIMS Multi-Specialty Hospital',
    address: 'Secunderabad, Hyderabad',
    lat: 17.4361,
    lng: 78.4820,
    icuBeds: 20,
    emergencyPhone: '+91 40 4488 5000'
  }
];

let bookings = [
  {
    id: 'BK-9901',
    patientId: 'usr-1',
    patientName: 'Ananya Rao',
    patientPhone: '+91 98765 43210',
    emergencyType: 'Chest Pain / Cardiac Alert',
    severity: 'CRITICAL', // CRITICAL, HIGH, MODERATE
    ambulanceId: 'AMB-103',
    ambulanceType: 'ICU',
    driverId: 'usr-4',
    driverName: 'Vikram Singh',
    driverPhone: '+91 93456 78901',
    vehicleNumber: 'TS 08 ICU 9900',
    pickup: {
      address: 'Madhapur Metro Station, Hyderabad',
      lat: 17.4483,
      lng: 78.3915
    },
    destination: {
      name: 'Apollo Emergency & Trauma Hospital',
      address: 'Jubilee Hills, Hyderabad',
      lat: 17.4256,
      lng: 78.4116
    },
    currentLocation: {
      lat: 17.4420,
      lng: 78.4000
    },
    status: 'EN_ROUTE_TO_PICKUP', // SEARCHING, ACCEPTED, EN_ROUTE_TO_PICKUP, PATIENT_PICKED_UP, COMPLETED, CANCELLED
    etaMinutes: 6,
    distanceKm: 4.2,
    fare: 3200,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    logs: [
      { status: 'SEARCHING', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), note: 'Emergency SOS Triggered' },
      { status: 'ACCEPTED', timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(), note: 'Driver Vikram Singh Accepted Request' },
      { status: 'EN_ROUTE_TO_PICKUP', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), note: 'Ambulance en route to patient location' }
    ]
  },
  {
    id: 'BK-9888',
    patientId: 'usr-1',
    patientName: 'Ananya Rao',
    patientPhone: '+91 98765 43210',
    emergencyType: 'Accident & Trauma',
    severity: 'HIGH',
    ambulanceId: 'AMB-101',
    ambulanceType: 'ALS',
    driverId: 'usr-2',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 91234 56789',
    vehicleNumber: 'TS 09 EQ 1008',
    pickup: {
      address: 'Hitech City Flyover, Hyderabad',
      lat: 17.4435,
      lng: 78.3772
    },
    destination: {
      name: 'Care Hospitals Emergency Center',
      address: 'Banjara Hills, Hyderabad',
      lat: 17.4115,
      lng: 78.4485
    },
    status: 'COMPLETED',
    etaMinutes: 0,
    distanceKm: 8.5,
    fare: 1800,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    logs: [
      { status: 'SEARCHING', timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), note: 'Request initiated' },
      { status: 'COMPLETED', timestamp: new Date(Date.now() - 23.5 * 3600 * 1000).toISOString(), note: 'Patient delivered to hospital' }
    ]
  }
];

module.exports = {
  users,
  ambulances,
  hospitals,
  bookings
};
