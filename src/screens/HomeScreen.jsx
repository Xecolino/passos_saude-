import React from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import {
  Footprints,
  Flame,
  Timer,
  Play,
  Brain,
  TrendingUp,
  MapPin,
  Zap,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

export default function HomeScreen() {
  const {
    user,
    setCurrentScreen,
    sensorPermissionStatus,
    requestPedometerPermission
  } = useApp();

  const percentage = Math.min(100, Math.round((user.stepsToday / user.stepsGoal) * 100));
  
  // SVG Ring calculation (radius = 48, circumference ~ 301.6)
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <>
      <HeaderBar />

      <main className="screen-body">
        {/* Card: Meta Diária de Passos */}
        <div className="app-card steps-goal-card">
          <div className="steps-card-top">
            <div>
              <div className="steps-meta-title">Meta diária</div>
              <h3 className="steps-title">Passos de hoje</h3>
            </div>
            <div className="coins-badge-pill">
              +{user.dailyCoinsToday} moedas hoje
            </div>
          </div>

          <div className="steps-circle-and-stats">
            {/* Circular Ring Gauge */}
            <div className="progress-ring-container">
              <svg className="progress-ring-svg" viewBox="0 0 110 110">
                <circle
                  className="progress-ring-bg"
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="transparent"
                />
                <circle
                  className="progress-ring-fill"
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>

              <div className="progress-ring-inner">
                <Footprints size={26} strokeWidth={2.2} />
              </div>
            </div>

            {/* Counts */}
            <div className="steps-count-details">
              <div className="steps-big-number">
                {user.stepsToday.toLocaleString('pt-BR')}
              </div>
              <div
                className="steps-sub-goal"
                onClick={() => setCurrentScreen('perfil')}
                style={{ cursor: 'pointer' }}
                title="Clique para configurar sua meta diária de passos"
              >
                de {user.stepsGoal.toLocaleString('pt-BR')} passos ✎
              </div>
              <div className="steps-pct-tag">
                <TrendingUp size={15} />
                <span>{percentage}% concluído</span>
              </div>
            </div>
          </div>

          {/* Linear Progress Bar for Daily Goal */}
          <div style={{ marginTop: '2px' }}>
            <div style={{
              height: '7px',
              background: '#f1f5f9',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: 'linear-gradient(90deg, #22c55e, #15803d)',
                borderRadius: '999px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Motion Sensor Status (Acelerômetro) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '14px',
            marginTop: '4px',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 8px rgba(22, 163, 74, 0.6)'
              }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>
                  Sensor de Movimento Ativo
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Acelerômetro computa passos reais em caminhada ou corrida
                </div>
              </div>
            </div>

            {sensorPermissionStatus === 'prompt' && (
              <button
                onClick={requestPedometerPermission}
                style={{
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ativar Sensor
              </button>
            )}
          </div>
        </div>

        {/* Card: Streak / Sequência de Dias */}
        <div className="streak-banner-card">
          <div className="streak-icon-bubble">
            🔥
          </div>
          <div className="streak-text-content">
            <h4>{user.streakDays} dias seguidos atingindo a meta!</h4>
            <p>Continue assim para ganhar bônus semanal de 200 PassoCoins.</p>
          </div>
        </div>

        {/* 4 Mini Métricas (Distância, Calorias, Tempo, Ritmo) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={15} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Distância</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {user.distanceKm} km
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Calorias</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {user.caloriesKcal} kcal
            </div>
          </div>
        </div>

        {/* Card: Caminhada Orientada */}
        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-icon-title">
              <div className="activity-icon-bubble">
                <Footprints size={20} strokeWidth={2.3} />
              </div>
              <div className="activity-title-group">
                <h4>Caminhada Orientada</h4>
                <p>Ganhe moedas por passos</p>
              </div>
            </div>
            <span className="activity-reward-badge">+12 moedas</span>
          </div>

          <div className="activity-action-bar">
            <div className="activity-timer-pill">
              <Timer size={18} color="#64748b" />
              <span>12:34</span>
            </div>
            <button
              className="btn-primary"
              onClick={() => setCurrentScreen('caminhada')}
              style={{ padding: '8px 18px', fontSize: '0.84rem' }}
            >
              <Play size={15} fill="#ffffff" />
              <span>Iniciar</span>
            </button>
          </div>
        </div>

        {/* Card: Meditação Guiada */}
        <div className="activity-card">
          <div className="activity-header">
            <div className="activity-icon-title">
              <div className="activity-icon-bubble" style={{ background: '#f0fdf4', color: '#15803d' }}>
                <Brain size={20} strokeWidth={2.3} />
              </div>
              <div className="activity-title-group">
                <h4>Meditação Guiada</h4>
                <p>5 min de descompressão</p>
              </div>
            </div>
            <span className="activity-reward-badge">+50 moedas</span>
          </div>

          <button
            onClick={() => setCurrentScreen('meditacao')}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#16a34a'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d' }}>
              <Play size={16} fill="#15803d" />
              <span>Abrir player e guia completo</span>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </button>
        </div>

        {/* Card de Alinhamento NR-1 & Saúde Mental */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '18px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
              Conformidade NR-1
            </div>
            <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              Termômetro de Bem-Estar Semanal
            </h5>
            <p style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
              Acompanhe seu nível de estresse e resgate apoio preventivo.
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('burnout')}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
          >
            Avaliar
          </button>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
