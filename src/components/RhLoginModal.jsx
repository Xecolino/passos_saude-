import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, X, AlertCircle, KeyRound } from 'lucide-react';

export default function RhLoginModal() {
  const { isRhLoginModalOpen, closeRhLoginModal, loginAsRh } = useApp();

  const [email, setEmail] = useState('techcorpbr@gmail.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isRhLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const result = await loginAsRh(email, password);
    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  const handleFillDemo = () => {
    setEmail('techcorpbr@gmail.com');
    setPassword('123456');
    setErrorMessage('');
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={closeRhLoginModal}
    >
      <div
        className="app-card"
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px -4px rgba(22, 163, 74, 0.4)'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
                Acesso Restrito
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                Gestor RH & SST
              </h3>
            </div>
          </div>

          <button
            onClick={closeRhLoginModal}
            className="modal-close-btn"
            style={{ width: '32px', height: '32px' }}
            title="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Informative Note */}
        <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45, marginBottom: '18px' }}>
          Esta área é restrita aos usuários delegados pela empresa para gestão do programa de saúde ocupacional, conformidade com a <strong>NR-1</strong> e relatórios de SST.
        </p>

        {/* Error Alert */}
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
            marginBottom: '14px'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* E-mail */}
          <div className="form-group">
            <label className="form-label">E-mail corporativo delegado</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="techcorpbr@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Senha de acesso</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="123456"
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

          {/* Quick Demo Credentials Pill */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '20px',
            border: '1px dashed #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.73rem', color: '#475569', lineHeight: 1.3 }}>
              <strong>Credenciais mockadas:</strong><br />
              <code>techcorpbr@gmail.com</code> | senha: <code>123456</code>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803d',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Preencher
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={closeRhLoginModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1.8, justifyContent: 'center', padding: '12px' }}
            >
              <KeyRound size={16} />
              <span>Entrar no Painel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
