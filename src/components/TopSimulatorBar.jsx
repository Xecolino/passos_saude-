import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, User, LogOut } from 'lucide-react';

export default function TopSimulatorBar() {
  const {
    currentRole,
    switchToRole,
    isAuthenticated,
    handleLogout,
    handleLogin
  } = useApp();

  return (
    <header className="top-demo-toolbar">
      <div className="toolbar-brand">
        <div>
          <h1>Passo é Saúde</h1>
          <span>Bem-Estar, Gamificação &amp; Conformidade Ocupacional</span>
        </div>
      </div>

      <div className="toolbar-actions">
        {/* Role Switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '999px' }}>
          <button
            className={`btn-tool ${currentRole === 'colaborador' ? 'active' : ''}`}
            onClick={() => switchToRole('colaborador')}
            title="Visão do Colaborador"
          >
            <User size={14} />
            <span>Colaborador</span>
          </button>
          <button
            className={`btn-tool ${currentRole === 'rh' ? 'active' : ''}`}
            onClick={() => switchToRole('rh')}
            title="Visão Gestor de RH"
          >
            <ShieldCheck size={14} />
            <span>Gestor RH</span>
          </button>
        </div>

        {/* Auth status */}
        {isAuthenticated ? (
          <button
            className="btn-tool"
            onClick={handleLogout}
            title="Sair da conta"
            style={{ color: '#f87171' }}
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        ) : (
          <button
            className="btn-tool active"
            onClick={() => handleLogin('colaborador')}
          >
            <span>Fazer Login</span>
          </button>
        )}
      </div>
    </header>
  );
}
