import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getAlerts, getAlert, getDocument } from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

export default function Evidence() {
  const { alertId } = useParams();
  const { riskAlerts } = useApp();
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [evidenceTab, setEvidenceTab] = useState('Reasoning');
  const [evidenceDocs, setEvidenceDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { getAlerts({ limit: 30 }).then(r => setAlerts(r.data.alerts || [])).catch(() => {}); }, []);
  useEffect(() => { if (alertId) loadAlertDetail(alertId); }, [alertId]);

  async function loadAlertDetail(id) {
    try {
      const res = await getAlert(id);
      selectAlertObject(res.data.alert);
    } catch (err) { console.error(err); }
  }

  async function selectAlertObject(alert) {
    setSelectedAlert(alert);
    setEvidenceTab('Reasoning');
    const docs = [];
    const correlations = alert?.reasoning?.correlations || [];
    for (const corr of correlations.slice(0, 3)) {
      if (corr.incident?.sourceDocumentId) {
        try {
          const docRes = await getDocument(corr.incident.sourceDocumentId);
          docs.push({
            correlation: corr,
            document: docRes.data.document,
            pages: docRes.data.pages,
            relevantPage: docRes.data.pages?.find(p => p.pageNumber === corr.incident.sourcePage),
          });
        } catch { /* skip */ }
      }
    }
    setEvidenceDocs(docs);
  }

  function selectLiveAlert(a) {
    selectAlertObject({
      alertType: `Potential ${a.type || a.assessment?.primaryRiskType} Risk`,
      riskLevel: a.assessment?.riskLevel || 'MODERATE',
      depth: a.depth,
      formation: a.formation || a.assessment?.currentFormation,
      description: a.assessment?.description,
      reasoning: { reasons: a.assessment?.reasons || [], correlations: a.assessment?.correlatedIncidents || [] },
      correlatedWells: a.assessment?.correlatedWells || [],
      telemetrySnapshot: a.telemetry,
      createdAt: a.timestamp,
    });
  }

  const allAlerts = [...riskAlerts.filter(a => a.assessment), ...alerts];
  const EVIDENCE_TABS = [
    { key: 'Reasoning', label: t.evidence.reasoning },
    { key: 'Historical Incidents', label: t.evidence.historicalIncidents },
    { key: 'Source Documents', label: t.evidence.sourceDocuments },
    { key: 'Telemetry', label: t.evidence.telemetry },
  ];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>{t.evidence.title}</h2>
        </div>
        <span className="data-source-indicator">{t.synthetic}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: 'calc(100vh - 115px)' }}>
        {/* Alert List */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-card)' }}>
          <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: '11px', color: 'var(--primary)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-light)', background: '#f8fafc' }}>
            {t.evidence.riskAlerts} ({allAlerts.length})
          </div>
          {allAlerts.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
              {t.evidence.noAlertsYet}
            </div>
          ) : (
            allAlerts.map((a, i) => (
              <div key={i} onClick={() => a._id ? loadAlertDetail(a._id) : selectLiveAlert(a)}
                style={{
                  padding: '8px 12px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
                  background: selectedAlert && (selectedAlert === a || selectedAlert.alertType === a.alertType) ? '#eef2f7' : 'var(--bg-card)',
                }}>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>{a.alertType || `${a.type || a.assessment?.primaryRiskType} Risk`}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span className={`badge badge-${(a.riskLevel || a.assessment?.riskLevel || 'low').toLowerCase()}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                    {a.riskLevel || a.assessment?.riskLevel || '—'}
                  </span>
                  <span>{a.depth?.toFixed(0) || '—'} m</span>
                  <span>{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : ''}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Evidence Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedAlert ? (
            <div className="loading-state" style={{ flex: 1 }}>{t.evidence.selectAlert}</div>
          ) : (
            <>
              <div style={{ padding: '12px 18px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                <div className={`alert-panel ${selectedAlert.riskLevel === 'HIGH' || selectedAlert.riskLevel === 'CRITICAL' ? 'risk' : ''}`}>
                  <div className="alert-title">⚠ {selectedAlert.alertType || 'Risk Alert'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedAlert.description}</div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{t.wellTable.depth}: {selectedAlert.depth?.toFixed(1)} m</span>
                    <span>{t.wellTable.formation}: {selectedAlert.formation || '—'}</span>
                    <span className={`badge badge-${(selectedAlert.riskLevel || 'low').toLowerCase()}`}>{selectedAlert.riskLevel}</span>
                  </div>
                </div>
              </div>

              <div className="tab-bar">
                {EVIDENCE_TABS.map(tb => <button key={tb.key} className={`tab-item ${evidenceTab === tb.key ? 'active' : ''}`} onClick={() => setEvidenceTab(tb.key)}>{tb.label}</button>)}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                {evidenceTab === 'Reasoning' && (
                  <div className="card">
                    <div className="card-header"><h3>{t.evidence.whyGenerated}</h3></div>
                    <div className="card-body">
                      {selectedAlert.reasoning?.reasons?.length > 0 ? (
                        <ul style={{ paddingLeft: '18px', margin: 0 }}>
                          {selectedAlert.reasoning.reasons.map((r, i) => (
                            <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>{r}</li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>{t.evidence.noReasoningAvail}</div>
                      )}
                      {(selectedAlert.correlatedWells || []).length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          <div className="label">{t.evidence.correlatedWells}</div>
                          <table className="data-table" style={{ marginTop: '4px' }}>
                            <thead><tr><th>{t.wellTable.well}</th><th>{t.wellTable.distance}</th></tr></thead>
                            <tbody>
                              {selectedAlert.correlatedWells.map((w, i) => (
                                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/well-intelligence/${w.wellId || w._id}`)}>
                                  <td style={{ fontWeight: 600 }}>{w.wellName}</td>
                                  <td>{w.distance ? `${(w.distance / 1000).toFixed(1)} km` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {evidenceTab === 'Historical Incidents' && (
                  <div className="card">
                    <div className="card-header"><h3>{t.evidence.correlatedHistorical}</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                      {(selectedAlert.reasoning?.correlations || []).length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t.evidence.noCorrelatedIncidents}</div>
                      ) : (
                        <table className="data-table">
                          <thead><tr><th>{t.wellTable.type}</th><th>{t.wellTable.well}</th><th>{t.wellTable.depth}</th><th>{t.wellTable.formation}</th><th>{t.wellTable.relevance}</th></tr></thead>
                          <tbody>
                            {(selectedAlert.reasoning.correlations || []).map((corr, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700 }}>{corr.incident?.incidentType || corr.type}</td>
                                <td>{corr.well?.wellName || '—'}</td>
                                <td>{corr.incident?.depth || corr.depth} m</td>
                                <td>{corr.incident?.formation || '—'}</td>
                                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                  {corr.relevance?.totalScore ? `${(corr.relevance.totalScore * 100).toFixed(0)}%` : corr.relevanceScore ? `${(corr.relevanceScore * 100).toFixed(0)}%` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {evidenceTab === 'Source Documents' && (
                  <>
                    {evidenceDocs.length === 0 ? (
                      <div className="card"><div className="card-body" style={{ color: 'var(--text-muted)' }}>{t.evidence.noSourceDocs}</div></div>
                    ) : (
                      evidenceDocs.map((ev, i) => (
                        <div className="card" key={i} style={{ marginBottom: '10px' }}>
                          <div className="card-header">
                            <h3>{ev.document.originalName}</h3>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.docs.page} {ev.correlation.incident?.sourcePage || '—'}</span>
                          </div>
                          <div className="card-body">
                            {ev.relevantPage?.extractedText ? (
                              <>
                                <div className="label" style={{ marginBottom: '6px' }}>{t.evidence.evidenceText} ({t.docs.page} {ev.relevantPage.pageNumber})</div>
                                <div className="evidence-text">{ev.relevantPage.extractedText}</div>
                              </>
                            ) : (
                              <div style={{ color: 'var(--text-muted)' }}>{t.docs.noTextExtracted}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {evidenceTab === 'Telemetry' && (
                  <div className="card">
                    <div className="card-header"><h3>{t.evidence.telemetrySnapshot}</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                      {selectedAlert.telemetrySnapshot ? (
                        <table className="data-table">
                          <thead><tr><th>{t.evidence.parameter}</th><th>{t.evidence.value}</th></tr></thead>
                          <tbody>
                            {Object.entries(selectedAlert.telemetrySnapshot)
                              .filter(([k]) => !['timestamp', 'tick', 'state'].includes(k))
                              .map(([key, val]) => (
                                <tr key={key}>
                                  <td style={{ fontWeight: 700, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                                  <td>{typeof val === 'number' ? val.toFixed(2) : val}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t.evidence.noTelemetrySnapshot}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
