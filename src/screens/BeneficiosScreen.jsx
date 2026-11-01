import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { rewardCategories } from '../data/mockData';
import {
  Gift,
  Footprints,
  Brain,
  Coffee,
  Shirt,
  Calendar,
  Sun,
  Pill,
  Activity,
  Shield,
  Clock,
  UserCheck,
  X
} from 'lucide-react';

export default function BeneficiosScreen() {
  const {
    user,
    rewardsCatalog,
    redeemReward,
    isRedemptionModalOpen,
    setIsRedemptionModalOpen,
    lastRedeemedItem
  } = useApp();

  const [activeTab, setActiveTab] = useState('todos');

  const catalog = rewardsCatalog || [];
  const filteredRewards = activeTab === 'todos'
    ? catalog
    : catalog.filter(r => r.category === activeTab);

  const getRewardIcon = (iconName) => {
    switch (iconName) {
      case 'coffee': return <Coffee size={24} color="#d97706" />;
      case 'shirt': return <Shirt size={24} color="#15803d" />;
      case 'calendar': return <Calendar size={24} color="#2563eb" />;
      case 'sun': return <Sun size={24} color="#ea580c" />;
      case 'pill': return <Pill size={24} color="#059669" />;
      case 'activity': return <Activity size={24} color="#8b5cf6" />;
      case 'shield': return <Shield size={24} color="#15803d" />;
      default: return <Gift size={24} color="#15803d" />;
    }
  };

  return (
    <>
      <HeaderBar title="Loja de Recompensas" />

      <main className="screen-body">
        {/* Banner Verde com Saldo de PassoCoins (public.carteiras) */}
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          borderRadius: '24px',
          padding: '24px 20px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -4px rgba(22, 163, 74, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
            <span style={{ fontSize: '1.1rem' }}>🪙</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Seu Saldo (Carteira)</span>
          </div>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginTop: '6px',
            letterSpacing: '-1px'
          }}>
            {user.coins.toLocaleString('pt-BR')}
          </div>
          <p style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '4px', fontWeight: 500 }}>
            Passos-Coins disponíveis para troca
          </p>
        </div>

        {/* Card: Como Ganhar Créditos (public.regras_pontuacao) */}
        <div className="app-card" style={{ padding: '18px 16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
            Como Ganhar Créditos
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
                <Footprints size={17} />
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>10k passos</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                100 moedas
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid #f1f5f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
                <Brain size={17} />
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Meditação</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                50 moedas
              </div>
            </div>
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Loja de Recompensas
          </h4>

          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}>
            {rewardCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === cat.id ? '#15803d' : '#ffffff',
                  color: activeTab === cat.id ? '#ffffff' : '#475569',
                  boxShadow: activeTab === cat.id ? '0 2px 8px rgba(21, 128, 61, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rewards List (public.beneficios) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredRewards.map((reward) => {
            const canAfford = user.coins >= reward.price;
            return (
              <div
                key={reward.id}
                className="app-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                    flexShrink: 0
                  }}>
                    {getRewardIcon(reward.icon)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 700
                      }}>
                        {reward.tag}
                      </span>
                    </div>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {reward.name}
                    </h5>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#15803d',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginTop: '3px'
                    }}>
                      <span>🪙</span>
                      <span>{reward.price} moedas</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => redeemReward(reward)}
                  disabled={!canAfford}
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    opacity: canAfford ? 1 : 0.45,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    background: canAfford ? '#15803d' : '#94a3b8'
                  }}
                >
                  Resgatar
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Rules Footer */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px',
          border: '1px solid #e2e8f0',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: '#64748b'
        }}>
          <div>
            <span style={{ fontSize: '0.9rem' }}>🪙</span>
            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>Mínimo 200</div>
            <div>para resgate</div>
          </div>
          <div>
            <UserCheck size={14} color="#15803d" style={{ margin: '0 auto' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>Folgas exigem</div>
            <div>aprovação gestor</div>
          </div>
          <div>
            <Clock size={14} color="#ea580c" style={{ margin: '0 auto' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>Extrato Imutável</div>
            <div>transacoes_moedas</div>
          </div>
        </div>
      </main>

      {/* Redemption Success Modal */}
      {isRedemptionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRedemptionModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Resgate realizado com sucesso!</h3>
              <button className="modal-close-btn" onClick={() => setIsRedemptionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Gift size={36} />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Você resgatou:
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {lastRedeemedItem?.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', lineHeight: 1.4 }}>
                Solicitação registrada em <code>public.resgates</code>. Em breve o RH entrará em contato para liberação do benefício.
              </p>
            </div>

            <button
              className="btn-primary btn-full"
              onClick={() => setIsRedemptionModalOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
