import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { meditationSessions as blocoASessions } from '../data/mockData';
import { Brain, Play, Pause, RotateCcw, Volume2, VolumeX, Headphones, CheckCircle2 } from 'lucide-react';

export default function MeditacaoScreen() {
  const { setCurrentScreen, meditationsList, completeMeditationSession } = useApp();
  const audioRef = useRef(null);

  // Garante que os 4 áudios do Bloco A (A1, A2, A3, A4) estejam sempre disponíveis e conectados aos arquivos .mp3 reais
  const catalog = useMemo(() => {
    return blocoASessions.map((localTrack, index) => {
      const dbMatch = (meditationsList || []).find(
        (m) => m.id === localTrack.id || m.audioTone === localTrack.fileName
      ) || (meditationsList || [])[index];

      return {
        ...localTrack,
        id: dbMatch?.id || localTrack.id,
        coinsReward: dbMatch?.coinsReward || localTrack.coinsReward || 50
      };
    });
  }, [meditationsList]);

  const [selectedMeditation, setSelectedMeditation] = useState(catalog[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(catalog[0]?.durationSeconds || 300);
  const [completedTrackIds, setCompletedTrackIds] = useState([]);

  // Ciclo visual de respiração dinâmico conforme a prática selecionada (4-4-6, 4-4-4-4, 4-7-8 ou 4-6)
  const activePattern = useMemo(() => {
    return selectedMeditation?.breathPattern || [
      { phase: 'Inspire', seconds: 4 },
      { phase: 'Segure', seconds: 4 },
      { phase: 'Expire', seconds: 6 }
    ];
  }, [selectedMeditation]);

  const [patternStepIndex, setPatternStepIndex] = useState(0);
  const [breathCount, setBreathCount] = useState(activePattern[0]?.seconds || 4);

  // Sincroniza seleção quando o catálogo atualiza
  useEffect(() => {
    if (!selectedMeditation && catalog.length > 0) {
      setSelectedMeditation(catalog[0]);
    }
  }, [catalog, selectedMeditation]);

  // Reinicia estado do ciclo respiratório ao trocar de faixa
  useEffect(() => {
    setPatternStepIndex(0);
    setBreathCount(activePattern[0]?.seconds || 4);
  }, [activePattern]);

  // Animação do guia visual de respiração enquanto o áudio está tocando
  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          setPatternStepIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % activePattern.length;
            setBreathCount(activePattern[nextIdx].seconds);
            return nextIdx;
          });
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, activePattern]);

  const handleSelectTrack = (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSelectedMeditation(track);
    setIsPlaying(false);
    setCurrentSeconds(0);
    setTotalSeconds(track.durationSeconds || 300);
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Erro ao reproduzir áudio:', err);
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentSeconds(0);
  };

  const handleSkip = (deltaSec) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Math.max(0, Math.min(totalSeconds, audio.currentTime + deltaSec));
    audio.currentTime = nextTime;
    setCurrentSeconds(Math.floor(nextTime));
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeekBarClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalSeconds) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * totalSeconds;
    audio.currentTime = newTime;
    setCurrentSeconds(Math.floor(newTime));
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentSeconds(totalSeconds);
    if (selectedMeditation && !completedTrackIds.includes(selectedMeditation.id)) {
      setCompletedTrackIds((prev) => [...prev, selectedMeditation.id]);
    }
    completeMeditationSession(selectedMeditation, totalSeconds);
  };

  const formatTimer = (totalSec) => {
    const safeSec = Math.max(0, Math.floor(totalSec || 0));
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPct = totalSeconds > 0 ? Math.min(100, (currentSeconds / totalSeconds) * 100) : 0;
  const currentBreathPhase = activePattern[patternStepIndex]?.phase || 'Inspire';

  return (
    <>
      <HeaderBar title="Meditação & Respiração Guiada" showBack onBack={() => setCurrentScreen('home')} />

      {/* Elemento de áudio HTML5 nativo conectado diretamente aos 4 arquivos .mp3 da pasta /audio */}
      <audio
        ref={audioRef}
        src={selectedMeditation?.audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const dur = Math.round(e.currentTarget.duration);
          if (dur && Number.isFinite(dur)) {
            setTotalSeconds(dur);
          }
        }}
        onTimeUpdate={(e) => {
          setCurrentSeconds(Math.floor(e.currentTarget.currentTime));
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleAudioEnded}
      />

      <main className="screen-body">
        {/* Player Principal (Bloco A — Respiração Consciente & Foco) */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          borderRadius: '26px',
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -4px rgba(22, 163, 74, 0.4)',
          position: 'relative'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                Bloco A • Respiração Consciente & Foco
              </span>
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
          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, marginTop: '14px', lineHeight: 1.3 }}>
            {selectedMeditation?.title}
          </h3>
          <p style={{ fontSize: '0.79rem', opacity: 0.92, marginTop: '4px', lineHeight: 1.4 }}>
            {selectedMeditation?.technique} • {selectedMeditation?.instructor}
          </p>
          <p style={{ fontSize: '0.76rem', opacity: 0.85, marginTop: '6px', lineHeight: 1.45 }}>
            {selectedMeditation?.description}
          </p>

          {/* Interactive Player Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '20px'
          }}>
            <button
              onClick={togglePlayPause}
              style={{
                width: '54px',
                height: '54px',
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
              aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
            >
              {isPlaying ? (
                <Pause size={23} fill="#15803d" />
              ) : (
                <Play size={23} fill="#15803d" style={{ marginLeft: '3px' }} />
              )}
            </button>

            {/* Progress Bar & Timers */}
            <div style={{ flex: 1 }}>
              <div
                onClick={handleSeekBarClick}
                title="Clique para avançar ou retroceder no áudio"
                style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: '#ffffff',
                  borderRadius: '999px',
                  transition: 'width 0.2s linear'
                }} />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginTop: '8px',
                opacity: 0.95
              }}>
                <span>{formatTimer(currentSeconds)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={handleRestart}
                    title="Reiniciar faixa"
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '2px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    +10s
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    title={isMuted ? 'Ativar som' : 'Silenciar'}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '3px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
                <span>{formatTimer(totalSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seletor das 4 Práticas de Áudio (A1, A2, A3, A4) */}
        <div className="app-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Headphones size={18} color="#15803d" />
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                4 Áudios Guiados Disponíveis
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              432 Hz • MP3 192 kbps
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {catalog.map((item) => {
              const active = selectedMeditation?.id === item.id;
              const isCompleted = completedTrackIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTrack(item)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    border: active ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: active ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: active ? '#16a34a' : '#f1f5f9',
                      color: active ? '#ffffff' : '#0f172a',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {item.code}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: active ? '#15803d' : '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '0.74rem',
                        color: '#64748b',
                        marginTop: '2px'
                      }}>
                        {item.technique}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {isCompleted && <CheckCircle2 size={16} color="#16a34a" />}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '999px',
                      background: active ? '#dcfce7' : '#f8fafc',
                      color: active ? '#15803d' : '#475569'
                    }}>
                      {active && isPlaying ? 'Tocando' : item.duration}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
              Guia Visual de Ritmo ({selectedMeditation?.shortTitle})
            </div>
            <div style={{
              width: '94px',
              height: '94px',
              borderRadius: '50%',
              background: currentBreathPhase === 'Inspire'
                ? '#dcfce7'
                : currentBreathPhase === 'Expire'
                ? '#e0e7ff'
                : '#fef3c7',
              border: `3px solid ${
                currentBreathPhase === 'Inspire'
                  ? '#16a34a'
                  : currentBreathPhase === 'Expire'
                  ? '#4f46e5'
                  : '#d97706'
              }`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '14px auto',
              transition: 'all 0.5s ease',
              transform: currentBreathPhase === 'Inspire'
                ? 'scale(1.14)'
                : currentBreathPhase === 'Expire'
                ? 'scale(0.95)'
                : 'scale(1.06)'
            }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                {breathCount}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>
                {currentBreathPhase}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569' }}>
              Acompanhe a voz da locução e mantenha os ombros e a mandíbula relaxados.
            </p>
          </div>
        )}

        {/* Guide Card */}
        <div className="app-card" style={{ padding: '22px 18px' }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
            Guia: Como Praticar no Ambiente de Trabalho
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', marginBottom: '18px' }}>
            Todas as 4 práticas do Bloco A podem ser feitas sentado, de olhos abertos ou fechados.
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
                  Postura confortável na cadeira
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Apoie os dois pés no chão, deixe a coluna ereta sem rigidez e solte os ombros longe das orelhas.
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
                  Escolha o protocolo para o seu momento
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Use <strong>A1 (4-4-6)</strong> antes de reuniões, <strong>A2 (4-4-4-4)</strong> quando houver excesso de tarefas, <strong>A3 (4-7-8)</strong> após momentos de tensão e <strong>A4 (Alternada 4-6)</strong> para recuperar a clareza mental.
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
                  Aviso de Segurança
                </h5>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px', lineHeight: 1.45 }}>
                  Não ouça durante a condução de veículos ou operação de máquinas. Em caso de desconforto ou tontura, interrompa a contagem e respire livremente.
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
