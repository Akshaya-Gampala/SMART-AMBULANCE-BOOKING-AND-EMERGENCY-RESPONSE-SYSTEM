import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Ambulance, ShieldAlert, User, Lock, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, register } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('patient');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password, phone, role, emergencyContact });
      } else {
        await login(email, password, role);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole, demoEmail, demoPass) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, demoPass, demoRole);
    } catch (err) {
      setError(err.response?.data?.error || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #ff2a4b, #d50000)', padding: '16px', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 0 24px rgba(255, 42, 75, 0.4)' }}>
            <Ambulance size={36} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
            {isRegister ? 'Create System Account' : 'Smart Emergency Rescue'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isRegister ? 'Register as Patient, Driver, or Admin' : 'Sign in to access real-time ambulance dispatch'}
          </p>
        </div>

        {/* Quick Demo Persona Shortcuts */}
        {!isRegister && (
          <div style={{ marginBottom: '24px', background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.15)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--secondary-blue)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚡ Quick Demo Persona Access
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('patient', 'patient@emergency.com', 'password123')}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
              >
                👤 Patient Persona
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>patient@emergency.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('driver', 'driver1@ambulance.com', 'password123')}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
              >
                🚑 Driver (ALS Unit)
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>driver1@ambulance.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('driver', 'driver2@ambulance.com', 'password123')}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
              >
                🚑 Driver (BLS Unit)
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>driver2@ambulance.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'admin@hospital.com', 'password123')}
                style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}
              >
                🏥 Admin Controller
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>admin@hospital.com</div>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,42,75,0.15)', border: '1px solid rgba(255,42,75,0.3)', padding: '12px', borderRadius: '8px', color: '#ff2a4b', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ananya Rao"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Account Type</label>
            <select
              className="form-control"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="patient">Patient / Requester</option>
              <option value="driver">Ambulance Driver / Paramedic</option>
              <option value="admin">Hospital Administrator / Dispatcher</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', justifyContent: 'center', marginTop: '10px' }}
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Sign In to Console')}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: 'var(--secondary-blue)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign In' : 'Register Here'}
          </button>
        </div>

      </div>
    </div>
  );
}
