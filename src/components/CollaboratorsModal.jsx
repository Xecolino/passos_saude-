import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import CollaboratorFormModal from './CollaboratorFormModal';
import WelcomeEmailModal from './WelcomeEmailModal';
import {
  Users,
  UserPlus,
  Edit3,
  X,
  Search,
  Footprints,
  HeartPulse,
  Timer,
  Coins,
  Mail,
  Check,
  RefreshCw,
  Database,
  Copy,
  AlertTriangle
} from 'lucide-react';

export default function CollaboratorsModal({ isOpen, onClose }) {
  const { employeesList, updateEmployee, syncEmployeesWithSupabase, isDatabaseConnected, showToast } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRlsModalOpen, setIsRlsModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Welcome Email Modal State
  const [isWelcomeEmailOpen, setIsWelcomeEmailOpen] = useState(false);
  const [welcomeEmployeeData, setWelcomeEmployeeData] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Form Modal Sub-state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  if (!isOpen) return null;

  // Filtered list based on search
  const filteredEmployees = (employeesList || []).filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(term)) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      (emp.department && emp.department.toLowerCase().includes(term)) ||
      (emp.cargo && emp.cargo.toLowerCase().includes(term)) ||
      (emp.phone && emp.phone.includes(term))
    );
  });

  // Effective selected employee
  const activeSelected =
    filteredEmployees.find((e) => e.id === selectedEmployeeId) ||
    filteredEmployees[0] ||
    null;

  // Supabase Sync Action
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    const res = await syncEmployeesWithSupabase();
    setIsSyncing(false);
    if (res && res.isRlsError) {
      setIsRlsModalOpen(true);
    }
  };

  const sqlPolicyCommand = `-- NOVA ARQUITETURA MULTI-TENANT (31 TABELAS - NR-1 & LGPD)
-- No "SQL Editor" do Supabase, execute na ordem:
-- 1º) sql/schema_completo_passo_e_saude.sql  (Cria os 6 domínios, triggers e RLS)
-- 2º) sql/seed_dados_iniciais.sql            (Popula empresa, setores, convites, catálogos e relatórios NR-1)

-- Caso deseje liberar acesso ao modo Simulador/Demo sem login Auth prévio:
create or replace function public.fn_empresa_atual()
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select empresa_id from public.usuarios where id = auth.uid()),
    '11111111-1111-1111-1111-111111111111'::uuid
  );
$$;

drop policy if exists setores_demo on public.setores;
create policy setores_demo on public.setores for all to anon, authenticated
  using (empresa_id = public.fn_empresa_atual())
  with check (empresa_id = public.fn_empresa_atual());

drop policy if exists convites_demo on public.convites;
create policy convites_demo on public.convites for all to anon, authenticated
  using (empresa_id = public.fn_empresa_atual())
  with check (empresa_id = public.fn_empresa_atual());`;

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(sqlPolicyCommand);
      setCopiedSql(true);
      showToast('Comando SQL copiado com sucesso!');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      showToast('Selecione e copie o texto abaixo manualmente.');
    }
  };

  // Handle "Novo Cadastro"
  const handleOpenCreate = () => {
    setFormMode('create');
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };

  // Handle "Editar Cadastro"
  const handleOpenEdit = (employee = null) => {
    const target = employee || activeSelected;
    if (!target) return;
    setFormMode('edit');
    setEmployeeToEdit(target);
    setIsFormModalOpen(true);
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
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
            maxWidth: '1080px',
            maxHeight: '90vh',
            background: '#ffffff',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                <Users size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Gestão de Colaboradores &amp; Convites
                  </h3>
                  <span style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {employeesList.length} registros
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="modal-close-btn"
              style={{ width: '34px', height: '34px' }}
              title="Fechar janela"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar & Quick Controls */}
          <div style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Buscar por nome, setor, cargo ou e-mail..."
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '0.84rem',
                  background: '#ffffff',
                  borderRadius: '12px'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {activeSelected ? (
                <span>
                  Selecionado: <strong style={{ color: '#0f172a' }}>{activeSelected.name}</strong> ({activeSelected.department})
                </span>
              ) : (
                <span>Clique em uma linha para selecionar</span>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '0',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{
              width: '100%',
              minWidth: '880px',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.84rem'
            }}>
              <thead>
                <tr style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  position: 'sticky',
                  top: 0,
                  zIndex: 2
                }}>
                  <th style={{ padding: '12px 16px', width: '38px', textAlign: 'center' }}></th>
                  <th style={{ padding: '12px 16px' }}>Usuário / Cargo</th>
                  <th style={{ padding: '12px 16px' }}>E-mail / CPF</th>
                  <th style={{ padding: '12px 16px' }}>Setor (GHE)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Papel</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Situação</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Média Passos/Dia</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Carteira (Moedas)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '90px' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      Nenhum usuário cadastrado para esta empresa. Clique em "Novo Cadastro" para convidar colaboradores, gestores, RH ou psicólogos.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = activeSelected && activeSelected.id === emp.id;
                    const situacao = emp.situacao || 'convidado';
                    const papel = emp.papel || 'colaborador';

                    const situacaoStyles = {
                      ativo: { bg: '#dcfce7', color: '#15803d' },
                      convidado: { bg: '#fef3c7', color: '#b45309' },
                      inativo: { bg: '#f1f5f9', color: '#475569' },
                      afastado: { bg: '#ffedd5', color: '#c2410c' },
                      desligado: { bg: '#fee2e2', color: '#dc2626' }
                    }[situacao] || { bg: '#f1f5f9', color: '#475569' };

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Radio selection indicator */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #16a34a' : '2px solid #cbd5e1',
                            background: isSelected ? '#16a34a' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            color: '#ffffff'
                          }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </td>

                        {/* Nome + Cargo */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isSelected ? '#bbf7d0' : '#e2e8f0',
                              color: isSelected ? '#15803d' : '#334155',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {getInitials(emp.name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                {emp.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {emp.cargo || 'Colaborador'} {emp.matricula ? `• ${emp.matricula}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* E-mail & CPF / Telefone */}
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          <div>{emp.email}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {emp.cpf ? `CPF: ${emp.cpf}` : ''}
                            {emp.cpf && emp.phone && emp.phone !== '-' ? ' • ' : ''}
                            {emp.phone && emp.phone !== '-' ? emp.phone : ''}
                          </div>
                        </td>

                        {/* Departamento / Setor */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}>
                            {emp.department}
                          </span>
                        </td>

                        {/* Papel (papel_usuario) */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '0.71rem',
                            fontWeight: 700
                          }}>
                            {papel}
                          </span>
                        </td>

                        {/* Situação (situacao_usuario: convidado, ativo, inativo, afastado, desligado) */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={situacao}
                            onChange={(e) => updateEmployee(emp.id, { ...emp, situacao: e.target.value })}
                            style={{
                              background: situacaoStyles.bg,
                              color: situacaoStyles.color,
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Alterar situação do usuário (ativo, inativo, afastado, desligado)"
                          >
                            <option value="convidado">convidado</option>
                            <option value="ativo">ativo</option>
                            <option value="inativo">inativo</option>
                            <option value="afastado">afastado</option>
                            <option value="desligado">desligado</option>
                          </select>
                        </td>

                        {/* Média Passos/Dia */}
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <Footprints size={14} color="#16a34a" />
                            <span>{(emp.avgSteps || 0).toLocaleString('pt-BR')}</span>
                          </div>
                        </td>

                        {/* Saldo da Carteira */}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 800,
                            color: '#d97706',
                            background: '#fef3c7',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem'
                          }}>
                            <Coins size={12} />
                            <span>{(emp.pointsBalance || 0).toLocaleString('pt-BR')}</span>
                          </span>
                        </td>

                        {/* Ação rápida inline */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(emp);
                              }}
                              className="btn-secondary"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                border: '1px solid #cbd5e1'
                              }}
                              title={`Editar dados, papel ou situação de ${emp.name}`}
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWelcomeEmployeeData({
                                  ...emp,
                                  password: emp.password || 'Consulte convite inicial'
                                });
                                setIsWelcomeEmailOpen(true);
                              }}
                              className="btn-secondary"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                color: '#15803d'
                              }}
                              title={`Enviar E-mail de Boas-Vindas e Link do App para ${emp.name}`}
                            >
                              <Mail size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '16px 24px',
            background: '#ffffff',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.84rem' }}
              >
                Fechar
              </button>

              <button
                onClick={handleSyncSupabase}
                disabled={isSyncing}
                className="btn-secondary"
                style={{
                  padding: '10px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  color: '#15803d'
                }}
                title="Sincronizar colaboradores locais com setores e convites no Supabase"
              >
                <RefreshCw size={14} className={isSyncing ? 'pulse-breath' : ''} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleOpenEdit(activeSelected)}
                className="btn-secondary"
                disabled={!activeSelected}
                style={{
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: '#93c5fd',
                  color: '#1d4ed8',
                  background: '#eff6ff'
                }}
                title="Editar os dados do colaborador selecionado"
              >
                <Edit3 size={15} />
                <span>Editar Cadastro</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Cadastrar um novo colaborador"
              >
                <UserPlus size={16} />
                <span>Novo Cadastro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modal: Formulário para Novo Cadastro ou Editar Cadastro */}
      <CollaboratorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={formMode}
        initialData={employeeToEdit}
        onSuccess={(saved) => {
          if (saved && saved.id) {
            setSelectedEmployeeId(saved.id);
            if (formMode === 'create' && saved.password) {
              setWelcomeEmployeeData(saved);
              setIsWelcomeEmailOpen(true);
              try {
                confetti({
                  particleCount: 90,
                  spread: 70,
                  origin: { y: 0.55 }
                });
              } catch {}
            }
          }
        }}
      />

      {/* Modal Informativo de Configuração da Nova Arquitetura SQL */}
      {isRlsModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsRlsModalOpen(false)}
        >
          <div
            className="app-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(226, 232, 240, 0.9)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Nova Arquitetura de Banco (31 Tabelas)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Multi-tenant isolado por <code>empresa_id</code> + Conformidade NR-1 e LGPD Art. 11
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRlsModalOpen(false)}
                className="modal-close-btn"
                style={{ width: '30px', height: '30px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.45, marginBottom: '12px' }}>
              Certifique-se de ter executado no <strong>SQL Editor</strong> do Supabase os dois arquivos da pasta <code>sql/</code>:
              <br />
              1. <code>sql/schema_completo_passo_e_saude.sql</code> (Cria as 31 tabelas, views, triggers e RLS)
              <br />
              2. <code>sql/seed_dados_iniciais.sql</code> (Popula empresa, setores, convites, psicólogos, benefícios e relatórios NR-1)
            </p>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <pre style={{
                background: '#0f172a',
                color: '#38bdf8',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                fontFamily: 'monospace',
                lineHeight: 1.4
              }}>
                {sqlPolicyCommand}
              </pre>
              <button
                onClick={handleCopySql}
                className="btn-secondary"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '5px 10px',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.9)'
                }}
              >
                {copiedSql ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsRlsModalOpen(false)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.84rem' }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exibição do E-mail de Boas-Vindas com Senha Gerada */}
      <WelcomeEmailModal
        isOpen={isWelcomeEmailOpen}
        onClose={() => setIsWelcomeEmailOpen(false)}
        employeeData={welcomeEmployeeData}
      />
    </>
  );
}
