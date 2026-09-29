import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { runCorrelation, getNearbyWells, getCorrelationWeights } from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

export default function GeologicalCorrelation() {
  const { activeWell } = useApp();
  const { t } = useLanguage();
  const [tab, setTab] = useState('Select');
  const [nearbyWells, setNearbyWells] = useState([]);
  const [correlationCount, setCorrelationCount] = useState(2);
  const [selectedWells, setSelectedWells] = useState([]);
  const [correlationResults, setCorrelationResults] = useState([]);
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const TABS = [
    { key: 'Select', label: '⚙ Select Wells' },
    { key: 'Correlation', label: t.geo.correlation },
    { key: 'Formations', label: t.geo.formations },
    { key: 'Parameters', label: t.geo.parameters },
  ];

  useEffect(() => { getCorrelationWeights().then(r => setWeights(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!activeWell) return;
    getNearbyWells(activeWell._id, { radius: 15000 })
      .then(r => setNearbyWells(r.data.nearbyWells || []))
      .catch(() => {});
  }, [activeWell]);

  const toggleWell = (wellId) => {
    setSelectedWells(prev => {
      if (prev.includes(wellId)) return prev.filter(id => id !== wellId);
      if (prev.length >= correlationCount) return prev;
      return [...prev, wellId];
    });
  };

  const runAllCorrelations = async () => {
    if (!activeWell || selectedWells.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        selectedWells.map(targetWellId =>
          runCorrelation({
            wellId: activeWell._id,
            targetWellId,
            currentDepth: activeWell.currentDepth || activeWell.totalDepth,
          }).then(r => r.data)
        )
      );
      setCorrelationResults(results);
      setTab('Correlation');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  function relColor(s) {
    if (s >= 0.7) return '#b91c1c';
    if (s >= 0.5) return '#ea580c';
    if (s >= 0.3) return '#1e3a5f';
    return '#64748b';
  }

  function relBg(s) {
    if (s >= 0.7) return '#fef2f2';
    if (s >= 0.5) return '#fff7ed';
    if (s >= 0.3) return '#eff6ff';
    return '';
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>{t.geo.title}</h2>
          {activeWell && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Active: <strong>{activeWell.wellName}</strong> ({activeWell.currentDepth || activeWell.totalDepth}m)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedWells.length > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c' }}>
              {selectedWells.length}/{correlationCount} wells selected
            </span>
          )}
          <span className="data-source-indicator">{t.synthetic}</span>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => (
          <button
            key={tb.key}
            className={`tab-item ${tab === tb.key ? 'active' : ''}`}
            onClick={() => setTab(tb.key)}
            disabled={tb.key !== 'Select' && tb.key !== 'Parameters' && correlationResults.length === 0}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="page-body">
        {!activeWell && <div className="loading-state">{t.geo.noActiveWell}</div>}

        {/* ═══ Well Selection Tab ═══ */}
        {activeWell && tab === 'Select' && (
          <>
            <div className="card" style={{ marginBottom: '12px' }}>
              <div className="card-header">
                <h3>📊 Configure Correlation</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <label className="label" style={{ marginBottom: '4px' }}>How many wells to correlate?</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          className={`btn btn-sm ${correlationCount === n ? 'btn-primary' : ''}`}
                          onClick={() => {
                            setCorrelationCount(n);
                            setSelectedWells(prev => prev.slice(0, n));
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <button
                      className="btn btn-primary"
                      disabled={selectedWells.length === 0 || loading}
                      onClick={runAllCorrelations}
                    >
                      {loading ? '⏳ Analyzing...' : `🔬 Run Correlation (${selectedWells.length} wells)`}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Select Offset Wells ({nearbyWells.length} nearby)</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Click to select up to {correlationCount} wells for correlation with {activeWell.wellName}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {nearbyWells.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No nearby wells found.</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>✓</th>
                        <th>{t.wellTable.wellName}</th>
                        <th>Distance</th>
                        <th>{t.wellTable.status}</th>
                        <th>{t.wellTable.totalDepth}</th>
                        <th>{t.wellTable.incidents}</th>
                        <th>{t.wellTable.field}</th>
                        <th>Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearbyWells.map(nw => {
                        const isSelected = selectedWells.includes(nw.well._id);
                        const isFull = selectedWells.length >= correlationCount && !isSelected;
                        return (
                          <tr
                            key={nw.well._id}
                            style={{
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              background: isSelected ? '#fff7ed' : '',
                              borderLeft: isSelected ? '3px solid #ea580c' : '3px solid transparent',
                              opacity: isFull ? 0.5 : 1,
                            }}
                            onClick={() => !isFull && toggleWell(nw.well._id)}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{ accentColor: '#ea580c', pointerEvents: 'none' }}
                              />
                            </td>
                            <td style={{ fontWeight: 700 }}>{nw.well.wellName}</td>
                            <td><span style={{ color: '#ea580c', fontWeight: 600 }}>{nw.distanceKm} km</span></td>
                            <td><span className={`badge badge-${nw.well.status === 'active' ? 'active' : nw.well.status}`}>{nw.well.status}</span></td>
                            <td>{nw.well.totalDepth} m</td>
                            <td>
                              <span style={{ fontWeight: 600, color: nw.incidentCount > 0 ? '#b91c1c' : 'var(--text-muted)' }}>
                                {nw.incidentCount}
                              </span>
                            </td>
                            <td style={{ fontSize: '10px' }}>{nw.well.fieldName || '—'}</td>
                            <td>
                              <button
                                className="btn btn-sm"
                                onClick={(e) => { e.stopPropagation(); navigate('/nearby-wells'); }}
                                title="View on map"
                              >
                                🗺️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ Correlation Results ═══ */}
        {tab === 'Correlation' && correlationResults.length > 0 && (
          <>
            <div className="info-box" style={{ marginBottom: '12px' }}>
              Correlating <strong>{activeWell.wellName}</strong> with{' '}
              {correlationResults.map((r, i) => (
                <span key={i}>
                  <strong>{r.targetWell?.wellName}</strong>
                  {r.targetWell?.distanceKm && ` (${r.targetWell.distanceKm} km)`}
                  {i < correlationResults.length - 1 ? ', ' : ''}
                </span>
              ))}
              {' — '}
              {correlationResults.reduce((sum, r) => sum + (r.correlations?.length || 0), 0)} total incidents analyzed
            </div>

            {correlationResults.map((result, ri) => {
              const tw = result.targetWell;
              const correlations = result.correlations || [];
              if (!tw) return null;
              return (
                <div className="card" key={ri} style={{ marginBottom: '10px' }}>
                  <div className="card-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#ea580c', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {ri + 1}
                      </span>
                      {tw.wellName}
                      <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        — {tw.distanceKm} km away • {correlations.length} incidents
                      </span>
                    </h3>
                    <button className="btn btn-sm" onClick={() => navigate(`/well-intelligence/${tw._id || ''}`)}>
                      View Well →
                    </button>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    {correlations.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No incidents at this offset well.</div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>{t.geo.incidentType}</th>
                            <th>{t.wellTable.depth}</th>
                            <th>{t.wellTable.formation}</th>
                            <th style={{ width: '90px' }}>{t.wellTable.relevance}</th>
                            <th>{t.geo.formationMatch}</th>
                            <th>{t.geo.depthSimilarity}</th>
                            <th>{t.geo.proximity}</th>
                            <th>{t.geo.frequency}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {correlations.map((c, i) => (
                            <tr key={i} style={{ background: relBg(c.relevance?.totalScore) }}>
                              <td style={{ fontWeight: 700 }}>{c.incident.incidentType}</td>
                              <td>{c.incident.depth} m</td>
                              <td>{c.incident.formation || '—'}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${(c.relevance?.totalScore || 0) * 100}%`, height: '100%', background: relColor(c.relevance?.totalScore), borderRadius: '3px' }} />
                                  </div>
                                  <span style={{ fontWeight: 700, fontSize: '12px', color: relColor(c.relevance?.totalScore), minWidth: '32px', textAlign: 'right' }}>
                                    {((c.relevance?.totalScore || 0) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td style={{ fontSize: '10px' }}>{c.relevance?.breakdown?.formationMatch?.detail || '—'}</td>
                              <td style={{ fontSize: '10px' }}>{c.relevance?.breakdown?.depthSimilarity?.detail || '—'}</td>
                              <td style={{ fontSize: '10px' }}>{c.relevance?.breakdown?.geographicProximity?.detail || '—'}</td>
                              <td style={{ fontSize: '10px' }}>{c.relevance?.breakdown?.incidentFrequency?.detail || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ═══ Formations Comparison ═══ */}
        {tab === 'Formations' && correlationResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${correlationResults.length + 1}, 1fr)`, gap: '8px' }}>
            {/* Active well */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: '12px' }}>📍 {activeWell.wellName} <span className="badge badge-active">ACTIVE</span></h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Formation</th><th>Top</th><th>Bottom</th></tr></thead>
                  <tbody>
                    {(correlationResults[0]?.activeWell?.formations || []).map((f, i) => (
                      <tr key={i} style={{ background: f.formation?.name === correlationResults[0]?.activeWell?.currentFormation ? '#dcfce7' : '' }}>
                        <td style={{ fontWeight: 600, fontSize: '10px' }}>
                          {f.formation?.name}
                          {f.formation?.name === correlationResults[0]?.activeWell?.currentFormation && ' ⬅'}
                        </td>
                        <td style={{ fontSize: '10px' }}>{f.topDepth}</td>
                        <td style={{ fontSize: '10px' }}>{f.bottomDepth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Offset wells */}
            {correlationResults.map((result, ri) => {
              const tw = result.targetWell;
              const correlations = result.correlations || [];
              if (!tw) return null;
              return (
                <div className="card" key={ri}>
                  <div className="card-header">
                    <h3 style={{ fontSize: '12px' }}>
                      <span style={{ color: '#ea580c', fontWeight: 700 }}>#{ri+1}</span> {tw.wellName}
                    </h3>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                      <thead><tr><th>Formation</th><th>Top</th><th>Bottom</th><th>⚠</th></tr></thead>
                      <tbody>
                        {(tw.formations || []).map((f, i) => {
                          const hasInc = correlations.some(c => c.incident?.formation === f.formation?.name);
                          return (
                            <tr key={i} style={{ background: hasInc ? '#fee2e2' : '' }}>
                              <td style={{ fontWeight: 600, fontSize: '10px' }}>{f.formation?.name}</td>
                              <td style={{ fontSize: '10px' }}>{f.topDepth}</td>
                              <td style={{ fontSize: '10px' }}>{f.bottomDepth}</td>
                              <td>{hasInc ? <span className="badge badge-risk">YES</span> : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ Parameters ═══ */}
        {tab === 'Parameters' && weights && (
          <div className="card">
            <div className="card-header">
              <h3>{t.geo.correlationParams}</h3>
              <span style={{ fontSize: '9px', color: 'var(--warning)', fontWeight: 700 }}>{t.geo.protoNote}</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="data-table">
                <thead><tr><th>{t.geo.factor}</th><th>{t.geo.weight}</th><th>Visual</th><th>{t.wellTable.description}</th></tr></thead>
                <tbody>
                  {[
                    { key: 'formationMatch', label: t.geo.formationMatch, desc: t.geo.formationMatchDesc },
                    { key: 'depthSimilarity', label: t.geo.depthSimilarity, desc: t.geo.depthSimDesc },
                    { key: 'geographicProximity', label: t.geo.proximity, desc: t.geo.proxDesc },
                    { key: 'incidentFrequency', label: t.geo.frequency, desc: t.geo.freqDesc },
                  ].map(p => (
                    <tr key={p.key}>
                      <td style={{ fontWeight: 700 }}>{p.label}</td>
                      <td>{((weights.weights?.[p.key] || 0) * 100).toFixed(0)}%</td>
                      <td>
                        <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                          <div style={{ width: `${(weights.weights?.[p.key] || 0) * 100}%`, height: '100%', background: '#ea580c', borderRadius: '3px' }} />
                        </div>
                      </td>
                      <td style={{ fontSize: '10px' }}>{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="info-box" style={{ margin: '12px' }}>
                {weights.note}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
