import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import { anonymousReportCategories } from '../data/mockData';
import { ShieldCheck, Lock, Send, CheckCircle2, Copy, X } from 'lucide-react';

export default function DenunciaScreen() {
  const { submitAnonymousReport, reportsList, showToast } = useApp();

  const [category, setCategory] = useState('Assédio Moral');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [description, setDescription] = useState('');
  const [protocolGenerated, setProtocolGenerated] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Por favor, descreva o relato para enviar.', 'error');
      return;
    }

    const protocol = submitAnonymousReport({
      category,
      isAnonymous,
      description
    });

    setProtocolGenerated(protocol);
    setIsSuccessModalOpen(true);
    setDescription('');
  };

  const handleCopyProtocol = () => {
    if (protocolGenerated) {
      navigator.clipboard.writeText(protocolGenerated);
      showToast('Protocolo copiado para a área de transferência!');
    }
  };

  return (
    <>
      <HeaderBar title="Canal de Denúncias" />

      <main className="screen-body">
        {/* Title Header */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Canal de Denúncias
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            Seguro & Anônimo
          </h2>
        </div>

        {/* Protection Alert Card */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '20px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#15803d',
            flexShrink: 0
          }}>
            <ShieldCheck size={22} />
          </div>
          <p style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600, lineHeight: 1.4 }}>
            Suas informações são protegidas. Você pode enviar de forma 100% anônima em cumprimento à Lei 14.457 e NR-1.
          </p>
        </div>

        {/* Report Form Card */}
        <form onSubmit={handleSubmit} className="app-card" style={{ padding: '22px 18px' }}>
          {/* Categoria */}
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {anonymousReportCategories.map((c) => (
                <option key={c.id} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Anônimo */}
          <div
            className="switch-wrapper"
            onClick={() => setIsAnonymous(!isAnonymous)}
            style={{ marginBottom: '16px' }}
          >
            <div>
              <div className="switch-label">Enviar de forma 100% Anônima</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                Nenhum dado pessoal ou IP será vinculado
              </div>
            </div>
            <div className={`switch-pill ${isAnonymous ? 'active' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Descrição</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Descreva o ocorrido com o máximo de detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Botão Enviar */}
          <button
            type="submit"
            className="btn-primary btn-full"
            style={{ padding: '14px', fontSize: '0.92rem' }}
          >
            <Send size={16} />
            <span>Enviar Denúncia</span>
          </button>
        </form>

        {/* Recent Protocols (if any) */}
        {reportsList.length > 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-card)'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              Seus Protocolos Ativos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportsList.map((rep, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    fontSize: '0.76rem'
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#15803d' }}>{rep.protocol}</span>
                  <span style={{ color: '#64748b' }}>{rep.category}</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>{rep.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Success Protocol Modal */}
      {isSuccessModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSuccessModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Denúncia Registrada</h3>
              <button className="modal-close-btn" onClick={() => setIsSuccessModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Relato enviado com proteção integral!
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Guarde seu número de protocolo para acompanhar a tratativa do Comitê de Ética.
              </p>
            </div>

            <div style={{
              background: '#f1f5f9',
              borderRadius: '14px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Número do Protocolo:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '1px' }}>
                  {protocolGenerated}
                </div>
              </div>
              <button
                onClick={handleCopyProtocol}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Copy size={14} />
                <span>Copiar</span>
              </button>
            </div>

            <button
              className="btn-primary btn-full"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
