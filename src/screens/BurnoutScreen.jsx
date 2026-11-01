import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { Brain, ChevronRight, CheckCircle2, Circle, AlertTriangle, ShieldCheck, HeartHandshake, Save, Lock, X } from 'lucide-react';

export default function BurnoutScreen() {
  const {
    burnoutQuestionsList,
    burnoutAnswers,
    toggleBurnoutAnswer,
    fatigueLevel,
    saveBurnoutEvaluation,
    isBurnoutModalOpen,
    setIsBurnoutModalOpen,
    setCurrentScreen
  } = useApp();

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    await saveBurnoutEvaluation(fatigueLevel.level !== 'Baixo');
    setIsSaving(false);
  };

  return (
    <>
      <HeaderBar title="Saúde Mental & Burnout" />

      <main className="screen-body">
        {/* Top Info Banner Card */}
        <div
          className="app-card"
          onClick={() => setIsBurnoutModalOpen(true)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            border: '1.5px solid #dcfce7',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Brain size={18} />
              </div>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                Saúde mental • Sigilo LGPD Art. 11
              </span>
            </div>
            <ChevronRight size={18} color="#15803d" />
          </div>

          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              O que é Burnout?
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Sintomas, prevenção e proteção de dados psicossociais (OMS / NR-1).
            </p>
          </div>
        </div>

        {/* Card: Autoavaliação Rápida (public.instrumento_questoes -> public.avaliacoes) */}
        <div className="app-card" style={{ padding: '20px 18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            Autoavaliação rápida
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', marginBottom: '16px' }}>
            Marque as afirmações com as quais você se identifica na última semana. Suas respostas individuais são blindadas (acesso zero pelo RH).
          </p>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(burnoutQuestionsList || []).map((q) => {
              const isChecked = burnoutAnswers.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleBurnoutAnswer(q.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: isChecked ? '#f0fdf4' : '#f8fafc',
                    border: isChecked ? '1px solid #86efac' : '1px solid #f1f5f9',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {isChecked ? (
                      <CheckCircle2 size={20} color="#16a34a" fill="#dcfce7" />
                    ) : (
                      <Circle size={20} color="#cbd5e1" />
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.84rem',
                    color: isChecked ? '#0f172a' : '#334155',
                    fontWeight: isChecked ? 600 : 500,
                    lineHeight: 1.3
                  }}>
                    {q.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Result Bar */}
          <div style={{
            marginTop: '18px',
            padding: '14px 16px',
            background: '#f8fafc',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Nível de fadiga estimado
            </span>
            <span style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: fatigueLevel.color
            }}>
              {fatigueLevel.level}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveEvaluation}
            disabled={isSaving}
            className="btn-secondary btn-full"
            style={{
              marginTop: '12px',
              padding: '10px',
              fontSize: '0.82rem',
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
              color: '#15803d',
              justifyContent: 'center'
            }}
          >
            <Lock size={15} />
            <span>{isSaving ? 'Registrando com sigilo...' : 'Registrar Autoavaliação (Sigilo LGPD Art. 11)'}</span>
          </button>
        </div>

        {/* Guidance Recommendation */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {fatigueLevel.level === 'Alto' ? (
                <AlertTriangle size={17} color="#dc2626" />
              ) : (
                <ShieldCheck size={17} color="#15803d" />
              )}
            </div>
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                Recomendação Personalizada
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                {fatigueLevel.text}
              </p>
            </div>
          </div>

          {fatigueLevel.level !== 'Baixo' && (
            <button
              onClick={() => setCurrentScreen('apoio')}
              className="btn-primary btn-full"
              style={{ marginTop: '14px', padding: '10px', fontSize: '0.84rem' }}
            >
              <HeartHandshake size={16} />
              <span>Agendar Sessão com Psicólogo</span>
            </button>
          )}
        </div>
      </main>

      {/* Modal: O que é Burnout? */}
      {isBurnoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBurnoutModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">O que é Burnout?</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsBurnoutModalOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, marginBottom: '16px' }}>
              Burnout é uma síndrome resultante do estresse crônico no trabalho que não foi gerenciado com sucesso. Foi reconhecida pela OMS como fenômeno ocupacional na CID-11.
            </p>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Principais sintomas
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
              <li>Esgotamento físico e mental persistente</li>
              <li>Distanciamento afetivo e cinismo em relação ao trabalho</li>
              <li>Queda na produtividade e dificuldade de concentração</li>
            </ul>

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Prevenção e Cuidados
            </h4>
            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              <li>Respeite pausas regulares e limites da jornada</li>
              <li>Pratique atividade física diária e sono reparador</li>
              <li>Busque apoio psicológico profissional quando necessário</li>
            </ul>

            <button
              className="btn-primary btn-full"
              onClick={() => {
                setIsBurnoutModalOpen(false);
                setCurrentScreen('apoio');
              }}
            >
              Ver Rede de Apoio Psicológico
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
