import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import CompanyFormModal from '../components/CompanyFormModal';
import WelcomeEmailModal from '../components/WelcomeEmailModal';
import CollaboratorsModal from '../components/CollaboratorsModal';
import { generateRandomPassword } from '../utils/passwordGenerator';
import {
  Building2,
  PlusCircle,
  Edit3,
  Mail,
  ShieldCheck,
  Search,
  RefreshCw,
  Users,
  Lock,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function AdminCompaniesScreen({ onOpenCompanyDashboard }) {
  const {
    user,
    companiesList,
    selectedCompanyId,
    setSelectedCompanyId,
    createCompanyWithResponsible,
    updateCompanyWithResponsible,
    refreshCompaniesList,
    logoutRh,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal de Cadastrar / Editar Empresa
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'

  // Modal de E-mail de Boas-Vindas para o Usuário Responsável (rh_admin)
  const [isWelcomeEmailOpen, setIsWelcomeEmailOpen] = useState(false);
  const [welcomeEmailPayload, setWelcomeEmailPayload] = useState(null);

  // Modal opcional para ver Colaboradores da empresa selecionada
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);

  // Armazena em memória a última senha provisória gerada por empresa/responsável
  const [generatedPasswordsByEmail, setGeneratedPasswordsByEmail] = useState({});

  const filteredCompanies = useMemo(() => {
    const list = companiesList || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        (c.razao_social && c.razao_social.toLowerCase().includes(term)) ||
        (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(term)) ||
        (c.cnpj && c.cnpj.toLowerCase().includes(term)) ||
        (c.responsavel_nome && c.responsavel_nome.toLowerCase().includes(term)) ||
        (c.responsavelUsuario?.nome && c.responsavelUsuario.nome.toLowerCase().includes(term)) ||
        (c.responsavelUsuario?.email && c.responsavelUsuario.email.toLowerCase().includes(term))
    );
  }, [companiesList, searchTerm]);

  const activeCompany = useMemo(() => {
    if (!filteredCompanies.length) return null;
    return (
      filteredCompanies.find((c) => c.id === selectedCompanyId) ||
      filteredCompanies[0]
    );
  }, [filteredCompanies, selectedCompanyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCompaniesList();
    setIsRefreshing(false);
    showToast('Lista de empresas atualizada a partir de public.empresas!');
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!activeCompany) {
      showToast('Selecione uma empresa para editar.', 'error');
      return;
    }
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  const handleSendEmailToResponsible = (companyObj = activeCompany, customPassword = null) => {
    const target = companyObj || activeCompany;
    if (!target) return;

    const resp = target.responsavelUsuario || {};
    const email = resp.email || target.email_contato || '';
    const name = resp.nome || target.responsavel_nome || 'Responsável RH';

    if (!email) {
      showToast('Cadastre o e-mail do usuário responsável antes de enviar o convite.', 'error');
      return;
    }

    const emailKey = email.toLowerCase();
    const passwordToUse =
      customPassword ||
      generatedPasswordsByEmail[emailKey] ||
      generateRandomPassword(7, 8);

    if (!generatedPasswordsByEmail[emailKey]) {
      setGeneratedPasswordsByEmail((prev) => ({
        ...prev,
        [emailKey]: passwordToUse
      }));
    }

    setWelcomeEmailPayload({
      name,
      email,
      password: passwordToUse,
      companyName: target.nome_fantasia || target.razao_social,
      papel: 'rh_admin'
    });
    setIsWelcomeEmailOpen(true);
  };

  const handleSaveCompanySuccess = async ({
    mode,
    empresaId,
    companyData,
    responsibleData,
    openEmailAfterSave
  }) => {
    if (responsibleData?.email && responsibleData?.password) {
      setGeneratedPasswordsByEmail((prev) => ({
        ...prev,
        [responsibleData.email.trim().toLowerCase()]: responsibleData.password
      }));
    }

    let result;
    if (mode === 'edit' && empresaId) {
      result = await updateCompanyWithResponsible(empresaId, {
        companyData,
        responsibleData
      });
    } else {
      result = await createCompanyWithResponsible({
        companyData,
        responsibleData
      });
    }

    if (result?.success && result.data) {
      setSelectedCompanyId(result.data.id);
      if (openEmailAfterSave) {
        handleSendEmailToResponsible(result.data, responsibleData?.password);
      }
    }
  };

  const respUser = activeCompany?.responsavelUsuario || {};

  return (
    <div style={{ padding: '24px 20px 44px', background: '#f8fafc', minHeight: '100%' }}>
      {/* Cabeçalho do Administrador da Plataforma */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#15803d',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              papel_usuario: admin_plataforma
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
              {user?.name || 'Alexandre Oliveira'} • {user?.companyName || 'XecoAutomações'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.38rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            Empresas Cadastradas na Plataforma
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Gestão integrada das tabelas <code>empresas</code>, <code>setores</code>, <code>usuarios</code>, <code>convites</code>, <code>termos</code> e <code>aceites_termo</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'pulse-breath' : ''} />
            <span>Atualizar</span>
          </button>

          {activeCompany && onOpenCompanyDashboard && (
            <button
              type="button"
              onClick={() => onOpenCompanyDashboard(activeCompany.id)}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.8rem',
                background: '#eff6ff',
                borderColor: '#bfdbfe',
                color: '#1d4ed8',
                fontWeight: 700
              }}
            >
              <ExternalLink size={14} />
              <span>Painel NR-1 da Empresa</span>
            </button>
          )}

          <button
            type="button"
            onClick={logoutRh}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fecaca' }}
          >
            <Lock size={14} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Lista de Empresas Cadastradas */}
      <div className="app-card" style={{ padding: '18px', marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#15803d" />
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
              Empresas Cadastradas ({filteredCompanies.length})
            </h3>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search
              size={15}
              color="#94a3b8"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar empresa, CNPJ ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px', paddingTop: '7px', paddingBottom: '7px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div style={{
            padding: '28px 16px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            color: '#64748b',
            fontSize: '0.85rem'
          }}>
            Nenhuma empresa encontrada. Clique em <strong>"Cadastrar empresa"</strong> no final da tela para incluir a primeira empresa cliente.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '10px'
          }}>
            {filteredCompanies.map((comp) => {
              const isSelected = activeCompany?.id === comp.id;
              const resp = comp.responsavelUsuario || {};
              const isRespAtivo = resp.situacao === 'ativo';

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedCompanyId(comp.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    borderRadius: '16px',
                    border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: isSelected ? '#15803d' : '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {comp.nome_fantasia || comp.razao_social}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isRespAtivo ? '#dcfce7' : '#fef3c7',
                      color: isRespAtivo ? '#15803d' : '#b45309',
                      flexShrink: 0
                    }}>
                      {resp.situacao || 'convidado'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px' }}>
                    CNPJ: <strong>{comp.cnpj}</strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Resp.: {resp.nome || comp.responsavel_nome || '-'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DETALHAMENTO DA EMPRESA SELECIONADA E DO USUÁRIO RESPONSÁVEL */}
      {activeCompany && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
          {/* Bloco 1: Dados da tabela "empresas" (menos ID, ativo, criado_em e atualizado_em) */}
          <div className="app-card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                  Dados da Empresa (Tabela <code>public.empresas</code>)
                </h4>
                <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Campos de negócio da empresa selecionada (<code>id</code>, <code>ativo</code>, <code>criado_em</code> e <code>atualizado_em</code> são gerados automaticamente pelo banco)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCollaboratorsModalOpen(true)}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.78rem', color: '#15803d', borderColor: '#bbf7d0' }}
              >
                <Users size={14} />
                <span>Ver Usuários / Colaboradores da Empresa</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontSize: '0.82rem'
            }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Razão Social (razao_social)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.razao_social || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Nome Fantasia (nome_fantasia)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.nome_fantasia || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CNPJ (cnpj)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.cnpj || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>E-mail de Contato (email_contato)</span>
                <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{activeCompany.email_contato || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Telefone (telefone)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.telefone || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Responsável (responsavel_nome)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.responsavel_nome || respUser.nome || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Segmento (segmento)</span>
                <strong style={{ color: '#0f172a' }}>{activeCompany.segmento || '-'}</strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeCompany.logo_url && (
                  <img
                    src={activeCompany.logo_url}
                    alt={`Logo ${activeCompany.razao_social}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      padding: '2px',
                      flexShrink: 0
                    }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>URL da Logo (logo_url)</span>
                  <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{activeCompany.logo_url || '-'}</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Total Colaboradores (total_colaboradores)</span>
                <strong style={{ color: '#0f172a' }}>
                  {activeCompany.total_colaboradores !== null && activeCompany.total_colaboradores !== undefined
                    ? activeCompany.total_colaboradores
                    : '-'}
                </strong>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Moedas de Apoio Mensais (moedas_apoio_mensais)</span>
                <strong style={{ color: '#15803d' }}>{activeCompany.moedas_apoio_mensais ?? 0} moedas/mês</strong>
              </div>
            </div>
          </div>

          {/* Bloco 2: Dados do Usuário Responsável (rh_admin) + Botão de Enviar E-mail */}
          <div className="app-card" style={{
            padding: '20px',
            border: '1.5px solid #bbf7d0',
            background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: '1px solid #dcfce7'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <ShieldCheck size={18} color="#15803d" />
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    Usuário Responsável pela Empresa (<code>usuarios</code> / <code>convites</code>)
                  </h4>
                  <span style={{
                    background: '#15803d',
                    color: '#ffffff',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    fontSize: '0.71rem',
                    fontWeight: 800
                  }}>
                    papel_usuario: rh_admin
                  </span>
                  <span style={{
                    background: respUser.situacao === 'ativo' ? '#dcfce7' : '#fef3c7',
                    color: respUser.situacao === 'ativo' ? '#15803d' : '#b45309',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    fontSize: '0.71rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {respUser.situacao === 'ativo' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    situacao_usuario: {respUser.situacao || 'convidado'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px' }}>
                  Inicia com <code>situacao_usuario = convidado</code> e muda automaticamente para <code>ativo</code> após o clique em "Aceite" no Termo de Responsabilidade.
                </p>
              </div>

              {/* Botão de Enviar o E-mail para o Usuário Responsável */}
              <button
                type="button"
                onClick={() => handleSendEmailToResponsible(activeCompany)}
                className="btn-primary"
                style={{ padding: '10px 16px', fontSize: '0.82rem' }}
              >
                <Mail size={16} />
                <span>Enviar E-mail para o Usuário Responsável</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '12px',
              fontSize: '0.82rem'
            }}>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Nome do Usuário (nome)</span>
                <strong style={{ color: '#0f172a' }}>{respUser.nome || activeCompany.responsavel_nome || '-'}</strong>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>E-mail do Usuário (email)</span>
                <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{respUser.email || activeCompany.email_contato || '-'}</strong>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CPF (cpf)</span>
                <strong style={{ color: '#0f172a' }}>{respUser.cpf || '-'}</strong>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Setor do Responsável (setores.nome)</span>
                <strong style={{ color: '#0f172a' }}>{respUser.setor || 'Recursos Humanos'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NO FINAL DA TELA: DOIS BOTÕES "Editar cadastro" E "Cadastrar empresa" */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '12px'
      }}>
        <button
          type="button"
          onClick={handleOpenEdit}
          disabled={!activeCompany}
          className="btn-secondary"
          style={{
            padding: '15px 18px',
            fontSize: '0.92rem',
            fontWeight: 800,
            justifyContent: 'center',
            borderColor: '#93c5fd',
            background: '#eff6ff',
            color: '#1d4ed8',
            opacity: activeCompany ? 1 : 0.5
          }}
        >
          <Edit3 size={18} />
          <span>Editar cadastro</span>
        </button>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary"
          style={{
            padding: '15px 18px',
            fontSize: '0.92rem',
            fontWeight: 800,
            justifyContent: 'center'
          }}
        >
          <PlusCircle size={18} />
          <span>Cadastrar empresa</span>
        </button>
      </div>

      {/* Modal de Formulário: Cadastrar empresa / Editar cadastro */}
      <CompanyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        mode={formMode}
        initialCompany={activeCompany}
        onSaveSuccess={handleSaveCompanySuccess}
      />

      {/* Modal de E-mail de Boas-Vindas com Nome, Senha Provisória e Link para entrar no App */}
      <WelcomeEmailModal
        isOpen={isWelcomeEmailOpen}
        onClose={() => setIsWelcomeEmailOpen(false)}
        employeeData={welcomeEmailPayload}
      />

      {/* Modal de Colaboradores da Empresa Selecionada */}
      <CollaboratorsModal
        isOpen={isCollaboratorsModalOpen}
        onClose={() => setIsCollaboratorsModalOpen(false)}
      />
    </div>
  );
}

