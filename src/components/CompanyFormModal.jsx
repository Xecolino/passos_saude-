import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Coins,
  Users,
  Image,
  Save,
  PlusCircle,
  Send,
  ShieldCheck
} from 'lucide-react';
import { generateRandomPassword } from '../utils/passwordGenerator';

const DEFAULT_SECTORS = [
  'Recursos Humanos',
  'Diretoria & Administração',
  'Tecnologia',
  'Operações & Logística',
  'Comercial & Vendas',
  'Financeiro & Jurídico',
  'Marketing & Produto',
  'Administrativo / Geral'
];

export default function CompanyFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialCompany = null,
  onSaveSuccess
}) {
  const [companyForm, setCompanyForm] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    email_contato: '',
    telefone: '',
    responsavel_nome: '',
    segmento: '',
    logo_url: '',
    total_colaboradores: '',
    moedas_apoio_mensais: 0
  });

  const [responsibleForm, setResponsibleForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    setor: 'Recursos Humanos'
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialCompany) {
      const resp = initialCompany.responsavelUsuario || {};
      setCompanyForm({
        razao_social: initialCompany.razao_social || '',
        nome_fantasia: initialCompany.nome_fantasia || '',
        cnpj: initialCompany.cnpj || '',
        email_contato: initialCompany.email_contato || '',
        telefone: initialCompany.telefone || '',
        responsavel_nome: initialCompany.responsavel_nome || resp.nome || '',
        segmento: initialCompany.segmento || '',
        logo_url: initialCompany.logo_url || '',
        total_colaboradores:
          initialCompany.total_colaboradores !== null && initialCompany.total_colaboradores !== undefined
            ? String(initialCompany.total_colaboradores)
            : '',
        moedas_apoio_mensais:
          initialCompany.moedas_apoio_mensais !== null && initialCompany.moedas_apoio_mensais !== undefined
            ? Number(initialCompany.moedas_apoio_mensais)
            : 0
      });

      setResponsibleForm({
        nome: resp.nome || initialCompany.responsavel_nome || '',
        email: resp.email || initialCompany.email_contato || '',
        cpf: resp.cpf || '',
        setor: resp.setor || 'Recursos Humanos'
      });
    } else {
      setCompanyForm({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        email_contato: '',
        telefone: '',
        responsavel_nome: '',
        segmento: '',
        logo_url: '',
        total_colaboradores: '',
        moedas_apoio_mensais: 0
      });
      setResponsibleForm({
        nome: '',
        email: '',
        cpf: '',
        setor: 'Recursos Humanos'
      });
    }
    setErrors({});
  }, [isOpen, mode, initialCompany]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!companyForm.razao_social.trim()) errs.razao_social = 'Razão Social é obrigatória.';
    if (!companyForm.cnpj.trim()) errs.cnpj = 'CNPJ é obrigatório.';
    if (!companyForm.email_contato.trim()) errs.email_contato = 'E-mail de contato da empresa é obrigatório.';
    if (!responsibleForm.nome.trim()) errs.resp_nome = 'Nome do usuário responsável é obrigatório.';
    if (!responsibleForm.email.trim()) {
      errs.resp_email = 'E-mail do usuário responsável é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(responsibleForm.email)) {
      errs.resp_email = 'Informe um e-mail válido.';
    }
    if (!responsibleForm.cpf.trim()) errs.resp_cpf = 'CPF do responsável é obrigatório.';
    if (!responsibleForm.setor.trim()) errs.resp_setor = 'Setor do responsável é obrigatório.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e, openEmailAfterSave = true) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    const generatedPassword = generateRandomPassword(7, 8);

    const syncedCompanyForm = {
      ...companyForm,
      responsavel_nome: companyForm.responsavel_nome.trim() || responsibleForm.nome.trim()
    };

    const syncedResponsibleForm = {
      ...responsibleForm,
      password: generatedPassword,
      papel: 'rh_admin',
      situacao: 'convidado'
    };

    if (onSaveSuccess) {
      await onSaveSuccess({
        mode,
        empresaId: initialCompany?.id || null,
        companyData: syncedCompanyForm,
        responsibleData: syncedResponsibleForm,
        openEmailAfterSave
      });
    }
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 10002,
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
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(226, 232, 240, 0.95)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: mode === 'edit'
                ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                : 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {mode === 'edit' ? <Save size={22} /> : <PlusCircle size={22} />}
            </div>
            <div>
              <div style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: mode === 'edit' ? '#2563eb' : '#15803d',
                letterSpacing: '0.5px'
              }}>
                Módulo Admin Plataforma • empresas + setores + usuarios + convites
              </div>
              <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {mode === 'edit' ? 'Editar Cadastro da Empresa' : 'Cadastrar Nova Empresa'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => handleSave(e, true)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* SEÇÃO 1: DADOS DA TABELA EMPRESAS */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={17} color="#15803d" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  1. Dados da Empresa (Tabela <code>public.empresas</code>)
                </h4>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                id, ativo, criado_em e atualizado_em automáticos
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Razão Social & Nome Fantasia */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Razão Social (<code>razao_social</code>) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Empresa Exemplo S.A."
                    value={companyForm.razao_social}
                    onChange={(e) => setCompanyForm({ ...companyForm, razao_social: e.target.value })}
                  />
                  {errors.razao_social && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.razao_social}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome Fantasia (<code>nome_fantasia</code>)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Empresa Exemplo"
                    value={companyForm.nome_fantasia}
                    onChange={(e) => setCompanyForm({ ...companyForm, nome_fantasia: e.target.value })}
                  />
                </div>
              </div>

              {/* CNPJ & Segmento */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CNPJ (<code>cnpj</code>) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="00.000.000/0001-00"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                  />
                  {errors.cnpj && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.cnpj}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Segmento (<code>segmento</code>)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Indústria, Tecnologia, Saúde, Varejo..."
                    value={companyForm.segmento}
                    onChange={(e) => setCompanyForm({ ...companyForm, segmento: e.target.value })}
                  />
                </div>
              </div>

              {/* E-mail de Contato & Telefone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">E-mail de Contato (<code>email_contato</code>) *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="contato@empresa.com.br"
                    value={companyForm.email_contato}
                    onChange={(e) => setCompanyForm({ ...companyForm, email_contato: e.target.value })}
                  />
                  {errors.email_contato && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.email_contato}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Telefone (<code>telefone</code>)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="(11) 3000-0000"
                    value={companyForm.telefone}
                    onChange={(e) => setCompanyForm({ ...companyForm, telefone: e.target.value })}
                  />
                </div>
              </div>

              {/* Nome do Responsável (empresas.responsavel_nome) & URL do Logo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome do Responsável (<code>responsavel_nome</code>)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Preenchido ou sincronizado com o responsável abaixo"
                    value={companyForm.responsavel_nome}
                    onChange={(e) => setCompanyForm({ ...companyForm, responsavel_nome: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">URL da Logo (<code>logo_url</code>)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://empresa.com.br/logo.png"
                    value={companyForm.logo_url}
                    onChange={(e) => setCompanyForm({ ...companyForm, logo_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Total de Colaboradores & Moedas de Apoio Mensais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Total de Colaboradores (<code>total_colaboradores</code>)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Ex: 150"
                    value={companyForm.total_colaboradores}
                    onChange={(e) => setCompanyForm({ ...companyForm, total_colaboradores: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Moedas de Apoio Mensais (<code>moedas_apoio_mensais</code>)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={companyForm.moedas_apoio_mensais}
                    onChange={(e) => setCompanyForm({ ...companyForm, moedas_apoio_mensais: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO USUÁRIO RESPONSÁVEL (RH_ADMIN) */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '18px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #bbf7d0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#15803d" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  2. Usuário Responsável pela Empresa (<code>usuarios</code> / <code>convites</code> / <code>setores</code>)
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: '#15803d',
                  color: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  papel: rh_admin
                </span>
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  situação inicial: convidado ➔ ativo após aceite
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Nome & E-mail do Responsável */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nome do Usuário Responsável (<code>nome</code>) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Fernanda Gestora RH"
                    value={responsibleForm.nome}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibleForm({ ...responsibleForm, nome: val });
                      if (!companyForm.responsavel_nome) {
                        setCompanyForm((prev) => ({ ...prev, responsavel_nome: val }));
                      }
                    }}
                  />
                  {errors.resp_nome && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.resp_nome}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">E-mail do Responsável (<code>email</code>) *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="rh@empresa.com.br"
                    value={responsibleForm.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsibleForm({ ...responsibleForm, email: val });
                      if (!companyForm.email_contato) {
                        setCompanyForm((prev) => ({ ...prev, email_contato: val }));
                      }
                    }}
                  />
                  {errors.resp_email && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.resp_email}</span>}
                </div>
              </div>

              {/* CPF & Setor do Responsável */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CPF do Responsável (<code>cpf</code>) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="000.000.000-00"
                    value={responsibleForm.cpf}
                    onChange={(e) => setResponsibleForm({ ...responsibleForm, cpf: e.target.value })}
                  />
                  {errors.resp_cpf && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.resp_cpf}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Setor do Responsável (<code>setores.nome</code>) *</label>
                  <input
                    type="text"
                    list="sector-suggestions"
                    className="form-input"
                    placeholder="Ex: Recursos Humanos"
                    value={responsibleForm.setor}
                    onChange={(e) => setResponsibleForm({ ...responsibleForm, setor: e.target.value })}
                  />
                  <datalist id="sector-suggestions">
                    {DEFAULT_SECTORS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {errors.resp_setor && <span style={{ fontSize: '0.72rem', color: '#dc2626' }}>{errors.resp_setor}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação no Rodapé */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 16px', fontSize: '0.84rem' }}
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => handleSave(e, false)}
              className="btn-secondary"
              style={{
                padding: '10px 18px',
                fontSize: '0.84rem',
                borderColor: '#bbf7d0',
                color: '#15803d',
                fontWeight: 700
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Apenas Salvar'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              <Send size={16} />
              <span>
                {isSaving
                  ? 'Salvando e Gerando Credenciais...'
                  : 'Salvar e Enviar E-mail para o Usuário Responsável'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

