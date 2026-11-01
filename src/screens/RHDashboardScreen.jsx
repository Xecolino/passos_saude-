import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import CollaboratorsModal from '../components/CollaboratorsModal';
import {
  ShieldCheck,
  Users,
  Footprints,
  HeartPulse,
  TrendingUp,
  Download,
  ArrowLeft,
  Lock,
  RefreshCw,
  Database
} from 'lucide-react';

export default function RHDashboardScreen() {
  const {
    switchToRole,
    logoutRh,
    showToast,
    nr1ComplianceReport,
    consolidateNr1Cycle,
    isDatabaseConnected
  } = useApp();

  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);

  const handleExport = () => {
    showToast('Relatório de Conformidade NR-1 (relatorios_nr1) gerado com sucesso para o PGR/GRO!');
  };

  const handleConsolidateCycle = async () => {
    setIsConsolidating(true);
    await consolidateNr1Cycle();
    setIsConsolidating(false);
  };

  const lowPct = nr1ComplianceReport?.riskSummary?.lowRiskPct ?? 82;
  const modPct = nr1ComplianceReport?.riskSummary?.moderateRiskPct ?? 15;
  const highPct = nr1ComplianceReport?.riskSummary?.highRiskPct ?? 3;

  return (
    <div style={{ padding: '24px 20px 40px', background: '#f8fafc', minHeight: '100%' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => switchToRole('colaborador')}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155'
            }}
            title="Voltar ao App Colaborador"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
              Painel de Gestão Ocupacional &amp; SST
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
              Conformidade NR-1 &amp; Clima
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleConsolidateCycle}
            disabled={isConsolidating}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.8rem',
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
              color: '#15803d'
            }}
            title="Executar Stored Procedure fn_consolidar_ciclo_nr1 (k-anonimato N >= 5)"
          >
            <RefreshCw size={14} className={isConsolidating ? 'pulse-breath' : ''} />
            <span>{isConsolidating ? 'Consolidando...' : 'Consolidar Ciclo NR-1'}</span>
          </button>

          <button
            onClick={handleExport}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Download size={15} />
            <span>Exportar Relatório PGR</span>
          </button>

          <button
            onClick={logoutRh}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', color: '#dc2626', borderColor: '#fee2e2' }}
            title="Encerrar sessão de Gestor RH"
          >
            <Lock size={14} />
            <span>Sair do RH</span>
          </button>
        </div>
      </div>

      {/* Compliance Header Alert */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #bbf7d0',
        borderRadius: '20px',
        padding: '18px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              Empresa: {nr1ComplianceReport.company}
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
              CNPJ: {nr1ComplianceReport.cnpj} • Fonte: <code>relatorios_nr1</code> (K-Anonimato N ≥ 5 &amp; LGPD Art. 11)
            </p>
          </div>
        </div>

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: isDatabaseConnected ? '#dcfce7' : '#f1f5f9',
          color: isDatabaseConnected ? '#15803d' : '#64748b',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700
        }}>
          <Database size={13} />
          <span>{isDatabaseConnected ? 'Supabase Multi-Tenant Ativo' : 'Base Local de Demonstração'}</span>
        </span>
      </div>

      {/* 4 Main Corporate KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* KPI 1 */}
        <div className="app-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d' }}>
            <Users size={16} />
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Adesão Geral</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {nr1ComplianceReport.activeParticipationRate}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
            {nr1ComplianceReport.totalEmployees} colaboradores ativos
          </div>
        </div>

        {/* KPI 2 */}
        <div className="app-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
            <Footprints size={16} />
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Média Passos/Dia</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {(nr1ComplianceReport.averageStepsPerDay || 8640).toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
            ↗ +14% vs mês anterior
          </div>
        </div>

        {/* KPI 3 */}
        <div className="app-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
            <HeartPulse size={16} />
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Atendimentos NR-1</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {nr1ComplianceReport.scheduledPsychologicalSupports}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
            Visão administrativa (sem prontuário)
          </div>
        </div>

        {/* KPI 4 */}
        <div className="app-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Minutos Ativos Totais</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {(nr1ComplianceReport.totalPhysicalActivityMinutes || 38450).toLocaleString('pt-BR')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 700, marginTop: '2px' }}>
            Redução do sedentarismo
          </div>
        </div>
      </div>

      {/* Burnout & Psychosocial Risk Distribution */}
      <div className="app-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Inventário de Riscos Psicossociais &amp; Fadiga (<code>relatorios_nr1</code>)
        </h4>
        <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
          Dados agregados anonimizados por <code>fn_consolidar_ciclo_nr1</code> (trava de k-anonimato N ≥ 5 respondentes por GHE/setor).
        </p>

        {/* Stacked Bar */}
        <div style={{
          height: '24px',
          borderRadius: '999px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '14px'
        }}>
          <div style={{ width: `${lowPct}%`, background: '#22c55e' }} title={`Baixo Risco: ${lowPct}%`} />
          <div style={{ width: `${modPct}%`, background: '#f59e0b' }} title={`Risco Moderado: ${modPct}%`} />
          <div style={{ width: `${highPct}%`, background: '#ef4444' }} title={`Atenção/Alto: ${highPct}%`} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          fontSize: '0.78rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <span>Baixo Risco ({lowPct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <span>Moderado ({modPct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <span>Atenção Alta ({highPct}%)</span>
          </div>
        </div>
      </div>

      {/* Interdepartmental Rankings Table */}
      <div className="app-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
          Engajamento e Recorte por Setor / GHE (<code>setores</code> &amp; <code>vw_ranking_passos</code>)
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(nr1ComplianceReport.departmentRankings || []).map((dept, index) => (
            <div
              key={dept.dept}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: index === 0 ? '#f0fdf4' : '#f8fafc',
                borderRadius: '14px',
                border: index === 0 ? '1px solid #bbf7d0' : '1px solid #f1f5f9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: index === 0 ? '#15803d' : '#64748b'
                }}>
                  #{index + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    {dept.dept} {dept.ghe ? <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>({dept.ghe})</span> : null}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Adesão: {dept.participation} • Índice: {dept.healthIndex} {dept.nRespondentes ? `• N=${dept.nRespondentes}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#15803d' }}>
                  {(dept.avgSteps || 0).toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  passos médios
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botão Cadastro colaborador (Abre pop-up com a tabela de colaboradores) */}
      <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setIsCollaboratorsModalOpen(true)}
          className="btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: '0.92rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-green)'
          }}
          title="Abrir tabela e gestão de colaboradores e convites"
        >
          <Users size={18} />
          <span>Cadastro colaborador</span>
        </button>

        <button
          onClick={() => switchToRole('colaborador')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.78rem',
            cursor: 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline'
          }}
          title="Retornar para a visualização do aplicativo mobile"
        >
          Retornar ao Aplicativo Mobile do Colaborador
        </button>
      </div>

      {/* Pop-up com a Tabela de Colaboradores */}
      <CollaboratorsModal
        isOpen={isCollaboratorsModalOpen}
        onClose={() => setIsCollaboratorsModalOpen(false)}
      />
    </div>
  );
}
