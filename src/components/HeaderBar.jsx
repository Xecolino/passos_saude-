import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Coins } from 'lucide-react';

export default function HeaderBar({ title, showBack = false, onBack }) {
  const { user, setCurrentScreen, currentScreen } = useApp();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentScreen('home');
    }
  };

  if (title) {
    return (
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showBack && (
            <button
              onClick={handleBack}
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155'
              }}
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            {title}
          </h2>
        </div>

        <div
          className="coins-pill"
          onClick={() => setCurrentScreen('beneficios')}
          title="Ver loja de recompensas"
        >
          <span className="coin-icon">🪙</span>
          <span>{user.coins.toLocaleString('pt-BR')}</span>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header">
      <div
        className="user-profile-header"
        onClick={() => setCurrentScreen('perfil')}
        title="Editar cadastro e metas"
      >
        <div className="avatar-bubble">
          {user.initials || 'AC'}
        </div>
        <div className="user-welcome-text">
          <div className="greeting">Bem-vindo(a)</div>
          <div className="name">{user.name ? user.name.split(' ')[0] : 'Colaborador'}</div>
        </div>
      </div>

      <div
        className="coins-pill"
        onClick={() => setCurrentScreen('beneficios')}
        title="Ver loja de benefícios"
      >
        <span className="coin-icon">🪙</span>
        <span>{user.coins.toLocaleString('pt-BR')}</span>
      </div>
    </header>
  );
}
