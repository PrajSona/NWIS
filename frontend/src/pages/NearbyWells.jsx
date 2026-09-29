import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getNearbyWells, getFormations, getIncidentTypes } from '../services/api';
import api from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

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
  html: '<div style="width:10px;height:10px;background:#c62828;border:2px solid #fff;border-radius:50%"></div>',
  iconSize: [10, 10], iconAnchor: [5, 5],
});
const selectedLocIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#ea580c;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(234,88,12,0.5);animation:pulse 1.5s infinite"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

// Highlighted well icon with ripple animation
const highlightedIcon = new L.DivIcon({
  className: 'highlighted-well-marker',
  html: `<div class="hw-ripple-container">
    <div class="hw-ripple hw-ripple-1"></div>
    <div class="hw-ripple hw-ripple-2"></div>
    <div class="hw-ripple hw-ripple-3"></div>
    <div class="hw-core"></div>
  </div>`,
  iconSize: [50, 50], iconAnchor: [25, 25],
});

/* Only set view once on initial mount */
function MapUpdater({ center }) {
  const map = useMap();
  const hasSet = useRef(false);
  useEffect(() => {
    if (center && !hasSet.current) {
      map.setView(center, 13);
      hasSet.current = true;
    }
  }, [center, map]);
  return null;
}

/* Fly to a highlighted well when it arrives */
function FlyToHighlighted({ wellId, nearbyWells }) {
  const map = useMap();
  const hasMoved = useRef(false);
  useEffect(() => {
    if (!wellId || !nearbyWells || hasMoved.current) return;
    const nw = nearbyWells.find(w => w.well._id === wellId);
    if (nw) {
      map.flyTo([nw.well.latitude, nw.well.longitude], 14, { duration: 1.2 });
      hasMoved.current = true;
    }
  }, [wellId, nearbyWells, map]);
  return null;
}

/* Click handler for location selection on map */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

/* ── Keyword highlighter for the Analyze feature ── */
const HIGHLIGHT_RULES = [
  { regex: /\b(stuck pipe|differential sticking|pack-off|key seat(?:ing)?|fish(?:ing)?)\b/gi, cls: 'hl-danger', label: 'Stuck Pipe' },
  { regex: /\b(mud loss|lost circulation|LCM|losses|loss zone)\b/gi, cls: 'hl-warning', label: 'Mud Loss' },
  { regex: /\b(kick|overpressure|well control|gas influx|shut.in|SIDPP|kill (?:weight|mud))\b/gi, cls: 'hl-danger', label: 'Well Control' },
  { regex: /\b(torque|RPM|ROP|pump pressure|mud weight|WOB)\b/gi, cls: 'hl-param', label: 'Parameter' },
  { regex: /\b(\d{3,4}\s*m\b|\d{3,4}\s*m\s*MD|\d{3,4}\s*meters?)\b/gi, cls: 'hl-depth', label: 'Depth' },
  { regex: /\b(\d+\.?\d*\s*PPG|\d+\.?\d*\s*psi|\d+\.?\d*\s*Nm|\d+\.?\d*\s*bbl(?:\/hr)?|\d+\.?\d*\s*m\/hr)\b/gi, cls: 'hl-value', label: 'Value' },
  { regex: /\b(Barail|Tipam|Girujan|Alluvium|Naga|Disang)\b/gi, cls: 'hl-formation', label: 'Formation' },
  { regex: /\b(recommend(?:ation)?s?|lesson(?:s)? learned|mitigation|caution|warning|critical|danger|risk)\b/gi, cls: 'hl-recommend', label: 'Recommendation' },
];

function analyzeText(text) {
  if (!text) return { html: '', stats: {} };
  let result = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const stats = {};
  for (const rule of HIGHLIGHT_RULES) {
    result = result.replace(rule.regex, (match) => {
      stats[rule.label] = (stats[rule.label] || 0) + 1;
      return `<span class="${rule.cls}" title="${rule.label}">${match}</span>`;
    });
  }
  return { html: result, stats };
}

