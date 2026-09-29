import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getWell } from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

export default function WellIntelligence() {
  const { wellId } = useParams();
  const { activeWell, wells } = useApp();
  const { t } = useLanguage();
  const [wellData, setWellData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWellId, setSelectedWellId] = useState(wellId || null);
  const [tab, setTab] = useState('Details');
  const navigate = useNavigate();
  const TABS = [{ key: 'Details', label: t.wellIntel.details }, { key: 'Formations', label: t.wellIntel.formations }, { key: 'Incidents', label: t.wellIntel.incidents }];

  useEffect(() => {
    if (wellId) setSelectedWellId(wellId);
    else if (activeWell) setSelectedWellId(activeWell._id);
  }, [wellId, activeWell]);

  useEffect(() => {
    if (!selectedWellId) return;
    setLoading(true);
    getWell(selectedWellId)
      .then(res => setWellData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedWellId]);

  const well = wellData?.well;
  const formations = wellData?.formations || [];
  const incidents = wellData?.incidents || [];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}>
            <BackIcon /> {t.back}
          </button>
          <h2>{t.wellIntel.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="select" value={selectedWellId || ''} onChange={e => { setSelectedWellId(e.target.value); navigate(`/well-intelligence/${e.target.value}`); }}>
            <option value="">{t.wellIntel.selectWell}</option>
            {wells.map(w => <option key={w._id} value={w._id}>{w.wellName} ({w.status})</option>)}
          </select>
          <span className="data-source-indicator">{t.synthetic}</span>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => (
          <button key={tb.key} className={`tab-item ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
            {tb.label} {tb.key === 'Incidents' && incidents.length > 0 ? `(${incidents.length})` : ''}
          </button>
        ))}
      </div>

      <div className="page-body">
        {loading && <div className="loading-state">{t.loading}</div>}
        {!loading && !well && <div className="loading-state">{t.wellIntel.selectToView}</div>}

        {well && tab === 'Details' && (
          <>
            {/* View on Map card */}
            <div style={{ padding: '10px 0', display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/nearby-wells', { state: { highlightWellId: well._id } })}>
                🗺️ View on Nearby Map
              </button>
              <button className="btn btn-sm btn-saffron" onClick={() => navigate('/select-location', { state: { preselected: { lat: well.latitude, lng: well.longitude } } })}>
                🎯 Analyze This Location
              </button>
            </div>
            <div className="card">
              <div className="card-header"><h3>{t.wellIntel.wellInfo}</h3></div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                  <tbody>
                    <tr><td style={{ fontWeight: 700, width: '180px' }}>{t.wellTable.wellName}</td><td>{well.wellName}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellTable.status}</td><td><span className={`badge badge-${well.status === 'active' ? 'active' : well.status}`}>{well.status}</span></td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellTable.type}</td><td>{well.wellType}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.operator}</td><td>{well.operator}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellTable.field}</td><td>{well.fieldName || '—'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellTable.totalDepth}</td><td>{well.totalDepth} m</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.dashboard.currentDepth}</td><td>{well.currentDepth ? `${well.currentDepth} m` : '—'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.latitude}</td><td>{well.latitude?.toFixed(5)}°N</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.longitude}</td><td>{well.longitude?.toFixed(5)}°E</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.spudDate}</td><td>{well.spudDate ? new Date(well.spudDate).toLocaleDateString() : '—'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.completionDate}</td><td>{well.completionDate ? new Date(well.completionDate).toLocaleDateString() : '—'}</td></tr>
                    <tr><td style={{ fontWeight: 700 }}>{t.wellIntel.dataSource}</td><td><span className="badge badge-synthetic">{well.dataSource}</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {well && tab === 'Formations' && (
          <div className="card">
            <div className="card-header"><h3>Formation Data — {well.wellName}</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {formations.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gov-text-muted)' }}>No formation data available.</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Formation</th><th>Top Depth (m)</th><th>Bottom Depth (m)</th><th>Thickness (m)</th></tr></thead>
                  <tbody>
                    {formations.map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.formation?.name || '—'}</td>
                        <td>{f.topDepth}</td>
                        <td>{f.bottomDepth}</td>
                        <td>{f.bottomDepth - f.topDepth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {well && tab === 'Incidents' && (
          <div className="card">
            <div className="card-header"><h3>Historical Incidents — {well.wellName}</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {incidents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gov-text-muted)' }}>No incidents recorded.</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Type</th><th>Depth</th><th>Formation</th><th>Severity</th><th>Description</th><th>Mitigation</th></tr></thead>
                  <tbody>
                    {incidents.map((inc, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{inc.incidentType}</td>
                        <td>{inc.depth} m</td>
                        <td>{inc.formationId?.name || '—'}</td>
                        <td><span className={`badge badge-${inc.severity}`}>{inc.severity}</span></td>
                        <td style={{ maxWidth: '250px', fontSize: '11px' }}>{inc.description?.substring(0, 120)}{inc.description?.length > 120 ? '...' : ''}</td>
                        <td style={{ maxWidth: '200px', fontSize: '11px' }}>{inc.mitigation?.substring(0, 100) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
