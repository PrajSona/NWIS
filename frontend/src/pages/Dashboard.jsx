import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getAlerts, getIncidents } from '../services/api';

export default function Dashboard() {
  const { activeWell, wells, telemetry, telemetryStatus, riskAlerts, health } = useApp();
  const { t } = useLanguage();
  const [tab, setTab] = useState('Overview');
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAlerts({ limit: 5 }).then(r => setRecentAlerts(r.data.alerts || [])).catch(() => {});
    getIncidents({ limit: 8 }).then(r => setRecentIncidents(r.data.incidents || [])).catch(() => {});
  }, []);

  const stateLabel = telemetryStatus.running ? telemetryStatus.state : 'STOPPED';

  const TABS = [
    { key: 'Overview', label: t.dashboard.overview },
    { key: 'Wells', label: t.dashboard.wells },
    { key: 'Alerts', label: t.dashboard.alerts },
    { key: 'Services', label: t.dashboard.services },
  ];

  return (
    <>
      <div className="page-header">
        <h2>{t.dashboard.title}</h2>
        <span className="data-source-indicator">{t.syntheticData}</span>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => (
          <button key={tb.key} className={`tab-item ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
            {tb.label}
          </button>
        ))}
      </div>

      <div className="page-body">
        {tab === 'Overview' && (
          <>
            {/* Workflow Guide */}
            <div className="card" style={{ marginBottom: '12px', borderLeft: '4px solid #ea580c' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#c2410c', marginBottom: '4px' }}>
                    🎯 Start New Drilling Location Analysis
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Select a proposed drilling location on the map → View nearby wells & incidents → Get AI risk analysis backed by legacy PDF evidence
                  </div>
                </div>
                <button className="btn btn-saffron" onClick={() => navigate('/select-location')}>
                  Select Location →
                </button>
              </div>
            </div>
            <div className="grid-4" style={{ marginBottom: '12px' }}>
              <div className="card"><div className="card-body">
                <div className="metric">
                  <span className="metric-label">{t.dashboard.activeWell}</span>
                  <span className="metric-value" style={{ fontSize: '15px' }}>{activeWell?.wellName || '—'}</span>
                  {activeWell && <span className="badge badge-active" style={{ alignSelf: 'flex-start', marginTop: '3px' }}>ACTIVE</span>}
                </div>
              </div></div>
              <div className="card"><div className="card-body">
                <div className="metric">
                  <span className="metric-label">{t.dashboard.currentDepth}</span>
                  <span className="metric-value">{telemetry?.depth?.toFixed(1) || activeWell?.currentDepth || '—'}<span className="metric-unit"> m</span></span>
                </div>
              </div></div>
              <div className="card"><div className="card-body">
                <div className="metric">
                  <span className="metric-label">{t.dashboard.simulator}</span>
                  <span className={`badge badge-${stateLabel === 'NORMAL' ? 'normal' : stateLabel === 'WARNING' ? 'warning' : stateLabel === 'RISK' ? 'risk' : 'historical'}`}
                    style={{ marginTop: '4px' }}>{stateLabel}</span>
                </div>
              </div></div>
              <div className="card"><div className="card-body">
                <div className="metric">
                  <span className="metric-label">{t.dashboard.totalWells}</span>
                  <span className="metric-value">{wells.length}</span>
                </div>
              </div></div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <h3>{t.dashboard.recentRiskAlerts}</h3>
                  <button className="btn btn-sm" onClick={() => navigate('/evidence')}>{t.viewAll}</button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {riskAlerts.length === 0 && recentAlerts.length === 0 ? (
                    <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{t.dashboard.noAlertsYet}</div>
                  ) : (
                    <table className="data-table">
                      <thead><tr><th>{t.wellTable.alert}</th><th>{t.wellTable.level}</th><th>{t.wellTable.depth}</th></tr></thead>
                      <tbody>
                        {(riskAlerts.length > 0 ? riskAlerts : recentAlerts).slice(0, 5).map((a, i) => (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate('/evidence')}>
                            <td style={{ fontWeight: 600 }}>{a.alertType || a.type || 'Risk Alert'}</td>
                            <td><span className={`badge badge-${(a.riskLevel || a.state || 'low').toLowerCase()}`}>{a.riskLevel || a.state || '—'}</span></td>
                            <td>{a.depth?.toFixed(0) || '—'} m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3>{t.dashboard.recentHistoricalEvents}</h3>
                  <button className="btn btn-sm" onClick={() => navigate('/historical-events')}>{t.viewAll}</button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {recentIncidents.length === 0 ? (
                    <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{t.dashboard.noEventsLoaded}</div>
                  ) : (
                    <table className="data-table">
                      <thead><tr><th>{t.wellTable.well}</th><th>{t.wellTable.type}</th><th>{t.wellTable.depth}</th><th>{t.wellTable.severity}</th></tr></thead>
                      <tbody>
                        {recentIncidents.slice(0, 5).map((inc, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{inc.wellId?.wellName || '—'}</td>
                            <td>{inc.incidentType}</td>
                            <td>{inc.depth} m</td>
                            <td><span className={`badge badge-${inc.severity}`}>{inc.severity}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'Wells' && (
          <div className="card">
            <div className="card-header"><h3>{t.dashboard.allWells} ({wells.length})</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>{t.wellTable.wellName}</th><th>{t.wellTable.status}</th><th>{t.wellTable.type}</th><th>{t.wellTable.totalDepth}</th><th>{t.wellTable.field}</th><th>{t.wellTable.data}</th></tr></thead>
                <tbody>
                  {wells.map(w => (
                    <tr key={w._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/well-intelligence/${w._id}`)}>
                      <td style={{ fontWeight: 600 }}>{w.wellName}</td>
                      <td><span className={`badge badge-${w.status === 'active' ? 'active' : w.status}`}>{w.status}</span></td>
                      <td>{w.wellType}</td>
                      <td>{w.totalDepth} m</td>
                      <td>{w.fieldName || '—'}</td>
                      <td><span className="badge badge-synthetic">{w.isSynthetic ? 'SYNTH' : 'REAL'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'Alerts' && (
          <div className="card">
            <div className="card-header">
              <h3>{t.dashboard.allRiskAlerts}</h3>
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/evidence')}>{t.dashboard.openEvidenceViewer}</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {riskAlerts.length === 0 && recentAlerts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>{t.dashboard.noAlertsGenerated}</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t.wellTable.alert}</th><th>{t.wellTable.level}</th><th>{t.wellTable.depth}</th><th>{t.wellTable.formation}</th><th>{t.wellTable.time}</th></tr></thead>
                  <tbody>
                    {(riskAlerts.length > 0 ? riskAlerts : recentAlerts).map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{a.alertType || a.type || 'Risk'}</td>
                        <td><span className={`badge badge-${(a.riskLevel || a.state || 'low').toLowerCase()}`}>{a.riskLevel || a.state || '—'}</span></td>
                        <td>{a.depth?.toFixed(0) || '—'} m</td>
                        <td>{a.formation || '—'}</td>
                        <td>{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'Services' && (
          <div className="card">
            <div className="card-header"><h3>{t.dashboard.serviceHealthStatus}</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>{t.dashboard.service}</th><th>{t.dashboard.status}</th><th>{t.dashboard.details}</th></tr></thead>
                <tbody>
                  {health?.services && Object.entries(health.services).map(([name, svc]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{name.replace(/([A-Z])/g, ' $1')}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span className={`status-dot ${svc.connected ? 'connected' : 'disconnected'}`} />
                          {svc.connected ? t.dashboard.connected : t.dashboard.unavailable}
                        </span>
                      </td>
                      <td>{svc.host || svc.error || (svc.connected ? t.dashboard.running : t.dashboard.notConfigured)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
