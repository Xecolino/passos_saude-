import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { Brain, Play, Pause } from 'lucide-react';

export default function MeditacaoScreen() {
  const { setCurrentScreen, meditationsList, completeMeditationSession } = useApp();

  const catalog = meditationsList && meditationsList.length > 0 ? meditationsList : [
    {
      id: '44444444-4444-4444-4444-444444444401',
      title: 'Respiração Consciente & Foco',
      duration: '5 minutos',
      durationSeconds: 300,
      instructor: 'Camila Duarte',
      coinsReward: 50
    }
  ];

  const [selectedMeditation, setSelectedMeditation] = useState(catalog[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(135); // 02:15 initial match
  const totalSeconds = selectedMeditation?.durationSeconds || 300;
  const [breathPhase, setBreathPhase] = useState('Inspire'); // 'Inspire', 'Segure', 'Expire'
  const [breathCount, setBreathCount] = useState(4);

  // Meditation timer simulation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSeconds(prev => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            completeMeditationSession(selectedMeditation, totalSeconds);
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSeconds, selectedMeditation, completeMeditationSession]);

  // Breathing 4-7-8 cycle animation
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setBreathCount(prev => {
          if (prev <= 1) {
            if (breathPhase === 'Inspire') {
              setBreathPhase('Segure');
              return 7;
            } else if (breathPhase === 'Segure') {
              setBreathPhase('Expire');
              return 8;
            } else {
              setBreathPhase('Inspire');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, breathPhase]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPct = Math.min(100, (currentSeconds / totalSeconds) * 100);

  return (
    <>
      <HeaderBar title="Meditação Guiada" showBack onBack={() => setCurrentScreen('home')} />

      <main className="screen-body">
        {/* Top Green Hero Card (public.meditacoes -> public.sessoes_meditacao) */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          borderRadius: '26px',
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -4px rgba(22, 163, 74, 0.4)',
          position: 'relative'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sessão do dia</span>
            </div>
            <span style={{
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(4px)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              🪙 +{selectedMeditation?.coinsReward || 50} Passos-Coins
            </span>
          </div>

          {/* Titles */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '16px', lineHeight: 1.25 }}>
            {selectedMeditation?.title || 'Respiração Consciente & Foco'}
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>
            {selectedMeditation?.duration || '5 minutos'} • Instrutor(a): {selectedMeditation?.instructor || 'Camila Duarte'}
          </p>

          {/* Interactive Player Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#ffffff',
                border: 'none',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.15s ease',
                flexShrink: 0
              }}
              aria-label={isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isPlaying ? (
                <Pause size={22} fill="#15803d" />
              ) : (
                <Play size={22} fill="#15803d" style={{ marginLeft: '3px' }} />
              )}
            </button>

            {/* Progress Bar & Timers */}
            <div style={{ flex: 1 }}>
              <div style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: '#ffffff',
                  borderRadius: '6px',
                  transition: 'width 0.25s linear'
                }} />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginTop: '6px',
                opacity: 0.95
              }}>
                <span>{formatTimer(currentSeconds)}</span>
                <span>{formatTimer(totalSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biblioteca de Meditações (public.meditacoes) */}
        {catalog.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {catalog.map((item) => {
              const active = selectedMeditation?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedMeditation(item);
                    setIsPlaying(false);
                    setCurrentSeconds(0);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '14px',
                    border: active ? '1.5px solid #15803d' : '1px solid #e2e8f0',
                    background: active ? '#f0fdf4' : '#ffffff',
                    color: active ? '#15803d' : '#334155',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.title} ({item.duration})
                </button>
              );
            })}
          </div>
        )}

        {/* Live Breathing Interactive Visualizer */}
        {isPlaying && (
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Ciclo de Respiração Ativo (Técnica 4-7-8)
            </div>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: breathPhase === 'Inspire' ? '#dcfce7' : breathPhase === 'Segure' ? '#fef3c7' : '#e0e7ff',
              border: `3px solid ${breathPhase === 'Inspire' ? '#16a34a' : breathPhase === 'Segure' ? '#d97706' : '#4f46e5'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '14px auto',
              transition: 'all 0.5s ease',
              transform: breathPhase === 'Inspire' ? 'scale(1.15)' : breathPhase === 'Segure' ? 'scale(1.1)' : 'scale(0.95)'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {breathCount}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>
                {breathPhase}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>
              Relaxe a mandíbula e solte os ombros enquanto respira ritmicamente.
            </p>
          </div>
        )}

        {/* Guide Card */}
        <div className="app-card" style={{ padding: '22px 18px' }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
            Guia: Como Meditar no Trabalho
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', marginBottom: '18px' }}>
            Passo a passo para praticar entre reuniões e tarefas.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                1
              </div>
              <div>
                <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Postura na cadeira
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Sente-se com os pés apoiados no chão, coluna reta e ombros relaxados. Apoie as mãos sobre as pernas e feche os olhos, se sentir-se à vontade.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                2
              </div>
              <div>
                <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Técnica 4-7-8 de respiração
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Inspire pelo nariz contando até 4, segure o ar por 7 segundos e expire lentamente pela boca contando até 8. Repita por 4 ciclos.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                3
              </div>
              <div>
                <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  Foco no presente
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Direcione a atenção para a sensação do ar entrando e saindo. Ao notar distrações, reconheça-as e retorne suavemente à respiração.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
