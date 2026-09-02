import React from 'react';
import { ShieldCheck, HeartPulse, Clock, Navigation, CheckCircle2 } from 'lucide-react';

export default function AmbulanceCard({ ambulance, selected, onSelect, distanceKm = 4.2 }) {
  const isAvailable = ambulance.status === 'AVAILABLE';

  return (
    <div
      className="glass-card"
      onClick={() => isAvailable && onSelect(ambulance)}
      style={{
        padding: '16px',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.6,
        border: selected ? '2px solid var(--secondary-blue)' : '1px solid var(--border-light)',
        boxShadow: selected ? '0 0 20px var(--secondary-blue-glow)' : 'none',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚑 {ambulance.typeName || ambulance.type}
            {selected && <CheckCircle2 size={18} color="var(--secondary-blue)" />}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Vehicle: <span style={{ color: '#fff' }}>{ambulance.vehicleNumber}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--secondary-blue)' }}>
            ₹{ambulance.basePrice}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+ ₹{ambulance.perKmPrice}/km</div>
        </div>
      </div>

      {/* Equipment Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {ambulance.equipment && ambulance.equipment.map((eq, i) => (
          <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
            ✓ {eq}
          </span>
        ))}
      </div>

      {/* Driver & Proximity Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#00e676" />
          <span>Driver: <strong style={{ color: '#fff' }}>{ambulance.driverName}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary-blue)' }}>
          <Clock size={14} />
          <span>~{Math.max(3, Math.round(distanceKm * 1.5))} mins away</span>
        </div>
      </div>
    </div>
  );
}
