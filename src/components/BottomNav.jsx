import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Brain, ShieldAlert, Gift, HeartHandshake } from 'lucide-react';

export default function BottomNav() {
  const { currentScreen, setCurrentScreen } = useApp();

  const tabs = [
    { id: 'home', label: 'Saúde', icon: Home },
    { id: 'burnout', label: 'Burnout', icon: Brain },
    { id: 'denuncia', label: 'Denúncia', icon: ShieldAlert },
    { id: 'beneficios', label: 'Benefícios', icon: Gift },
    { id: 'apoio', label: 'Apoio', icon: HeartHandshake }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentScreen === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentScreen(tab.id)}
            aria-label={tab.label}
          >
            <Icon strokeWidth={isActive ? 2.5 : 1.9} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
