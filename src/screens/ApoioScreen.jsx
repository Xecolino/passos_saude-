import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { Search, Star, Calendar, Clock, CheckCircle2, HeartHandshake, X } from 'lucide-react';

export default function ApoioScreen() {
  const {
    healthProfessionals,
    scheduleAppointment,
    scheduledAppointments,
    activeSchedulingDoctor,
    setActiveSchedulingDoctor,
    isScheduleSuccessModalOpen,
    setIsScheduleSuccessModalOpen
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('24/10/2026');
  const [selectedTime, setSelectedTime] = useState('14:00');

  const filteredProfessionals = healthProfessionals.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenSchedule = (prof) => {
    setActiveSchedulingDoctor(prof);
    setSelectedTime(prof.availableTimes[0] || '14:00');
  };

  const handleConfirmSchedule = (e) => {
    e.preventDefault();
    if (activeSchedulingDoctor) {
      scheduleAppointment(activeSchedulingDoctor, selectedDate, selectedTime);
    }
  };

  return (
    <>
      <HeaderBar title="Apoio Psicológico" />

      <main className="screen-body">
        {/* Title Header */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Bem-estar mental
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            Apoio Psicológico & Saúde
          </h2>
        </div>

        {/* Search Bar */}
        <div className="input-with-icon">
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar psicólogos ou terapeutas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Scheduled upcoming appointments banner (if any) */}
        {scheduledAppointments.length > 0 && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '18px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} />
              <span>Sessão Confirmada</span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {scheduledAppointments[0].doctorName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              🗓 {scheduledAppointments[0].date} às {scheduledAppointments[0].time} • Online / Sigilo NR-1
            </div>
          </div>
        )}

        {/* Professionals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredProfessionals.map((prof) => (
            <div
              key={prof.id}
              className="app-card"
              style={{
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: `${prof.color}18`,
                  color: prof.color,
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {prof.initials}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {prof.name}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                    {prof.title} • {prof.crp}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginLeft: '4px' }}>
                      {prof.rating.toFixed(1)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: '#475569', marginTop: '6px', lineHeight: 1.3 }}>
                    {prof.specialty}
                  </p>
                </div>
              </div>

              <button
                className="btn-primary btn-full"
                onClick={() => handleOpenSchedule(prof)}
                style={{ padding: '10px', fontSize: '0.85rem' }}
              >
                Agendar Consulta
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Schedule Selection Modal (tela12_Apoio_agendado.png) */}
      {activeSchedulingDoctor && (
        <div className="modal-overlay" onClick={() => setActiveSchedulingDoctor(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Selecionar Data e Horário</h3>
              <button
                className="modal-close-btn"
                onClick={() => setActiveSchedulingDoctor(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Profissional:</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeSchedulingDoctor.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                  {activeSchedulingDoctor.title}
                </div>
              </div>

              {/* Data Input */}
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>

              {/* Horários Chips */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label className="form-label">Horário disponível</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  {activeSchedulingDoctor.availableTimes.map((t) => {
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                          background: isSelected ? '#15803d' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary btn-full"
                style={{ padding: '14px', fontSize: '0.92rem' }}
              >
                Confirmar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
