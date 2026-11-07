import React, { useState } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Footprints,
  Coins,
  Sparkles,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';
import { buildWelcomeEmail } from '../utils/passwordGenerator';

export default function WelcomeEmailModal({ isOpen, onClose, employeeData }) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen || !employeeData) return null;

  const { name, email, password = 'Gerada no 1º cadastro', companyName, papel } = employeeData;
  const emailContent = buildWelcomeEmail({ name, email, password, companyName, papel });

  const handleCopyFullEmail = () => {
    try {
      navigator.clipboard.writeText(emailContent.textBody);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {}
  };

  const handleCopyPassword = () => {
    try {
      navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 3000);
    } catch {}
  };

  const handleOpenMailto = () => {
    const subjectEncoded = encodeURIComponent(emailContent.subject);
    const bodyEncoded = encodeURIComponent(emailContent.textBody);
    window.open(`mailto:${email}?subject=${subjectEncoded}&body=${bodyEncoded}`, '_blank');
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 10003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="app-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #15803d, #22c55e)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px -4px rgba(22, 163, 74, 0.4)'
            }}>
              <Mail size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
                Comunicação com o Colaborador
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                E-mail de Boas-Vindas & Senha Gerada
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn"
            style={{ width: '32px', height: '32px' }}
            title="Fechar janela"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Email Preview Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          background: '#f1f5f9'
        }}>
          {/* Simulated Email Envelope Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden'
          }}>
            {/* Email Meta Bar */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              fontSize: '0.8rem',
              color: '#475569',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b', minWidth: '60px' }}>Para:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {name} &lt;{email}&gt;
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#64748b', minWidth: '60px' }}>Assunto:</span>
                <span style={{ color: '#15803d', fontWeight: 700 }}>
                  {emailContent.subject}
                </span>
              </div>
            </div>

            {/* Email Visual Content */}
            <div style={{ padding: '24px 22px' }}>
              {/* Brand Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Footprints size={18} />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Passo é Saúde</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '6px' }}>Plataforma Corporativa de Bem-Estar</span>
                </div>
              </div>

              {/* 1. Frase Inicial Obrigatória */}
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.3,
                marginBottom: '12px'
              }}>
                Seja bem vindo ao Passo Saúde {name}! 🌟
              </h2>

              {/* 2. Mensagem Criativa de Abertura */}
              <p style={{
                fontSize: '0.86rem',
                color: '#334155',
                lineHeight: 1.55,
                marginBottom: '18px'
              }}>
                É uma alegria imensa ter você conosco nessa jornada rumo a uma rotina de trabalho mais ativa, saudável e recompensadora! A partir de hoje, cada passo seu conta para mais energia, disposição e benefícios reais no seu dia a dia.
              </p>

              {/* 3. Breve Resumo do Aplicativo */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={16} color="#15803d" />
                  <span>Conheça os principais recursos do seu novo app:</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Footprints size={15} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Movimento que Transforma:</strong> Acompanhamento inteligente de passos e metas diárias de caminhada para manter o corpo em movimento.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Coins size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Moedas PassoCoins:</strong> Cada meta atingida rende moedas trocáveis na loja por folgas remuneradas (Day Off), vouchers e prêmios.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <HeartPulse size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Pausas Ativas & Meditação:</strong> Sessões rápidas de respiração e descompressão para alívio imediato do estresse e fadiga.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <ShieldCheck size={15} color="#15803d" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span><strong>Apoio NR-1 & Escuta Segura:</strong> Canal protegido e confidencial para suporte psicológico e gerenciamento de riscos ocupacionais.</span>
                  </div>
                </div>
              </div>

              {/* 4. Caixa da Nova Senha Gerada */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1.5px dashed #86efac',
                borderRadius: '16px',
                padding: '16px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#166534', letterSpacing: '0.4px' }}>
                    🔑 Sua Senha Provisória de Primeiro Acesso:
                  </div>
                  <div style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '3px',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    marginTop: '4px'
                  }}>
                    {password}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
                    Após entrar com a senha provisória e clicar em "Aceite" no Termo de Responsabilidade, sua situação mudará de <strong>convidado</strong> para <strong>ativo</strong>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="btn-secondary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Copiar apenas a senha para a área de transferência"
                >
                  {copiedPassword ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedPassword ? 'Senha Copiada!' : 'Copiar Senha'}</span>
                </button>
              </div>

              {/* Link para entrar no App */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#1d4ed8' }}>
                    🔗 Link para entrar no App:
                  </div>
                  <a
                    href={emailContent.appUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.86rem', fontWeight: 700, color: '#2563eb', wordBreak: 'break-all' }}
                  >
                    {emailContent.appUrl}
                  </a>
                </div>
              </div>

              {/* 5. Aconselhamento Obrigatório de Troca de Senha */}
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <ShieldAlert size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.78rem', color: '#92400e', lineHeight: 1.45 }}>
                  <strong>Aconselhamento de Segurança:</strong> Por motivos de privacidade e proteção individual dos seus dados de saúde, aconselhamos fortemente que você <u>troque esta senha</u> provisória logo no seu primeiro acesso ao aplicativo, acessando a aba <strong>"Meu Perfil"</strong>.
                </div>
              </div>

              {/* Signature */}
              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', fontSize: '0.76rem', color: '#64748b' }}>
                Atenciosamente,<br />
                <strong style={{ color: '#0f172a' }}>Equipe de Gestão de Pessoas, Saúde & SST — Passo é Saúde</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '14px 24px',
          background: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.84rem' }}
          >
            Fechar
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyFullEmail}
              className="btn-secondary"
              style={{
                padding: '10px 16px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Copiar texto completo do e-mail"
            >
              {copiedText ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
              <span>{copiedText ? 'Texto Copiado!' : 'Copiar Texto do E-mail'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMailto}
              className="btn-primary"
              style={{
                padding: '10px 18px',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Abrir no seu cliente de e-mail (Outlook, Gmail, etc.)"
            >
              <ExternalLink size={15} />
              <span>Abrir no E-mail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
