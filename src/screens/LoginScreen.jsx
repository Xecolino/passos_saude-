import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Footprints, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LoginScreen() {
  const { handleLogin } = useApp();
  const [email, setEmail] = useState('ana.colaboradora@empresa.com.br');
  const [password, setPassword] = useState('12345678');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin('colaborador', { email, password });
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
          Passos Saúde
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
        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <div className="form-group">
            <label className="form-label">E-mail corporativo</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="colaborador@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label">Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
              {forgotSent ? 'E-mail de recuperação enviado!' : 'Esqueci minha senha'}
            </button>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            className="btn-primary btn-full"
            style={{ padding: '14px', fontSize: '0.95rem' }}
          >
            Entrar no Aplicativo
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
          <span>Acessar como Gestor de RH</span>
        </button>

        {/* Demo Fast Login Helpers */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px dashed #cbd5e1',
          fontSize: '0.75rem',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
            ⚡ Demonstração com 1-Clique:
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => handleLogin('colaborador')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.73rem',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#15803d'
              }}
            >
              Ana (Colaborador)
            </button>
            <button
              onClick={() => handleLogin('rh')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.73rem',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#2563eb'
              }}
            >
              Gestor SST/NR-1
            </button>
          </div>
        </div>
      </div>

      {/* Footer Legal */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.72rem',
        color: '#94a3b8',
        marginTop: '24px',
        lineHeight: 1.4
      }}>
        Ao continuar, você aceita os termos de uso e a política de privacidade em conformidade com a LGPD e NR-1.
      </p>
    </div>
  );
}
