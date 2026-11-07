import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Footprints, ShieldAlert, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { handleLogin } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await handleLogin('colaborador', { email, password });
      if (res && res.success === false && res.error) {
        setErrorMessage(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRhLogin = () => {
    handleLogin('rh');
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '30px 24px',
      background: '#f8fafc'
    }}>
      {/* Brand Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '74px',
          height: '74px',
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 12px 24px -6px rgba(22, 163, 74, 0.4)'
        }}>
          <Footprints size={40} color="#ffffff" strokeWidth={2.2} />
        </div>
        <h1 style={{
          fontSize: '1.65rem',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.5px'
        }}>
          Passo é Saúde
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#64748b',
          marginTop: '4px',
          fontWeight: 500
        }}>
          Saúde corporativa, bem-estar e NR-1
        </p>
      </div>

      {/* Main Login Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px 22px',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        {errorMessage && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <div className="form-group">
            <label className="form-label">E-mail corporativo</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="seu.email@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Senha (ou Senha Provisória)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Digite sua senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Esqueci minha senha */}
          <div style={{ textAlign: 'right', marginBottom: '22px' }}>
            <button
              type="button"
              onClick={() => setForgotSent(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {forgotSent ? 'Solicite redefinição ao RH da sua empresa' : 'Esqueci minha senha'}
            </button>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-full"
            style={{ padding: '14px', fontSize: '0.95rem' }}
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Aplicativo'}
          </button>
        </form>

        {/* Divider "ou" */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '22px 0',
          gap: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Acessar como Gestor de RH */}
        <button
          type="button"
          onClick={handleRhLogin}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1.5px solid #dcfce7',
            borderRadius: '16px',
            padding: '12px',
            color: '#15803d',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
        >
          <ShieldAlert size={17} />
          <span>Acessar Módulo Gestor RH</span>
        </button>
      </div>

      {/* Footer Legal */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.72rem',
        color: '#94a3b8',
        marginTop: '24px',
        lineHeight: 1.4
      }}>
        Ao continuar, você aceita os termos de responsabilidade e a política de privacidade em conformidade com a LGPD (Art. 11) e NR-1.
      </p>
    </div>
  );
}
