import React from 'react';
import { Clock, CheckCircle2, Navigation, AlertTriangle, Hospital } from 'lucide-react';

const STEPS = [
  { status: 'SEARCHING', label: 'Request Initiated' },
  { status: 'ACCEPTED', label: 'Driver Assigned' },
  { status: 'EN_ROUTE_TO_PICKUP', label: 'En Route to Pickup' },
  { status: 'PATIENT_PICKED_UP', label: 'Patient Onboard' },
  { status: 'COMPLETED', label: 'Hospital Arrival' }
];

export default function TripTimeline({ booking }) {
  if (!booking) return null;

  const currentStatus = booking.status;
  const currentStepIndex = STEPS.findIndex(s => s.status === currentStatus);

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--secondary-blue)" />
          Trip Progress & Live Status
        </h4>
        <span className={`badge ${currentStatus === 'COMPLETED' ? 'badge-available' : 'badge-enroute'}`}>
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Step Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', margin: '24px 0' }}>
        {/* Background line */}
        <div style={{ position: 'absolute', top: '14px', left: '10%', right: '10%', height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>

        {STEPS.map((step, idx) => {
          const isDone = currentStepIndex >= idx;
          const isCurrent = currentStepIndex === idx;

          return (
            <div key={step.status} style={{ position: 'relative', zIndex: 2, textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: isDone ? (isCurrent ? 'var(--primary-red)' : 'var(--secondary-blue)') : '#1e293b',
                color: isDone ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                boxShadow: isCurrent ? '0 0 16px var(--primary-red-glow)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <div style={{ fontSize: '0.7rem', color: isDone ? '#fff' : 'var(--text-muted)', fontWeight: isCurrent ? '700' : '400' }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Entries */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', maxHeight: '160px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>STATUS LOGS</div>
        {booking.logs && booking.logs.map((log, i) => (
          <div key={i} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: '#cbd5e1' }}>
            <span style={{ color: 'var(--secondary-blue)', fontSize: '0.7rem' }}>
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span>•</span>
            <span>{log.note || log.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
