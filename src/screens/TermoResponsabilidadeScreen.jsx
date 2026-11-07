import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, FileCheck2, CheckCircle2, Lock, Building2, UserCheck, LogOut } from 'lucide-react';

export default function TermoResponsabilidadeScreen() {
  const {
    user,
    activeTerm,
    acceptResponsibilityTerm,
    handleLogout
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkedConfirm, setCheckedConfirm] = useState(true);

  const handleAccept = async () => {
    setIsSubmitting(true);
    await acceptResponsibilityTerm();
    setIsSubmitting(false);
  };

  return (
    <div style={{
      minHeight: '100%',
      padding: '28px 20px 40px',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div className="app-card" style={{
        maxWidth: '680px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 24px',
        borderRadius: '24px',
        background: '#ffffff',
        border: '1px solid #bbf7d0',
        boxShadow: '0 20px 40px -15px rgba(22, 163, 74, 0.18)'
      }}>
        {/* Top Badge & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px -4px rgba(22, 163, 74, 0.4)'
            }}>
              <FileCheck2 size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
                Primeiro Acesso • Ativação de Conta (LGPD &amp; NR-1)
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                O Termo de Responsabilidade
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.76rem', color: '#dc2626', borderColor: '#fecaca' }}
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>

        {/* User Identification Summary */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '16px',
          padding: '14px 16px',
          marginBottom: '18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>Usuário Identificado</span>
            <strong style={{ color: '#0f172a' }}>{user?.name}</strong>
            <div style={{ color: '#475569', fontSize: '0.74rem' }}>{user?.email}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>Empresa / Setor</span>
            <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={13} color="#15803d" />
              {user?.companyName || 'Empresa Vinculada'}
            </strong>
            <div style={{ color: '#475569', fontSize: '0.74rem' }}>Setor: {user?.department || 'Geral'}</div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>Papel &amp; Situação Atual</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {user?.papel || 'colaborador'}
              </span>
              <span style={{
                background: '#fef3c7',
                color: '#b45309',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {user?.situacao || 'convidado'} ➔ ativo
              </span>
            </div>
          </div>
        </div>

        {/* Term Content Box (from public.termos) */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '18px',
          maxHeight: '300px',
          overflowY: 'auto',
          marginBottom: '18px',
          fontSize: '0.83rem',
          color: '#334155',
          lineHeight: 1.6,
          whiteSpace: 'pre-line'
        }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', fontSize: '0.92rem' }}>
            {activeTerm?.titulo || 'Termo de Responsabilidade, Uso e Privacidade — Passo é Saúde (LGPD & NR-1)'}
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginLeft: '8px' }}>
              (Versão {activeTerm?.versao || '2026.1'})
            </span>
          </div>
          {activeTerm?.conteudo ||
            `TERMO DE RESPONSABILIDADE E CONSENTIMENTO (LGPD ART. 11 & NR-1)

1. OBJETIVO E FINALIDADE:
O presente Termo de Responsabilidade regula o acesso e a utilização da plataforma corporativa Passo é Saúde, voltada à promoção da saúde física, bem-estar emocional, gamificação corporativa e conformidade com a Norma Regulamentadora NR-1 (Gerenciamento de Riscos Ocupacionais e Psicossociais).

2. PROTEÇÃO DE DADOS PESSOAIS E SENSÍVEIS (LGPD - LEI Nº 13.709/2018):
Seus dados individuais de saúde, autoavaliações psicossociais e agendamentos clínicos são estritamente confidenciais e protegidos pelo Art. 11 da LGPD. Os painéis gerenciais do RH exibem exclusivamente indicadores estatísticos agregados e anonimizados (com trava mínima de k-anonimato).

3. COMPROMISSO E RESPONSABILIDADE DO USUÁRIO:
• Utilizar suas credenciais de acesso de forma pessoal e intransferível, recomendando-se a substituição da senha provisória;
• Em perfis de gestão (rh_admin, rh_operador, gestor) ou apoio clínico (psicologo), zelar pelo sigilo ético, pela governança dos dados cadastrais dos colaboradores e pelo cumprimento das normas de Saúde e Segurança do Trabalho (SST).

Ao clicar no botão "Aceite" abaixo, o seu registro em public.aceites_termo será gravado e a sua situação em public.usuarios mudará imediatamente de "convidado" para "ativo".`}
        </div>

        {/* Checkbox confirmation */}
        <label style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          cursor: 'pointer',
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          fontSize: '0.82rem',
          color: '#1e293b',
          fontWeight: 600
        }}>
          <input
            type="checkbox"
            checked={checkedConfirm}
            onChange={(e) => setCheckedConfirm(e.target.checked)}
            style={{ marginTop: '3px', width: '17px', height: '17px', accentColor: '#16a34a' }}
          />
          <span>
            Li e concordo integralmente com <strong>O Termo de Responsabilidade</strong>, autorizando a ativação do meu perfil de <code>convidado</code> para <code>ativo</code> na plataforma Passo é Saúde.
          </span>
        </label>

        {/* Action Button: "Aceite" */}
        <button
          type="button"
          disabled={!checkedConfirm || isSubmitting}
          onClick={handleAccept}
          className="btn-primary btn-full"
          style={{
            padding: '15px',
            fontSize: '0.98rem',
            fontWeight: 800,
            justifyContent: 'center',
            gap: '10px',
            opacity: !checkedConfirm || isSubmitting ? 0.65 : 1
          }}
        >
          <UserCheck size={20} />
          <span>{isSubmitting ? 'Registrando Aceite e Ativando Conta...' : 'Aceite — Confirmar Termo e Ativar Cadastro'}</span>
        </button>
      </div>
    </div>
  );
}

