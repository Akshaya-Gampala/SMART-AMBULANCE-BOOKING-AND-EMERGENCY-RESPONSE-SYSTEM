import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Ambulance, ShieldAlert, User, LogOut, Radio, Activity, Navigation } from 'lucide-react';
import { playEmergencySiren } from '../utils/sound';

export default function Navbar({ onTriggerSOS }) {
  const { user, logout, switchDemoRole } = useContext(AuthContext);
  const { connected } = useContext(SocketContext);

  const handleSOSClick = () => {
    playEmergencySiren();
    if (onTriggerSOS) onTriggerSOS();
  };

  return (
    <header className="glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ff2a4b, #d50000)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(255, 42, 75, 0.4)' }}>
            <Ambulance size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              SMART RESCUE <span style={{ color: '#00d2ff', fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(0,210,255,0.15)', borderRadius: '12px', border: '1px solid rgba(0,210,255,0.3)' }}>v2.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Emergency Ambulance & Dispatch System</div>
          </div>
        </div>

        {/* Real-time Status & Quick Role Switcher Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Socket Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#00e676' : '#ff2a4b', boxShadow: connected ? '0 0 8px #00e676' : '0 0 8px #ff2a4b' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{connected ? 'LIVE RADAR CONNECTED' : 'OFFLINE'}</span>
          </div>

          {/* Role Quick Switcher Pills */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <button 
                onClick={() => switchDemoRole('patient')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  background: user.role === 'patient' ? 'var(--secondary-blue)' : 'transparent',
                  color: user.role === 'patient' ? '#000000' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}>
                Patient Portal
              </button>
              <button 
                onClick={() => switchDemoRole('driver')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  background: user.role === 'driver' ? '#ff9100' : 'transparent',
                  color: user.role === 'driver' ? '#000000' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}>
                Driver Console
              </button>
              <button 
                onClick={() => switchDemoRole('admin')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  background: user.role === 'admin' ? 'var(--primary-red)' : 'transparent',
                  color: user.role === 'admin' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}>
                Admin Command
              </button>
            </div>
          )}
        </div>

        {/* User Profile & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick SOS Button */}
            {user.role === 'patient' && (
              <button className="sos-pulse-btn" onClick={handleSOSClick} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <ShieldAlert size={18} />
                EMERGENCY SOS
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px' }}>
              <User size={16} color="var(--secondary-blue)" />
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '600', color: '#fff' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role} Account</div>
              </div>
            </div>

            <button onClick={logout} className="btn-secondary" style={{ padding: '8px 12px' }} title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sign in to access emergency rescue console
          </div>
        )}
      </div>
    </header>
  );
}