export default function NearbyWells() {
  const { activeWell } = useApp();
  const { t } = useLanguage();
  const [tab, setTab] = useState('Map View');
  const [radius, setRadius] = useState(5000);
  const [nearbyData, setNearbyData] = useState(null);
  const [selectedWell, setSelectedWell] = useState(null);
  const [formations, setFormations] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [filterFormation, setFilterFormation] = useState('');
  const [filterIncident, setFilterIncident] = useState('');
  const [loading, setLoading] = useState(false);
  const [wellDocuments, setWellDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  // Document viewer
  const [viewingDoc, setViewingDoc] = useState(null); // full document view
  const [analyzed, setAnalyzed] = useState(false); // analyze mode
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const highlightWellId = routeLocation.state?.highlightWellId || null;

  useEffect(() => {
    getFormations().then(r => setFormations(r.data.formations || [])).catch(() => {});
    getIncidentTypes().then(r => setIncidentTypes(r.data.types || [])).catch(() => {});
  }, []);

  // Fetch nearby wells - uses clicked location if set, otherwise active well
  const fetchNearby = useCallback(async () => {
    if (!clickedLocation && !activeWell) return;
    setLoading(true);
    setSelectedWell(null);
    try {
      if (clickedLocation) {
        // Search from the clicked point
        const res = await api.get('/wells/nearby-location', {
          params: { lat: clickedLocation.lat, lng: clickedLocation.lng, radius },
        });
        setNearbyData(res.data);
      } else {
        // Fallback to active well
        const params = { radius };
        if (filterFormation) params.formation = filterFormation;
        if (filterIncident) params.incidentType = filterIncident;
        const res = await getNearbyWells(activeWell._id, params);
        setNearbyData(res.data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [clickedLocation, activeWell, radius, filterFormation, filterIncident]);

  // Auto-fetch on initial load (from active well)
  useEffect(() => { if (!clickedLocation) fetchNearby(); }, [activeWell, radius, filterFormation, filterIncident]);

  // When a well is selected, fetch its linked documents
  useEffect(() => {
    if (!selectedWell) { setWellDocuments([]); setViewingDoc(null); return; }
    setLoadingDocs(true);
    const docIds = new Set();
    (selectedWell.incidents || []).forEach(inc => {
      if (inc.sourceDocumentId) docIds.add(inc.sourceDocumentId);
    });
    if (docIds.size === 0) { setWellDocuments([]); setLoadingDocs(false); return; }
    Promise.all(
      Array.from(docIds).map(id =>
        api.get(`/documents/${id}`).then(r => r.data).catch(() => null)
      )
    ).then(results => {
      setWellDocuments(results.filter(Boolean));
      setLoadingDocs(false);
    });
  }, [selectedWell]);

  const handleMapClick = useCallback((latlng) => {
    setClickedLocation(latlng);
    setNearbyData(null);
    setSelectedWell(null);
  }, []);

  const scanFromClickedLocation = () => {
    fetchNearby();
  };

  const goToLocationAnalysis = () => {
    if (clickedLocation) {
      navigate('/select-location', {
        state: { preselected: clickedLocation }
      });
    }
  };

  const center = activeWell ? [activeWell.latitude, activeWell.longitude] : [27.37, 95.31];
  const TABS = [{ key: 'Map View', label: t.nearby.mapView }, { key: 'List View', label: t.nearby.listView }];

  // ── Document Viewer Overlay ──
  if (viewingDoc) {
    const docInfo = viewingDoc.document || viewingDoc;
    const pages = viewingDoc.pages || [];
    const pdfUrl = `/api/documents/${docInfo._id}/file`;
    const analysisResults = analyzed ? pages.map(p => analyzeText(p.extractedText || p.ocrText || '')) : [];
    const totalStats = {};
    if (analyzed) {
      analysisResults.forEach(r => {
        Object.entries(r.stats).forEach(([k, v]) => { totalStats[k] = (totalStats[k] || 0) + v; });
      });
    }

    return (
      <>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-back" onClick={() => { setViewingDoc(null); setAnalyzed(false); }}>
              <BackIcon /> Back to Well
            </button>
            <h2>📄 {docInfo.originalName}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="data-source-indicator">{docInfo.dataSource}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {docInfo.docType?.replace(/_/g, ' ')} • {docInfo.totalPages || pages.length} pages
            </span>
            <button
              className={`btn btn-sm ${analyzed ? 'btn-saffron' : 'btn-primary'}`}
              onClick={() => setAnalyzed(!analyzed)}
            >
              {analyzed ? '✕ Close Analysis' : '🔍 Analyze & Highlight'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: analyzed ? '1fr 420px' : '1fr', height: 'calc(100vh - 100px)' }}>
          {/* Left: Actual PDF */}
          <div style={{ position: 'relative', background: '#525659' }}>
            <iframe
              src={pdfUrl}
              title={docInfo.originalName}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>

          {/* Right: Analysis Panel (only when analyzed) */}
          {analyzed && (
            <div style={{ borderLeft: '2px solid #ea580c', overflowY: 'auto', background: 'var(--bg-card)' }}>
              {/* Summary Bar */}
              {Object.keys(totalStats).length > 0 && (
                <div style={{ padding: '10px 14px', background: '#fefce8', borderBottom: '1px solid #fde047' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#854d0e', marginBottom: '6px' }}>🔍 Analysis Summary</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(totalStats).map(([label, count]) => (
                      <span key={label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                        background: label === 'Stuck Pipe' || label === 'Well Control' ? '#fee2e2' :
                          label === 'Mud Loss' ? '#fef9c3' :
                          label === 'Formation' ? '#dbeafe' :
                          label === 'Depth' || label === 'Value' ? '#f0fdf4' :
                          label === 'Recommendation' ? '#fce7f3' : '#f3f4f6',
                        color: '#333',
                      }}>
                        {label}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div style={{ padding: '6px 14px', background: '#f8fafc', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>Legend:</span>
                <span className="hl-danger" style={{ fontSize: '9px', padding: '1px 4px' }}>Risk</span>
                <span className="hl-warning" style={{ fontSize: '9px', padding: '1px 4px' }}>Loss</span>
                <span className="hl-param" style={{ fontSize: '9px', padding: '1px 4px' }}>Param</span>
                <span className="hl-depth" style={{ fontSize: '9px', padding: '1px 4px' }}>Depth</span>
                <span className="hl-value" style={{ fontSize: '9px', padding: '1px 4px' }}>Value</span>
                <span className="hl-formation" style={{ fontSize: '9px', padding: '1px 4px' }}>Formation</span>
                <span className="hl-recommend" style={{ fontSize: '9px', padding: '1px 4px' }}>Rec.</span>
              </div>

              {/* Analyzed Pages */}
              <div style={{ padding: '10px 14px' }}>
                {pages.length > 0 ? pages.map((page, i) => {
                  const analysisResult = analysisResults[i];
                  return (
                    <div key={page._id || i} style={{ marginBottom: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--primary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Page {page.pageNumber}</span>
                        {analysisResult && Object.keys(analysisResult.stats).length > 0 && (
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {Object.entries(analysisResult.stats).map(([k, v]) => `${k}(${v})`).join(' · ')}
                          </span>
                        )}
                      </div>
                      <div
                        className="evidence-text analyzed-text"
                        style={{ maxHeight: 'none', fontSize: '10px', lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: analysisResult?.html || '' }}
                      />
                    </div>
                  );
                }) : (
                  <div className="info-box">No extracted text available for analysis.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Normal View ──
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>{t.nearby.title}</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {clickedLocation
              ? `📍 Searching from: ${clickedLocation.lat.toFixed(4)}°N, ${clickedLocation.lng.toFixed(4)}°E`
              : `${t.dashboard.activeWell}: ${activeWell?.wellName || '—'}`
            }
          </span>
          {clickedLocation && (
            <button className="btn btn-sm" onClick={() => { setClickedLocation(null); setNearbyData(null); setTimeout(fetchNearby, 100); }}>
              ✕ Reset to Active Well
            </button>
          )}
        </div>
        <span className="data-source-indicator">{t.synthetic}</span>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => <button key={tb.key} className={`tab-item ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>{tb.label}</button>)}
      </div>

      <div className="subtab-bar" style={{ padding: '6px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{t.nearby.radius}:</span>
        {[1000, 3000, 5000, 10000].map(r => (
          <button key={r} className={`btn btn-sm ${radius === r ? 'btn-primary' : ''}`} onClick={() => setRadius(r)}>
            {r / 1000} km
          </button>
        ))}
        <span style={{ margin: '0 4px', color: 'var(--border)' }}>|</span>
        <select className="select" style={{ fontSize: '11px' }} value={filterFormation} onChange={e => setFilterFormation(e.target.value)}>
          <option value="">{t.nearby.allFormations}</option>
          {formations.map(f => <option key={f._id} value={f.name}>{f.name}</option>)}
        </select>
        <select className="select" style={{ fontSize: '11px' }} value={filterIncident} onChange={e => setFilterIncident(e.target.value)}>
          <option value="">{t.nearby.allIncidentTypes}</option>
          {incidentTypes.map(it => <option key={it} value={it}>{it}</option>)}
        </select>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {loading ? t.loading : nearbyData ? `${nearbyData.count} ${t.nearby.wellsFound}` : '—'}
        </span>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        {tab === 'Map View' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: 'calc(100vh - 170px)' }}>
            <div style={{ position: 'relative' }}>
              <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <MapUpdater center={center} />
                <MapClickHandler onMapClick={handleMapClick} />
                <FlyToHighlighted wellId={highlightWellId} nearbyWells={nearbyData?.nearbyWells} />
                {/* Radius circle - centered on clicked location or active well */}
                {clickedLocation
                  ? <Circle center={[clickedLocation.lat, clickedLocation.lng]} radius={radius} pathOptions={{ color: '#ea580c', fillColor: '#ea580c', fillOpacity: 0.06, weight: 2, dashArray: '6 4' }} />
                  : activeWell && <Circle center={[activeWell.latitude, activeWell.longitude]} radius={radius} pathOptions={{ color: '#1565c0', fillColor: '#1565c0', fillOpacity: 0.04, weight: 1, dashArray: '6 4' }} />
                }
                {activeWell && (
                  <Marker position={[activeWell.latitude, activeWell.longitude]} icon={activeIcon}>
                    <Popup><strong>{activeWell.wellName}</strong><br/>Active</Popup>
                  </Marker>
                )}
                {/* Clicked location marker */}
                {clickedLocation && (
                  <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={selectedLocIcon}>
                    <Popup>
                      <strong>📍 Selected Location</strong><br/>
                      {clickedLocation.lat.toFixed(5)}°N, {clickedLocation.lng.toFixed(5)}°E
                    </Popup>
                  </Marker>
                )}
                {nearbyData?.nearbyWells?.map(nw => {
                  const isHighlighted = nw.well._id === highlightWellId;
                  const icon = isHighlighted ? highlightedIcon : (nw.incidentCount > 0 ? incidentIcon : historicalIcon);
                  return (
                    <Marker key={nw.well._id} position={[nw.well.latitude, nw.well.longitude]} icon={icon}
                      eventHandlers={{ click: () => { setSelectedWell(nw); setExpandedIncident(null); setViewingDoc(null); setAnalyzed(false); } }}
                      zIndexOffset={isHighlighted ? 1000 : 0}>
                      <Popup>{isHighlighted && '🎯 '}<strong>{nw.well.wellName}</strong><br/>{nw.distanceKm} km • {nw.incidentCount} {t.wellTable.incidents}</Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Selected location floating panel */}
              {clickedLocation && (
                <div style={{
                  position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.97)', border: '2px solid #ea580c',
                  borderRadius: '8px', padding: '10px 16px', zIndex: 1000,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '12px',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <div style={{ fontSize: '11px' }}>
                    <div style={{ fontWeight: 700, color: '#c2410c' }}>Location Selected</div>
                    <div style={{ color: 'var(--text-muted)' }}>{clickedLocation.lat.toFixed(5)}°N, {clickedLocation.lng.toFixed(5)}°E</div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={scanFromClickedLocation}>
                    🔍 Scan Wells Here ({radius/1000}km)
                  </button>
                  <button className="btn btn-sm btn-saffron" onClick={goToLocationAnalysis}>
                    🎯 Full Analysis
                  </button>
                  <button className="btn btn-sm" onClick={() => { setClickedLocation(null); setNearbyData(null); }} style={{ padding: '3px 6px' }}>✕</button>
                </div>
              )}
            </div>

            {/* ── Right Panel ── */}
            <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-card)', padding: '14px' }}>
              {selectedWell ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: 'var(--primary)' }}>
                    {selectedWell.well.wellName}
                  </div>
                  <table className="data-table" style={{ marginBottom: '12px' }}>
                    <tbody>
                      <tr><td style={{ fontWeight: 700 }}>{t.wellTable.distance}</td><td>{selectedWell.distanceKm} km</td></tr>
                      <tr><td style={{ fontWeight: 700 }}>{t.wellTable.status}</td><td><span className={`badge badge-${selectedWell.well.status}`}>{selectedWell.well.status}</span></td></tr>
                      <tr><td style={{ fontWeight: 700 }}>{t.wellTable.totalDepth}</td><td>{selectedWell.well.totalDepth} m</td></tr>
                      <tr><td style={{ fontWeight: 700 }}>{t.wellTable.incidents}</td><td>{selectedWell.incidentCount}</td></tr>
                    </tbody>
                  </table>

                  {/* Linked Documents */}
                  {wellDocuments.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div className="label" style={{ marginBottom: '6px' }}>📄 Legacy Documents</div>
                      {wellDocuments.map((docData, i) => {
                        const docInfo = docData.document || docData;
                        return (
                          <div key={i} className="evidence-pdf-card" style={{ marginBottom: '6px' }}>
                            <div className="evidence-pdf-header">
                              <span className="pdf-icon">📄</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '11px' }}>{docInfo.originalName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  {docInfo.docType?.replace(/_/g, ' ')} • {docInfo.totalPages || docData.pages?.length || '?'} pages
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                              <button className="btn btn-sm btn-primary" onClick={() => { setViewingDoc(docData); setAnalyzed(false); }}>
                                📖 View Full Document
                              </button>
                              <button className="btn btn-sm btn-saffron" onClick={() => { setViewingDoc(docData); setAnalyzed(true); }}>
                                🔍 Analyze
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {loadingDocs && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Loading documents...</div>}
                    </div>
                  )}

                  {/* Incidents */}
                  {selectedWell.incidents?.length > 0 && (
                    <>
                      <div className="label" style={{ marginBottom: '4px' }}>⚠ Incidents ({selectedWell.incidents.length})</div>
                      {selectedWell.incidents.map((inc, i) => (
                        <div key={i} style={{ marginBottom: '6px' }}>
                          <div
                            style={{
                              padding: '8px 10px', background: 'var(--bg-muted)',
                              border: `1px solid ${expandedIncident === inc._id ? 'var(--primary)' : 'var(--border-light)'}`,
                              borderRadius: '3px', fontSize: '11px', cursor: 'pointer',
                            }}
                            onClick={() => setExpandedIncident(expandedIncident === inc._id ? null : inc._id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong>{inc.incidentType}</strong> — {inc.depth} m
                                <span className={`badge badge-${inc.severity}`} style={{ marginLeft: '6px' }}>{inc.severity}</span>
                              </div>
                              {inc.sourceDocumentId && <span style={{ fontSize: '10px', color: 'var(--primary)' }}>📄 {expandedIncident === inc._id ? '▼' : '▶'}</span>}
                            </div>
                            <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>{inc.description?.substring(0, 120)}...</div>
                          </div>

                          {expandedIncident === inc._id && (
                            <div style={{ marginTop: '4px', animation: 'fadeIn 0.2s ease' }}>
                              {inc.mitigation && (
                                <div style={{ padding: '6px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '3px', marginBottom: '4px', fontSize: '10px' }}>
                                  <strong style={{ color: 'var(--primary)' }}>Mitigation:</strong> {inc.mitigation}
                                </div>
                              )}
                              {inc.lessonLearned && (
                                <div style={{ padding: '6px 10px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '3px', marginBottom: '4px', fontSize: '10px' }}>
                                  <strong style={{ color: '#854d0e' }}>Lesson Learned:</strong> {inc.lessonLearned}
                                </div>
                              )}
                              {inc.sourceDocumentId && (() => {
                                const doc = wellDocuments.find(d => (d.document?._id || d._id) === inc.sourceDocumentId);
                                const docInfo = doc?.document || doc;
                                if (!docInfo) return loadingDocs ? <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Loading PDF...</div> : null;

                                // Find the specific page excerpt
                                const page = doc?.pages?.find(p => p.pageNumber === inc.sourcePage);

                                return (
                                  <div className="evidence-pdf-card" style={{ marginTop: '2px' }}>
                                    <div className="evidence-pdf-header">
                                      <span className="pdf-icon">📄</span>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: '11px' }}>{docInfo.originalName}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Page {inc.sourcePage || '—'} • {docInfo.docType?.replace(/_/g, ' ')}</div>
                                      </div>
                                    </div>
                                    {page && (
                                      <div className="evidence-text" style={{ fontSize: '10px', marginTop: '6px', maxHeight: '100px' }}>
                                        {page.extractedText || page.ocrText || 'No text extracted.'}
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); setAnalyzed(false); }}>
                                        📖 View Full
                                      </button>
                                      <button className="btn btn-sm btn-saffron" onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); setAnalyzed(true); }}>
                                        🔍 Analyze
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/well-intelligence/${selectedWell.well._id}`)}>{t.nearby.viewDetails}</button>
                    <button className="btn btn-sm" onClick={() => navigate('/geological-correlation')}>{t.nearby.correlate}</button>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '30px 10px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
                  <strong>Click a well marker</strong> to view details, incidents, and linked PDF documents.
                  <div style={{ marginTop: '8px', fontSize: '11px' }}>
                    Or <strong>click anywhere on the map</strong> to select a location for analysis.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'List View' && (
          <div style={{ padding: '14px 18px' }}>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                {nearbyData?.nearbyWells?.length === 0 ? (
                  <div className="loading-state">{t.nearby.noWellsInRadius}</div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>{t.wellTable.well}</th><th>{t.wellTable.distance}</th><th>{t.wellTable.depth}</th><th>{t.wellTable.status}</th><th>{t.wellTable.incidents}</th><th>{t.wellTable.field}</th><th>{t.actions}</th></tr></thead>
                    <tbody>
                      {nearbyData?.nearbyWells?.map(nw => (
                        <tr key={nw.well._id}>
                          <td style={{ fontWeight: 600 }}>{nw.well.wellName}</td>
                          <td>{nw.distanceKm} km</td>
                          <td>{nw.well.totalDepth} m</td>
                          <td><span className={`badge badge-${nw.well.status}`}>{nw.well.status}</span></td>
                          <td>{nw.incidentCount}</td>
                          <td>{nw.well.fieldName || '—'}</td>
                          <td><button className="btn btn-sm" onClick={() => navigate(`/well-intelligence/${nw.well._id}`)}>{t.view}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
