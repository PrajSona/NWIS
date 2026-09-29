import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

const ICONS = {
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  map: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  activity: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

export default function Sidebar() {
  const { health } = useApp();
  const { t } = useLanguage();
  const ollamaOk = health?.services?.ollama?.connected;
  const qdrantOk = health?.services?.qdrant?.connected;

  const NAV_ITEMS = [
    { path: '/', label: t.nav.dashboard, icon: 'grid' },
    { path: '/select-location', label: '🎯 Select Location', icon: 'target', highlight: true },
    { path: '/nearby-wells', label: t.nav.nearbyWells, icon: 'map' },
    { path: '/well-intelligence', label: t.nav.wellIntelligence, icon: 'info' },
    { path: '/live-drilling', label: t.nav.liveDrilling, icon: 'activity' },
    { path: '/geological-correlation', label: t.nav.geoCorrelation, icon: 'layers' },
    { path: '/historical-events', label: t.nav.historicalEvents, icon: 'clock' },
    { path: '/documents', label: t.nav.documents + ' (Legacy)', icon: 'file' },
    { path: '/evidence', label: t.nav.evidence, icon: 'search' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section-title">{t.mainMenu}</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`}
          >
            {ICONS[item.icon]}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-footer">
        <div className="sidebar-status-row">
          <span className={`status-dot ${ollamaOk ? 'connected' : 'disconnected'}`} />
          <span>Ollama — {ollamaOk ? t.ready : t.offline}</span>
        </div>
        <div className="sidebar-status-row">
          <span className={`status-dot ${qdrantOk ? 'connected' : 'disconnected'}`} />
          <span>Qdrant — {qdrantOk ? t.ready : t.offline}</span>
        </div>
        <div className="sidebar-demo-tag">{t.syntheticDemoData}</div>
      </div>
    </aside>
  );
}
