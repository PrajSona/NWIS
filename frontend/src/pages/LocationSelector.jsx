import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getNearbyWells, getFormations, getIncidentTypes } from '../services/api';
import api from '../services/api';

/* ── Icons ─────────────────────────────────────────────────── */
const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

const proposedIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#ea580c;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(234,88,12,0.6);animation:pulse 1.5s infinite"></div>',
  iconSize: [18, 18], iconAnchor: [9, 9],
});
const activeIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#1565c0;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(21,101,192,0.5)"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
});
const historicalIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:10px;height:10px;background:#757575;border:2px solid #fff;border-radius:50%"></div>',
  iconSize: [10, 10], iconAnchor: [5, 5],
});
const incidentIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#c62828;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(198,40,40,0.4)"></div>',
  iconSize: [12, 12], iconAnchor: [6, 6],
});

/* ── Click handler component ───────────────────────────────── */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapUpdater({ center }) {
  const map = useMap();
  const hasSetRef = useRef(false);
  useEffect(() => {
    if (center && !hasSetRef.current) {
      map.setView(center, 13);
      hasSetRef.current = true;
    }
  }, [center, map]);
  return null;
}

/* ── Main Component ────────────────────────────────────────── */
export default function LocationSelector() {
  const { activeWell, wells } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Location selection state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [proposedDepth, setProposedDepth] = useState(3000);
  const [radius, setRadius] = useState(5000);

  // Nearby data
  const [nearbyData, setNearbyData] = useState(null);
  const [selectedWell, setSelectedWell] = useState(null);
  const [loading, setLoading] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Step tracking
  const [step, setStep] = useState(1); // 1=select location, 2=review nearby, 3=AI analysis

  const center = activeWell ? [activeWell.latitude, activeWell.longitude] : [27.37, 95.31];

  const handleMapClick = useCallback((latlng) => {
    setSelectedLocation(latlng);
    setStep(1);
    setNearbyData(null);
    setAiAnalysis(null);
    setSelectedWell(null);
  }, []);

  const fetchNearbyForLocation = useCallback(async () => {
    if (!selectedLocation) return;
    setLoading(true);
    try {
      // Use a custom API call to find wells near the clicked location
      const res = await api.get('/wells/nearby-location', {
        params: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          radius,
        },
      });
      setNearbyData(res.data);
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, radius]);

  const runAiAnalysis = useCallback(async () => {
    if (!selectedLocation) return;
    setAiLoading(true);
    try {
      const res = await api.post('/wells/analyze-location', {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        proposedDepth,
        radius,
      });
      setAiAnalysis(res.data);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }, [selectedLocation, proposedDepth, radius]);

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>🎯 Proposed Drilling Location</h2>
        </div>
        <span className="data-source-indicator">{t.syntheticData}</span>
      </div>

      {/* Step Indicator */}
      <div className="workflow-steps">
        <div className={`workflow-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Select Location</span>
        </div>
        <div className="step-connector" />
        <div className={`workflow-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Review Nearby Wells</span>
        </div>
        <div className="step-connector" />
        <div className={`workflow-step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">AI Risk Analysis</span>
        </div>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 185px)' }}>

          {/* ── Map Panel ── */}
          <div style={{ position: 'relative' }}>
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              <MapUpdater center={center} />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Proposed location marker */}
              {selectedLocation && (
                <>
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={proposedIcon}>
                    <Popup>
                      <strong>📍 Proposed Location</strong><br/>
                      Lat: {selectedLocation.lat.toFixed(5)}<br/>
                      Lng: {selectedLocation.lng.toFixed(5)}
                    </Popup>
                  </Marker>
                  <Circle
                    center={[selectedLocation.lat, selectedLocation.lng]}
                    radius={radius}
                    pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }}
                  />
                </>
              )}

              {/* Active well */}
              {activeWell && (
                <Marker position={[activeWell.latitude, activeWell.longitude]} icon={activeIcon}>
                  <Popup><strong>{activeWell.wellName}</strong><br/>Active Well</Popup>
                </Marker>
              )}

              {/* Nearby wells from analysis */}
              {nearbyData?.nearbyWells?.map(nw => (
                <Marker
                  key={nw.well._id}
                  position={[nw.well.latitude, nw.well.longitude]}
                  icon={nw.incidentCount > 0 ? incidentIcon : historicalIcon}
                  eventHandlers={{ click: () => setSelectedWell(nw) }}
                >
                  <Popup>
                    <strong>{nw.well.wellName}</strong><br/>
                    {nw.distanceKm} km • {nw.incidentCount} incidents
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map instruction overlay */}
            {!selectedLocation && (
              <div className="map-instruction-overlay">
                <div className="map-instruction-card">
                  <span style={{ fontSize: '28px' }}>📍</span>
                  <strong>Click on the map</strong>
                  <span>to select a proposed drilling location</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>

            {/* Location Info */}
            {selectedLocation && (
              <div style={{ padding: '14px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 Proposed Location
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div className="loc-info-item">
                    <span className="label">Latitude</span>
                    <span>{selectedLocation.lat.toFixed(5)}°N</span>
                  </div>
                  <div className="loc-info-item">
                    <span className="label">Longitude</span>
                    <span>{selectedLocation.lng.toFixed(5)}°E</span>
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <label className="label" style={{ display: 'block', marginBottom: '4px' }}>Proposed Depth (m)</label>
                  <input
                    type="number" className="input-field" value={proposedDepth}
                    onChange={e => setProposedDepth(Number(e.target.value))}
                    min={100} max={6000} step={50}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <label className="label" style={{ display: 'block', marginBottom: '4px' }}>Search Radius</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1000, 3000, 5000, 10000].map(r => (
                      <button key={r} className={`btn btn-sm ${radius === r ? 'btn-primary' : ''}`} onClick={() => setRadius(r)}>
                        {r / 1000} km
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px' }}
                  onClick={fetchNearbyForLocation}
                  disabled={loading}
                >
                  {loading ? 'Scanning...' : '🔍 Scan Nearby Wells & Incidents'}
                </button>
              </div>
            )}

            {/* Step 2: Nearby Wells Summary */}
            {step >= 2 && nearbyData && (
              <div style={{ padding: '14px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '8px' }}>
                  🗺️ Nearby Wells & Incidents
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <div className="stat-mini-card">
                    <span className="stat-value">{nearbyData.count || 0}</span>
                    <span className="stat-label">Wells</span>
                  </div>
                  <div className="stat-mini-card warning">
                    <span className="stat-value">{nearbyData.totalIncidents || 0}</span>
                    <span className="stat-label">Incidents</span>
                  </div>
                  <div className="stat-mini-card danger">
                    <span className="stat-value">{nearbyData.highSeverityCount || 0}</span>
                    <span className="stat-label">High Sev.</span>
                  </div>
                </div>

                {/* Incident breakdown */}
                {nearbyData.incidentBreakdown && Object.keys(nearbyData.incidentBreakdown).length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>Incident Types Nearby</div>
                    {Object.entries(nearbyData.incidentBreakdown).map(([type, count]) => (
                      <div key={type} className="incident-type-row">
                        <span>{type}</span>
                        <span className="badge badge-warning">{count}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected well detail */}
                {selectedWell && (
                  <div className="selected-well-card">
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary)', marginBottom: '6px' }}>
                      {selectedWell.well.wellName}
                    </div>
                    <div className="mini-detail-row">
                      <span>Distance:</span><span>{selectedWell.distanceKm} km</span>
                    </div>
                    <div className="mini-detail-row">
                      <span>Status:</span>
                      <span className={`badge badge-${selectedWell.well.status}`}>{selectedWell.well.status}</span>
                    </div>
                    <div className="mini-detail-row">
                      <span>Total Depth:</span><span>{selectedWell.well.totalDepth} m</span>
                    </div>
                    <div className="mini-detail-row">
                      <span>Incidents:</span><span>{selectedWell.incidentCount}</span>
                    </div>
                    {selectedWell.incidents?.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        {selectedWell.incidents.map((inc, i) => (
                          <div key={i} className="incident-mini-card">
                            <strong>{inc.incidentType}</strong> — {inc.depth}m
                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{inc.description?.substring(0, 80)}...</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-saffron"
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                >
                  {aiLoading ? '🤖 Analyzing...' : '🤖 Run AI Risk Analysis'}
                </button>
              </div>
            )}

            {/* Step 3: AI Analysis */}
            {step >= 3 && aiAnalysis && (
              <div style={{ padding: '14px', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)', marginBottom: '10px' }}>
                  🤖 AI Risk Assessment
                </div>

                {/* Risk Level Banner */}
                <div className={`risk-level-banner ${aiAnalysis.riskLevel?.toLowerCase()}`}>
                  <div className="risk-level-title">
                    Overall Risk: {aiAnalysis.riskLevel}
                  </div>
                  <div className="risk-level-score">
                    Score: {(aiAnalysis.adjustedScore * 100).toFixed(0)}%
                  </div>
                </div>

                {/* Primary Risk */}
                {aiAnalysis.primaryRiskType && (
                  <div className="alert-panel risk" style={{ marginTop: '10px', padding: '10px' }}>
                    <div className="alert-title" style={{ fontSize: '12px' }}>⚠ Primary Risk: {aiAnalysis.primaryRiskType}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {aiAnalysis.description}
                    </div>
                  </div>
                )}

                {/* AI Reasoning */}
                {aiAnalysis.reasons?.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>AI Reasoning</div>
                    <ul style={{ paddingLeft: '16px', margin: 0 }}>
                      {aiAnalysis.reasons.map((r, i) => (
                        <li key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', lineHeight: 1.4 }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Supporting Evidence PDFs */}
                {aiAnalysis.supportingDocuments?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="label" style={{ marginBottom: '6px' }}>📄 Supporting Evidence (Legacy PDFs)</div>
                    {aiAnalysis.supportingDocuments.map((doc, i) => (
                      <div key={i} className="evidence-pdf-card">
                        <div className="evidence-pdf-header">
                          <span className="pdf-icon">📄</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '11px' }}>{doc.documentName}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              Page {doc.relevantPage} • {doc.docType?.replace(/_/g, ' ')}
                            </div>
                          </div>
                        </div>
                        {doc.excerpt && (
                          <div className="evidence-text" style={{ fontSize: '10px', marginTop: '6px', maxHeight: '80px', overflow: 'auto' }}>
                            {doc.excerpt}
                          </div>
                        )}
                        {doc.incidentType && (
                          <div style={{ marginTop: '4px', fontSize: '10px' }}>
                            <span className={`badge badge-${doc.severity || 'medium'}`}>{doc.severity}</span>
                            {' '}{doc.incidentType} at {doc.depth}m — {doc.wellName}
                          </div>
                        )}
                        {doc.documentId && (
                          <button
                            className="btn btn-sm"
                            style={{ marginTop: '6px', fontSize: '10px' }}
                            onClick={() => navigate(`/documents?doc=${doc.documentId}`)}
                          >
                            View Full Document →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Correlated Wells */}
                {aiAnalysis.correlatedWells?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="label" style={{ marginBottom: '4px' }}>Correlated Wells</div>
                    {aiAnalysis.correlatedWells.slice(0, 5).map((w, i) => (
                      <div key={i} className="mini-detail-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/well-intelligence/${w.wellId || w._id}`)}>
                        <span style={{ fontWeight: 600 }}>{w.wellName}</span>
                        <span>{w.distance ? `${(w.distance / 1000).toFixed(1)} km` : '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="info-box" style={{ marginTop: '12px', fontSize: '10px' }}>
                  <strong>Note:</strong> This analysis is based on legacy data stored in the system. Upload more drilling reports via the Documents page to improve future predictions.
                </div>

                {/* ── Simulate Drilling Here ── */}
                <div style={{ marginTop: '14px', padding: '14px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '2px solid #ea580c', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#9a3412', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🚀 Ready to Drill?
                  </div>
                  <div style={{ fontSize: '10px', color: '#78350f', marginBottom: '10px', lineHeight: 1.5 }}>
                    Start a live drilling simulation at this location. The system will monitor real-time telemetry and trigger alerts as the drill approaches historical risk zones.
                  </div>
                  <button
                    className="btn btn-saffron"
                    style={{ width: '100%', padding: '8px 14px', fontSize: '13px', fontWeight: 800 }}
                    onClick={() => navigate('/live-drilling', {
                      state: {
                        proposedLocation: selectedLocation,
                        proposedDepth,
                        riskLevel: aiAnalysis.riskLevel,
                        primaryRisk: aiAnalysis.primaryRiskType,
                      }
                    })}
                  >
                    ▶ Simulate Drilling Here
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => navigate('/evidence')}>
                    View Full Evidence →
                  </button>
                  <button className="btn btn-sm" onClick={() => navigate('/documents')}>
                    Manage Legacy Data →
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!selectedLocation && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)', marginBottom: '6px' }}>
                    Select Drilling Location
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Click anywhere on the map to propose a drilling location.
                    The system will analyze nearby wells, historical incidents,
                    and legacy data to assess risks.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
