import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import UserGuideModal from '../../pages/UserGuide';

export default function Header() {
  const { health, socketConnected } = useApp();
  const { langCode, setLanguage, t, languages } = useLanguage();
  const backendOk = health?.services?.backend?.connected;
  const mongoOk = health?.services?.mongodb?.connected;
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <header className="gov-header">
        <div className="gov-header-left">
          <div className="gov-header-emblem">N</div>
          <div className="gov-header-title">
            <h1>{t.appName}</h1>
            <span>{t.appSubtitle}</span>
          </div>
        </div>
        <div className="gov-header-right">
          {/* User Guide button */}
          <button
            className="guide-header-btn"
            onClick={() => setShowGuide(true)}
            title="Open User Guide"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              <line x1="9" y1="7" x2="16" y2="7"/>
              <line x1="9" y1="11" x2="14" y2="11"/>
            </svg>
            User Guide
          </button>

          {/* Language selector */}
          <select
            className="lang-selector"
            value={langCode}
            onChange={e => setLanguage(e.target.value)}
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code}>{lang.native}</option>
            ))}
          </select>

          <div className="gov-header-status">
            <span className={`status-dot ${backendOk ? 'connected' : 'disconnected'}`} />
            API
          </div>
          <div className="gov-header-status">
            <span className={`status-dot ${mongoOk ? 'connected' : 'disconnected'}`} />
            DB
          </div>
          <div className="gov-header-status">
            <span className={`status-dot ${socketConnected ? 'connected' : 'disconnected'}`} />
            WS
          </div>
          <span className="gov-header-tag">{t.demo}</span>
        </div>
      </header>

      {/* User Guide Modal */}
      {showGuide && <UserGuideModal onClose={() => setShowGuide(false)} />}
    </>
  );
}
