import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import RouteMapCanvas from '../components/RouteMapCanvas';
import { useWorkoutTracker } from '../hooks/useWorkoutTracker';
import { formatStopwatchTime } from '../utils/geo';
import {
  Play,
  Pause,
  Square,
  MapPin,
  Flame,
  Timer,
  Activity,
  Footprints,
  History,
  Trash2,
  Settings2,
  Compass,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  X
} from 'lucide-react';

export default function CaminhadaOrientadaScreen() {
  const { user, addSteps, showToast, setCurrentScreen, updateProfile } = useApp();

  const [activeTab, setActiveTab] = useState('rastreador'); // 'rastreador', 'historico', 'sensores'
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.stepsGoal || 10000);

  // Hook workout tracker with accelerometer + GPS
  const {
    isTracking,
    isPaused,
    formattedTime,
    workoutSteps,
    distanceKm,
    currentPace,
    currentSpeed,
    cadenceSpm,
    currentCalories,
    routePoints,
    currentLocation,
    sensorPermission,
    gpsStatus,
    sensitivity,
    setSensitivity,
    isSimulatedGps,
    sessionsHistory,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    finishWorkout,
    deleteSession,
    clearAllSessions,
    requestMotionPermission
  } = useWorkoutTracker({
    onStepsCounted: (count) => {
      addSteps(count);
    },
    userWeightKg: 70
  });

  const dailyPercentage = Math.min(100, Math.round((user.stepsToday / user.stepsGoal) * 100));

  const handleStart = () => {
    startWorkout();
    showToast('Caminhada iniciada! Acelerômetro e GPS registrando passos reais.');
  };

  const handleFinishWorkout = () => {
    const session = finishWorkout();
    showToast(`Sessão salva no histórico! +${session.steps} passos e ${session.distanceKm} km registrados.`);
    setActiveTab('historico');
  };

  const handleSaveGoal = (e) => {
    e.preventDefault();
    updateProfile({ stepsGoal: Number(tempGoal) });
    setIsGoalModalOpen(false);
    showToast(`Meta diária atualizada para ${Number(tempGoal).toLocaleString('pt-BR')} passos!`);
  };

  return (
    <>
      <HeaderBar title="Caminhada & GPS" showBack onBack={() => setCurrentScreen('home')} />

      <main className="screen-body">
        {/* Navigation Tabs (Rastreador, Histórico, Sensores) */}
        <div style={{
          display: 'flex',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            onClick={() => setActiveTab('rastreador')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'rastreador' ? '#15803d' : 'transparent',
              color: activeTab === 'rastreador' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Activity size={15} />
            <span>Treino Ativo</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'historico' ? '#15803d' : 'transparent',
              color: activeTab === 'historico' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <History size={15} />
            <span>Histórico ({sessionsHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sensores')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'sensores' ? '#15803d' : 'transparent',
              color: activeTab === 'sensores' ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Settings2 size={15} />
            <span>Sensores</span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: RASTREADOR ATIVO (GPS, MAPA, CRONÔMETRO, MÉTRICAS)
           ======================================================== */}
        {activeTab === 'rastreador' && (
          <>
            {/* Meta Diária Card com Barra de Progresso Configurável */}
            <div className="app-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Meta Diária de Passos
                  </span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {user.stepsToday.toLocaleString('pt-BR')} / {user.stepsGoal.toLocaleString('pt-BR')}
                  </div>
                </div>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Configurar Meta
                </button>
              </div>

              {/* Barra de Progresso Linear */}
              <div style={{
                height: '8px',
                background: '#f1f5f9',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${dailyPercentage}%`,
                  background: 'linear-gradient(90deg, #22c55e, #15803d)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                <span>{dailyPercentage}% da meta atingida</span>
                <span>Faltam {Math.max(0, user.stepsGoal - user.stepsToday).toLocaleString('pt-BR')} passos</span>
              </div>
            </div>

            {/* GPS Live Route Map Canvas */}
            <div style={{ position: 'relative' }}>
              <RouteMapCanvas
                routePoints={routePoints}
                isTracking={isTracking}
                height={220}
                currentLocation={currentLocation}
              />

              {/* Status Pills Overlay on Canvas */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '6px'
              }}>
                <span style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(4px)',
                  color: gpsStatus === 'active' ? '#4ade80' : '#f59e0b',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={11} />
                  <span>{gpsStatus === 'active' ? 'GPS Conectado' : 'Buscando GPS'}</span>
                </span>
              </div>
            </div>

            {/* Big Stopwatch Display */}
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '16px 20px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tempo Decorrido
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: 'monospace',
                letterSpacing: '-1px',
                marginTop: '2px'
              }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: '0.75rem', color: isTracking ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                {isTracking ? (isPaused ? '⏸ Sessão Pausada' : '● Gravando Trajeto e Passos') : '○ Pronto para iniciar'}
              </div>
            </div>

            {/* 6 Automated Workout Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}>
              {/* Passos */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#15803d' }}>
                  <Footprints size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Passos</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {workoutSteps.toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 700 }}>Acelerômetro</div>
              </div>

              {/* Distância */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#2563eb' }}>
                  <MapPin size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Distância</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {distanceKm} km
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>GPS Satélite</div>
              </div>

              {/* Calorias */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#ea580c' }}>
                  <Flame size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Calorias</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {currentCalories} kcal
                </div>
                <div style={{ fontSize: '0.65rem', color: '#ea580c', fontWeight: 600 }}>Gasto Ativo</div>
              </div>

              {/* Ritmo Médio (Pace) */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8b5cf6' }}>
                  <Timer size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Ritmo</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {currentPace}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>min/km</div>
              </div>

              {/* Velocidade Média */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#059669' }}>
                  <Gauge size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Velocidade</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {currentSpeed}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>km/h média</div>
              </div>

              {/* Cadência */}
              <div className="app-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#d97706' }}>
                  <Zap size={14} />
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Cadência</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {cadenceSpm}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>passos/min</div>
              </div>
            </div>

            {/* Bottom Workout Action Controls */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {!isTracking ? (
                <button
                  onClick={handleStart}
                  className="btn-primary btn-full"
                  style={{ padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }}
                >
                  <Play size={18} fill="#ffffff" />
                  <span>Iniciar Caminhada / Corrida</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeWorkout}
                      className="btn-primary"
                      style={{ flex: 1, padding: '14px', justifyContent: 'center' }}
                    >
                      <Play size={18} fill="#ffffff" />
                      <span>Retomar</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseWorkout}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '14px', justifyContent: 'center', background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}
                    >
                      <Pause size={18} />
                      <span>Pausar</span>
                    </button>
                  )}

                  <button
                    onClick={handleFinishWorkout}
                    className="btn-primary"
                    style={{ flex: 1, padding: '14px', justifyContent: 'center', background: '#dc2626' }}
                  >
                    <Square size={17} />
                    <span>Concluir e Salvar</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ========================================================
            TAB 2: HISTÓRICO DE SESSÕES (SALVO NO APARELHO / LOCALSTORAGE)
           ======================================================== */}
        {activeTab === 'historico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Histórico no Aparelho
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  {sessionsHistory.length} sessões gravadas localmente em memória segura.
                </p>
              </div>

              {sessionsHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja apagar todo o histórico de sessões do aparelho?')) {
                      clearAllSessions();
                      showToast('Histórico de treinos apagado com sucesso!');
                    }
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.74rem', color: '#dc2626', borderColor: '#fee2e2' }}
                >
                  <Trash2 size={13} />
                  <span>Limpar Tudo</span>
                </button>
              )}
            </div>

            {sessionsHistory.length === 0 ? (
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '36px 20px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <History size={28} />
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  Nenhum treino gravado ainda
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                  Inicie uma caminhada orientada para que seu trajeto e métricas fiquem salvos aqui.
                </p>
                <button
                  onClick={() => setActiveTab('rastreador')}
                  className="btn-primary"
                  style={{ marginTop: '16px', padding: '8px 18px', fontSize: '0.82rem' }}
                >
                  Iniciar Treino
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessionsHistory.map((sess) => (
                  <div
                    key={sess.id}
                    className="app-card"
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                          {sess.date}
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                          Caminhada de {formatStopwatchTime(sess.durationSeconds)}
                        </h4>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          +{sess.coinsEarned || 20} moedas
                        </span>
                        <button
                          onClick={() => {
                            deleteSession(sess.id);
                            showToast('Sessão apagada do histórico.');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Apagar esta sessão"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Miniature Map Preview */}
                    {sess.routePoints && sess.routePoints.length > 0 && (
                      <div
                        onClick={() => setSelectedSessionForModal(sess)}
                        style={{ cursor: 'pointer' }}
                        title="Clique para ver o mapa expandido"
                      >
                        <RouteMapCanvas routePoints={sess.routePoints} height={120} />
                      </div>
                    )}

                    {/* Stats Summary Line */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      background: '#f8fafc',
                      padding: '10px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      <div>
                        <div style={{ color: '#64748b' }}>Passos</div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{sess.steps.toLocaleString('pt-BR')}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Distância</div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{sess.distanceKm} km</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Ritmo</div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{sess.avgPace}</div>
                      </div>
                      <div>
                        <div style={{ color: '#64748b' }}>Calorias</div>
                        <div style={{ fontWeight: 800, color: '#ea580c' }}>{sess.caloriesKcal} kcal</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: SENSORES, ACELERÔMETRO & FILTRO ANTI-FALSO
           ======================================================== */}
        {activeTab === 'sensores' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="app-card" style={{ padding: '20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#15803d', marginBottom: '12px' }}>
                <Activity size={22} />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Sensor de Movimento & Acelerômetro
                </h3>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45, marginBottom: '16px' }}>
                O contador utiliza a API <code>DeviceMotionEvent</code> do navegador do celular combinada com um filtro passa-baixa e debounce de cadência para descartar vibrações, digitação ou toques acidentais.
              </p>

              {/* Status Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>Permissão de Movimento:</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sensorPermission === 'granted' ? '#15803d' : '#d97706' }}>
                    {sensorPermission === 'granted' ? 'Concedida' : sensorPermission === 'prompt' ? 'Aguardando Início' : 'Disponível'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>Filtro Rítmico Anti-Falso:</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                    Ativo (Buffer de 4 passos)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>Filtro Período Refratário:</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>
                    270ms mín. por passada
                  </span>
                </div>
              </div>

              {/* Calibração de Sensibilidade */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Sensibilidade do Sensor
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'alta', label: 'Alta (Bolso)' },
                    { id: 'normal', label: 'Normal (Padrão)' },
                    { id: 'baixa', label: 'Baixa (Na mão)' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSensitivity(s.id);
                        showToast(`Sensibilidade alterada para: ${s.label}`);
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: sensitivity === s.id ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                        background: sensitivity === s.id ? '#f0fdf4' : '#ffffff',
                        color: sensitivity === s.id ? '#15803d' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Solicitação de Permissão Manual */}
              <button
                onClick={async () => {
                  const res = await requestMotionPermission();
                  showToast(res ? 'Sensor ativado com sucesso!' : 'Aguardando permissão do dispositivo.');
                }}
                className="btn-secondary btn-full"
                style={{ fontSize: '0.82rem', padding: '10px' }}
              >
                Testar Permissão do Acelerômetro
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Configurar Meta Diária */}
      {isGoalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Configurar Meta Diária</h3>
              <button className="modal-close-btn" onClick={() => setIsGoalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal}>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
                Defina sua meta diária de passos. A recomendação da OMS e NR-1 é de 10.000 passos para combater o sedentarismo ocupacional.
              </p>

              <div className="form-group">
                <label className="form-label">Meta de Passos por Dia</label>
                <input
                  type="number"
                  className="form-input"
                  min="3000"
                  max="30000"
                  step="500"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[6000, 8000, 10000, 12000].map((quick) => (
                  <button
                    type="button"
                    key={quick}
                    onClick={() => setTempGoal(quick)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: Number(tempGoal) === quick ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                      background: Number(tempGoal) === quick ? '#f0fdf4' : '#f8fafc',
                      color: Number(tempGoal) === quick ? '#15803d' : '#0f172a',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {quick.toLocaleString('pt-BR')}
                  </button>
                ))}
              </div>

              <button type="submit" className="btn-primary btn-full" style={{ padding: '14px' }}>
                Salvar Nova Meta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Percurso Salvo */}
      {selectedSessionForModal && (
        <div className="modal-overlay" onClick={() => setSelectedSessionForModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalhes do Trajeto</h3>
              <button className="modal-close-btn" onClick={() => setSelectedSessionForModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedSessionForModal.date}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {selectedSessionForModal.distanceKm} km • {selectedSessionForModal.steps.toLocaleString('pt-BR')} passos
              </div>
            </div>

            <RouteMapCanvas routePoints={selectedSessionForModal.routePoints} height={200} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginTop: '16px',
              marginBottom: '20px'
            }}>
              <div className="app-card" style={{ padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Tempo</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {formatStopwatchTime(selectedSessionForModal.durationSeconds)}
                </div>
              </div>

              <div className="app-card" style={{ padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Ritmo Médio</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  {selectedSessionForModal.avgPace}
                </div>
              </div>

              <div className="app-card" style={{ padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Calorias</div>
                <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.95rem' }}>
                  {selectedSessionForModal.caloriesKcal} kcal
                </div>
              </div>
            </div>

            <button
              className="btn-primary btn-full"
              onClick={() => setSelectedSessionForModal(null)}
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
