import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { User, Target, Save, ArrowLeft, Check, Building2, Phone, Mail } from 'lucide-react';

export default function ProfileScreen() {
  const { user, updateProfile, setCurrentScreen } = useApp();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    stepsGoal: user.stepsGoal
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stepsGoal' ? Number(value) : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setCurrentScreen('home');
  };

  return (
    <>
      <HeaderBar title="Cadastro do Colaborador" showBack onBack={() => setCurrentScreen('home')} />

      <main className="screen-body">
        {/* User Hero Badge */}
        <div style={{ textAlign: 'center', margin: '4px 0 12px' }}>
          <div className="avatar-bubble" style={{
            width: '74px',
            height: '74px',
            fontSize: '1.6rem',
            margin: '0 auto 10px',
            border: '3px solid #bbf7d0',
            background: '#dcfce7',
            color: '#15803d'
          }}>
            {formData.name ? formData.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'AC'}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            {formData.name}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
            {formData.department} • {user.role || 'Colaborador Corporativo'}
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1: Dados Pessoais */}
          <div className="app-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#15803d' }}>
              <User size={19} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Dados pessoais
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Departamento</label>
              <select
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
              >
                <option value="Tecnologia">Tecnologia</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Operações & Logística">Operações & Logística</option>
                <option value="Comercial & Vendas">Comercial & Vendas</option>
                <option value="Financeiro & Jurídico">Financeiro & Jurídico</option>
              </select>
            </div>
          </div>

          {/* Card 2: Meta diária de passos */}
          <div className="app-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#15803d' }}>
              <Target size={19} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Meta diária de passos
              </h3>
            </div>

            <div className="form-group" style={{ marginBottom: '6px' }}>
              <label className="form-label">Passos por dia</label>
              <input
                type="number"
                name="stepsGoal"
                min="3000"
                max="30000"
                step="500"
                className="form-input"
                value={formData.stepsGoal}
                onChange={handleChange}
                required
              />
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Recomendado: 10.000 passos (Organização Mundial da Saúde & NR-1)
            </p>
          </div>

          {/* Action Buttons (Voltar & Salvar) */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setCurrentScreen('home')}
            >
              Voltar
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              <Save size={16} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </main>

      <BottomNav />
    </>
  );
}
