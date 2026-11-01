import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, User, Mail, Phone, Building2, Save, Database, UserPlus, Check, Briefcase, CreditCard, Hash, Shield } from 'lucide-react';
import { generateRandomPassword } from '../utils/passwordGenerator';

const DEFAULT_DEPARTMENTS = [
  'Tecnologia',
  'Operações & Logística',
  'Comercial & Vendas',
  'Recursos Humanos',
  'Financeiro & Jurídico',
  'Marketing & Produto',
  'Administrativo / Geral'
];

export default function CollaboratorFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onSuccess
}) {
  const { addEmployee, updateEmployee, sectorsList } = useApp();

  const departmentOptions = sectorsList && sectorsList.length > 0
    ? sectorsList.map(s => s.nome)
    : DEFAULT_DEPARTMENTS;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    matricula: '',
    cargo: '',
    papel: 'colaborador',
    department: 'Tecnologia'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone && initialData.phone !== '-' ? initialData.phone : '',
          cpf: initialData.cpf || '',
          matricula: initialData.matricula || '',
          cargo: initialData.cargo || initialData.role || '',
          papel: initialData.papel || 'colaborador',
          department: initialData.department || 'Tecnologia'
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          cpf: '',
          matricula: '',
          cargo: '',
          papel: 'colaborador',
          department: 'Tecnologia'
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido.';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === 'edit' && initialData) {
      await updateEmployee(initialData.id, formData);
      if (onSuccess) onSuccess({ ...initialData, ...formData });
    } else {
      // Cria aleatoriamente uma senha de 6 a 8 caracteres (letras, números e símbolos)
      const generatedPassword = generateRandomPassword(6, 8);
      const created = await addEmployee({
        ...formData,
        password: generatedPassword
      });
      if (onSuccess) onSuccess({ ...created, password: generatedPassword });
    }
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10001,
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
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: mode === 'edit'
                ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                : 'linear-gradient(135deg, #15803d, #22c55e)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: mode === 'edit'
                ? '0 8px 18px -4px rgba(37, 99, 235, 0.35)'
                : '0 8px 18px -4px rgba(22, 163, 74, 0.35)'
            }}>
              {mode === 'edit' ? <Save size={22} /> : <UserPlus size={22} />}
            </div>
            <div>
              <div style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 800,
                color: mode === 'edit' ? '#2563eb' : '#15803d',
                letterSpacing: '0.5px'
              }}>
                {mode === 'edit' ? 'Edição de Dados (usuarios / convites)' : 'Onboarding Multi-Tenant SST'}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {mode === 'edit' ? 'Editar Colaborador' : 'Novo Colaborador / Convite'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="modal-close-btn"
            style={{ width: '32px', height: '32px' }}
            title="Fechar formulário"
          >
            <X size={18} />
          </button>
        </div>

        {/* Supabase Notice Banner */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <Database size={18} color="#15803d" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: 1.35 }}>
            <strong>Nova Arquitetura Supabase:</strong> Vincula automaticamente ao setor (<code>setores</code>), gera o convite (<code>convites</code>) e provisiona usuário + carteira (<code>usuarios</code> &amp; <code>carteiras</code>).
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Campo Nome */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="#15803d" />
              <span>Nome Completo *</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Mariana Costa Rios"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ borderColor: errors.name ? '#ef4444' : undefined }}
            />
            {errors.name && (
              <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* E-mail & Telefone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#15803d" />
                <span>E-mail Corporativo *</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="mariana@empresa.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ borderColor: errors.email ? '#ef4444' : undefined }}
              />
              {errors.email && (
                <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} color="#15803d" />
                <span>Telefone / WhatsApp *</span>
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ borderColor: errors.phone ? '#ef4444' : undefined }}
              />
              {errors.phone && (
                <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                  {errors.phone}
                </span>
              )}
            </div>
          </div>

          {/* Setor / GHE & Cargo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="#15803d" />
                <span>Setor / GHE (NR-1) *</span>
              </label>
              <select
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color="#15803d" />
                <span>Cargo</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Analista Pleno"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </div>
          </div>

          {/* CPF, Matrícula & Papel (Novas colunas de public.usuarios / public.convites) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CreditCard size={13} color="#15803d" />
                <span>CPF</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hash size={13} color="#15803d" />
                <span>Matrícula</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="MAT-1010"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={13} color="#15803d" />
                <span>Papel</span>
              </label>
              <select
                className="form-input"
                value={formData.papel}
                onChange={(e) => setFormData({ ...formData, papel: e.target.value })}
                style={{ cursor: 'pointer' }}
              >
                <option value="colaborador">Colaborador</option>
                <option value="gestor">Gestor</option>
                <option value="rh_operador">RH Operador</option>
                <option value="rh_admin">RH Admin</option>
              </select>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '10px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.85rem' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.85rem' }}
            >
              <Check size={16} />
              <span>{mode === 'edit' ? 'Salvar Alterações' : 'Salvar Cadastro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
