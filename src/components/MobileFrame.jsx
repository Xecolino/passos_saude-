import React from 'react';
import { useApp } from '../context/AppContext';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function MobileFrame({ children }) {
  const { deviceFrameMode, toastMessage } = useApp();

  const currentTime = '9:41';

  return (
    <div className={`viewport-wrapper mode-${deviceFrameMode}`}>
      {deviceFrameMode === 'mobile-mockup' ? (
        <div className="phone-mockup-frame">
          {/* Top Notch and iOS Status Bar */}
          <div className="phone-status-bar">
            <span style={{ letterSpacing: '-0.3px' }}>{currentTime}</span>

            <div className="phone-notch">
              <div className="notch-speaker"></div>
              <div className="notch-camera"></div>
            </div>

            <div className="phone-status-icons">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={13} strokeWidth={2.5} />
              <Battery size={15} strokeWidth={2.5} />
            </div>
          </div>

          {/* Inner Screen Area */}
          <div className="app-screen-content">
            {children}
          </div>

          {/* Bottom iOS Indicator Bar */}
          <div className="phone-home-indicator-bar">
            <div className="phone-home-indicator"></div>
          </div>
        </div>
      ) : (
        <div className="full-responsive-card">
          <div className="app-screen-content" style={{ minHeight: 'calc(100vh - 120px)' }}>
            {children}
          </div>
        </div>
      )}

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type === 'error' ? 'error' : ''}`}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
