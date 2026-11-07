import React from 'react';
import { useApp } from './context/AppContext';
import TopSimulatorBar from './components/TopSimulatorBar';
import MobileFrame from './components/MobileFrame';
import RhLoginModal from './components/RhLoginModal';

// Screens
import LoginScreen from './screens/LoginScreen';
import TermoResponsabilidadeScreen from './screens/TermoResponsabilidadeScreen';
import AdminCompaniesScreen from './screens/AdminCompaniesScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import BurnoutScreen from './screens/BurnoutScreen';
import DenunciaScreen from './screens/DenunciaScreen';
import BeneficiosScreen from './screens/BeneficiosScreen';
import ApoioScreen from './screens/ApoioScreen';
import CaminhadaOrientadaScreen from './screens/CaminhadaOrientadaScreen';
import MeditacaoScreen from './screens/MeditacaoScreen';
import RHDashboardScreen from './screens/RHDashboardScreen';

export default function App() {
  const { isAuthenticated, currentScreen, currentRole, user, needsTermAcceptance } = useApp();

  const renderActiveScreen = () => {
    // If not authenticated or on login screen
    if (!isAuthenticated || currentScreen === 'login') {
      return <LoginScreen />;
    }

    // If user is 'convidado' and must accept "O Termo de Responsabilidade"
    if (needsTermAcceptance || currentScreen === 'termo_responsabilidade') {
      return <TermoResponsabilidadeScreen />;
    }

    // First screen for admin_plataforma in GESTOR RH: Empresas Cadastradas
    if (
      currentScreen === 'admin_companies' ||
      (currentRole === 'rh' && user?.papel === 'admin_plataforma' && currentScreen !== 'rh_dashboard')
    ) {
      return <AdminCompaniesScreen />;
    }

    // If currently on the HR / NR-1 dashboard
    if (currentRole === 'rh' || currentScreen === 'rh_dashboard') {
      return <RHDashboardScreen />;
    }

    // Employee Mobile Views
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'perfil':
        return <ProfileScreen />;
      case 'burnout':
        return <BurnoutScreen />;
      case 'denuncia':
        return <DenunciaScreen />;
      case 'beneficios':
        return <BeneficiosScreen />;
      case 'apoio':
        return <ApoioScreen />;
      case 'caminhada':
        return <CaminhadaOrientadaScreen />;
      case 'meditacao':
        return <MeditacaoScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="platform-container">
      {/* Top Demo Toolbar */}
      <TopSimulatorBar />

      {/* Main Viewport Container */}
      <MobileFrame>
        {renderActiveScreen()}
      </MobileFrame>

      {/* Restricted RH Login Popup Modal */}
      <RhLoginModal />
    </div>
  );
}
