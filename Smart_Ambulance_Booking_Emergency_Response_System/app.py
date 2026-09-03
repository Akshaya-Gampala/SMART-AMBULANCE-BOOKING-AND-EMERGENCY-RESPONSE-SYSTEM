import os
import math
import random
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='client/dist', static_url_path='')
CORS(app)

# In-Memory Seed Data matching the PRD/TRD specs
users = [
    {
        "id": "usr-1",
        "name": "Ananya Rao",
        "email": "patient@emergency.com",
        "password": "password123",
        "phone": "+91 98765 43210",
        "role": "patient",
        "emergencyContact": "+91 98765 99999 (Brother)"
    },
    {
        "id": "usr-2",
        "name": "Rajesh Kumar (Driver)",
        "email": "driver1@ambulance.com",
        "password": "password123",
        "phone": "+91 91234 56789",
        "role": "driver",
        "assignedAmbulanceId": "AMB-101"
    },
    {
        "id": "usr-3",
        "name": "Suresh Reddy (Driver)",
        "email": "driver2@ambulance.com",
        "password": "password123",
        "phone": "+91 92345 67890",
        "role": "driver",
        "assignedAmbulanceId": "AMB-102"
    },
    {
        "id": "usr-4",
        "name": "Vikram Singh (Driver)",
        "email": "driver3@ambulance.com",
        "password": "password123",
        "phone": "+91 93456 78901",
        "role": "driver",
        "assignedAmbulanceId": "AMB-103"
    },
    {
        "id": "usr-5",
        "name": "Dr. Ramesh Varma (Dispatcher Admin)",
        "email": "admin@hospital.com",
        "password": "password123",
        "phone": "+91 94567 89012",
        "role": "admin"
    }
]

ambulances = [
    {
        "id": "AMB-101",
        "vehicleNumber": "TS 09 EQ 1008",
        "type": "ALS",
        "typeName": "Advanced Life Support (ALS)",
        "status": "AVAILABLE",
        "driverId": "usr-2",
        "driverName": "Rajesh Kumar",
        "driverPhone": "+91 91234 56789",
        "lat": 17.3850,
        "lng": 78.4867,
        "locationName": "Abids Emergency Station",
        "equipment": ["Ventilator", "Defibrillator", "Oxygen Cylinder", "ECG Monitor"],
        "basePrice": 1500,
        "perKmPrice": 35
    },
    {
        "id": "AMB-102",
        "vehicleNumber": "TS 07 EA 4020",
        "type": "BLS",
        "typeName": "Basic Life Support (BLS)",
        "status": "AVAILABLE",
        "driverId": "usr-3",
        "driverName": "Suresh Reddy",
        "driverPhone": "+91 92345 67890",
        "lat": 17.4319,
        "lng": 78.4071,
        "locationName": "Jubilee Hills Care Unit",
        "equipment": ["Stretcher", "Oxygen Mask", "First Aid Kit"],
        "basePrice": 800,
        "perKmPrice": 25
    },
    {
        "id": "AMB-103",
        "vehicleNumber": "TS 08 ICU 9900",
        "type": "ICU",
        "typeName": "ICU Mobile Unit",
        "status": "BUSY",
        "driverId": "usr-4",
        "driverName": "Vikram Singh",
        "driverPhone": "+91 93456 78901",
        "lat": 17.4399,
        "lng": 78.4983,
        "locationName": "Secunderabad Express Bay",
        "equipment": ["Portable ICU Bed", "Advanced Ventilator", "Multi-para Monitor"],
        "basePrice": 3000,
        "perKmPrice": 50
    },
    {
        "id": "AMB-104",
        "vehicleNumber": "TS 10 PED 2211",
        "type": "PEDIATRIC",
        "typeName": "Pediatric & Neonatal Transport",
        "status": "AVAILABLE",
        "driverId": None,
        "driverName": "Priya Sharma",
        "driverPhone": "+91 95678 12345",
        "lat": 17.4401,
        "lng": 78.3489,
        "locationName": "Gachibowli Medical Center",
        "equipment": ["Infant Incubator", "Pediatric Respirator"],
        "basePrice": 2000,
        "perKmPrice": 40
    }
]

hospitals = [
    {
        "id": "hosp-1",
        "name": "Apollo Emergency & Trauma Hospital",
        "address": "Jubilee Hills, Hyderabad",
        "lat": 17.4256,
        "lng": 78.4116,
        "icuBeds": 12,
        "emergencyPhone": "1066 / +91 40 2360 7777"
    },
    {
        "id": "hosp-2",
        "name": "Yashoda Super Specialty Hospital",
        "address": "Somajiguda, Hyderabad",
        "lat": 17.4251,
        "lng": 78.4582,
        "icuBeds": 8,
        "emergencyPhone": "+91 40 4567 4567"
    },
    {
        "id": "hosp-3",
        "name": "Care Hospitals Emergency Center",
        "address": "Banjara Hills, Hyderabad",
        "lat": 17.4115,
        "lng": 78.4485,
        "icuBeds": 15,
        "emergencyPhone": "+91 40 6165 6565"
    },
    {
        "id": "hosp-4",
        "name": "KIMS Multi-Specialty Hospital",
        "address": "Secunderabad, Hyderabad",
        "lat": 17.4361,
        "lng": 78.4820,
        "icuBeds": 20,
        "emergencyPhone": "+91 40 4488 5000"
    }
]

