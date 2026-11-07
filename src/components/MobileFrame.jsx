import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileFrame({ children }) {
  const { toastMessage, currentRole, currentScreen } = useApp();
  const isWideDashboard = currentRole === 'rh' || currentScreen === 'rh_dashboard' || currentScreen === 'admin_companies';

  return (
    <div className="viewport-wrapper">
      <div className={`responsive-app-container ${isWideDashboard ? 'wide-dashboard' : ''}`}>
        <div className="app-screen-content">
          {children}
        </div>
      </div>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type === 'error' ? 'error' : ''}`}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