bookings = [
    {
        "id": "BK-9901",
        "patientId": "usr-1",
        "patientName": "Ananya Rao",
        "patientPhone": "+91 98765 43210",
        "emergencyType": "Chest Pain / Cardiac Alert",
        "severity": "CRITICAL",
        "ambulanceId": "AMB-103",
        "ambulanceType": "ICU",
        "driverId": "usr-4",
        "driverName": "Vikram Singh",
        "driverPhone": "+91 93456 78901",
        "vehicleNumber": "TS 08 ICU 9900",
        "pickup": {
            "address": "Madhapur Metro Station, Hyderabad",
            "lat": 17.4483,
            "lng": 78.3915
        },
        "destination": {
            "name": "Apollo Emergency & Trauma Hospital",
            "address": "Jubilee Hills, Hyderabad",
            "lat": 17.4256,
            "lng": 78.4116
        },
        "currentLocation": {
            "lat": 17.4420,
            "lng": 78.4000
        },
        "status": "EN_ROUTE_TO_PICKUP",
        "etaMinutes": 6,
        "distanceKm": 4.2,
        "fare": 3200,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "logs": [
            {"status": "SEARCHING", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Emergency SOS Triggered"},
            {"status": "ACCEPTED", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Driver Vikram Singh Accepted Request"},
            {"status": "EN_ROUTE_TO_PICKUP", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Ambulance en route to patient location"}
        ]
    }
]

# Health check
@app.route('/api/health')
def health():
    return jsonify({
        "status": "OK",
        "system": "Smart Ambulance Booking API (Python Flask)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# Auth Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').lower()
    password = data.get('password')
    role = data.get('role')

    user = next((u for u in users if u['email'].lower() == email), None)
    if not user or user['password'] != password:
        return jsonify({"error": "Invalid email or password"}), 401

    if role and user['role'] != role:
        return jsonify({"error": f"Account exists but role is '{user['role']}'"}), 403

    assigned = None
    if user['role'] == 'driver':
        assigned = next((a for a in ambulances if a.get('driverId') == user['id']), None)

    user_info = {**user, "assignedAmbulance": assigned}

    return jsonify({
        "token": f"mock-token-{user['id']}",
        "user": user_info
    })

@app.route('/api/auth/me', methods=['GET'])
def me():
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    
    user = users[0] # Default fallback patient
    if 'usr-2' in token: user = users[1]
    elif 'usr-3' in token: user = users[2]
    elif 'usr-4' in token: user = users[3]
    elif 'usr-5' in token: user = users[4]

    assigned = None
    if user['role'] == 'driver':
        assigned = next((a for a in ambulances if a.get('driverId') == user['id']), None)

    return jsonify({
        "user": {**user, "assignedAmbulance": assigned}
    })

# Ambulances & Hospitals Routes
@app.route('/api/ambulances', methods=['GET'])
def get_ambulances():
    amb_type = request.args.get('type')
    status = request.args.get('status')
    res = ambulances
    if amb_type:
        res = [a for a in res if a['type'].upper() == amb_type.upper()]
    if status:
        res = [a for a in res if a['status'].upper() == status.upper()]
    return jsonify(res)

@app.route('/api/ambulances/hospitals', methods=['GET'])
def get_hospitals():
    return jsonify(hospitals)

@app.route('/api/ambulances', methods=['POST'])
def add_ambulance():
    data = request.json or {}
    new_amb = {
        "id": f"AMB-{random.randint(100, 999)}",
        "vehicleNumber": data.get('vehicleNumber', 'TS 09 NEW 0000'),
        "type": data.get('type', 'ALS').upper(),
        "typeName": f"{data.get('type', 'ALS').upper()} Unit",
        "status": "AVAILABLE",
        "driverId": None,
        "driverName": data.get('driverName', 'Unassigned Driver'),
        "driverPhone": data.get('driverPhone', '+91 90000 00000'),
        "lat": 17.4380,
        "lng": 78.4200,
        "locationName": data.get('locationName', 'Central Base'),
        "equipment": ["Ventilator", "Oxygen Cylinder", "Stretcher"],
        "basePrice": data.get('basePrice', 1500),
        "perKmPrice": 35
    }
    ambulances.append(new_amb)
    return jsonify(new_amb), 201

@app.route('/api/ambulances/<amb_id>/status', methods=['PUT'])
def update_ambulance_status(amb_id):
    data = request.json or {}
    amb = next((a for a in ambulances if a['id'] == amb_id), None)
    if not amb:
        return jsonify({"error": "Ambulance not found"}), 404
    amb['status'] = data.get('status', amb['status'])
    return jsonify(amb)

# Booking Routes
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    patient_id = request.args.get('patientId')
    driver_id = request.args.get('driverId')
    res = bookings
    if patient_id:
        res = [b for b in res if b.get('patientId') == patient_id]
    if driver_id:
        res = [b for b in res if b.get('driverId') == driver_id]
    return jsonify(res)

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.json or {}
    pickup = data.get('pickup') or {}
    dest = data.get('destination') or hospitals[0]
    is_sos = data.get('isSOS', False)
    amb_type = data.get('ambulanceType')

    available = next((a for a in ambulances if a['status'] == 'AVAILABLE' and (a['type'] == amb_type if amb_type else True)), None)
    if not available:
        available = next((a for a in ambulances if a['status'] == 'AVAILABLE'), None)

    pickup_lat = pickup.get('lat', 17.4450)
    pickup_lng = pickup.get('lng', 78.3880)

    new_booking = {
        "id": f"BK-{random.randint(1000, 9999)}",
        "patientId": data.get('patientId', 'usr-1'),
        "patientName": data.get('patientName', 'Emergency Patient'),
        "patientPhone": data.get('patientPhone', '+91 98765 43210'),
        "emergencyType": data.get('emergencyType', 'CRITICAL SOS EMERGENCY' if is_sos else 'Medical Emergency'),
        "severity": data.get('severity', 'CRITICAL' if is_sos else 'HIGH'),
        "ambulanceId": available['id'] if available else None,
        "ambulanceType": available['type'] if available else 'ALS',
        "driverId": available['driverId'] if available else None,
        "driverName": available['driverName'] if available else 'Unassigned Driver',
        "driverPhone": available['driverPhone'] if available else '+91 90000 00000',
        "vehicleNumber": available['vehicleNumber'] if available else 'TS 09 EQ 1008',
        "pickup": {
            "address": pickup.get('address', 'Current Location'),
            "lat": pickup_lat,
            "lng": pickup_lng
        },
        "destination": dest,
        "currentLocation": {"lat": available['lat'], "lng": available['lng']} if available else {"lat": pickup_lat, "lng": pickup_lng},
        "status": "ACCEPTED" if available else "SEARCHING",
        "etaMinutes": 5,
        "distanceKm": 4.5,
        "fare": 1800,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "logs": [
            {"status": "SEARCHING", "timestamp": datetime.now(timezone.utc).isoformat(), "note": "Request Initiated"}
        ]
    }

    if available:
        available['status'] = 'BUSY'
        new_booking['logs'].append({
            "status": "ACCEPTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": f"Auto-assigned to Driver {available['driverName']}"
        })

    bookings.insert(0, new_booking)
    return jsonify(new_booking), 201

@app.route('/api/bookings/<booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    data = request.json or {}
    booking = next((b for b in bookings if b['id'] == booking_id), None)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    status = data.get('status')
    booking['status'] = status
    booking['logs'].append({
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": data.get('note', f"Status updated to {status}")
    })

    if status in ['COMPLETED', 'CANCELLED']:
        amb = next((a for a in ambulances if a['id'] == booking.get('ambulanceId')), None)
        if amb:
            amb['status'] = 'AVAILABLE'

    return jsonify(booking)

# Admin Analytics
@app.route('/api/admin/analytics', methods=['GET'])
def admin_analytics():
    active = len([b for b in bookings if b['status'] not in ['COMPLETED', 'CANCELLED']])
    avail = len([a for a in ambulances if a['status'] == 'AVAILABLE'])
    return jsonify({
        "totalBookings": len(bookings),
        "activeEmergencies": active,
        "totalAmbulances": len(ambulances),
        "availableAmbulances": avail,
        "busyAmbulances": len(ambulances) - avail,
        "avgResponseTime": "5.4 mins",
        "totalHospitals": len(hospitals)
    })

# Serve Static React Client
@app.route('/')
def serve_index():
    if os.path.exists('client/dist/index.html'):
        return send_from_directory('client/dist', 'index.html')
    return """
    <html>
        <head><title>Smart Ambulance Booking API</title></head>
        <body style="font-family: sans-serif; background: #090d16; color: #fff; text-align: center; padding: 50px;">
            <h1 style="color: #ff2a4b;">[RESCUE-API] Smart Ambulance Python Flask Server</h1>
            <p style="color: #00d2ff;">Server is active and listening on port 5000!</p>
            <p>API Health Endpoint: <a style="color: #00e676;" href="/api/health">/api/health</a></p>
            <p>Frontend Application: <a style="color: #00d2ff;" href="http://localhost:3000">http://localhost:3000</a></p>
        </body>
    </html>
    """

if __name__ == '__main__':
    print("[RESCUE-API] Smart Ambulance Python Flask Server starting on http://localhost:5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
