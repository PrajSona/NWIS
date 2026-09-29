import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getIncidents, searchIncidents, getFormations, getIncidentTypes } from '../services/api';
import api from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

/* ── Keyword highlighter for Analyze ── */
const HIGHLIGHT_RULES = [
  { regex: /\b(stuck pipe|differential sticking|pack-off|key seat(?:ing)?|fish(?:ing)?)\b/gi, cls: 'hl-danger', label: 'Risk Event' },
  { regex: /\b(mud loss|lost circulation|LCM|losses|loss zone)\b/gi, cls: 'hl-warning', label: 'Mud Loss' },
  { regex: /\b(kick|overpressure|well control|gas influx|shut.in|kill (?:weight|mud))\b/gi, cls: 'hl-danger', label: 'Well Control' },
  { regex: /\b(torque|RPM|ROP|pump pressure|mud weight|WOB)\b/gi, cls: 'hl-param', label: 'Parameter' },
  { regex: /\b(\d{3,4}\s*m\b|\d{3,4}\s*meters?)\b/gi, cls: 'hl-depth', label: 'Depth' },
  { regex: /\b(\d+\.?\d*\s*PPG|\d+\.?\d*\s*psi|\d+\.?\d*\s*Nm|\d+\.?\d*\s*bbl(?:\/hr)?)\b/gi, cls: 'hl-value', label: 'Value' },
  { regex: /\b(Barail|Tipam|Girujan|Alluvium|Naga|Disang)\b/gi, cls: 'hl-formation', label: 'Formation' },
  { regex: /\b(recommend(?:ation)?s?|lesson(?:s)? learned|mitigation|caution|warning|critical|risk)\b/gi, cls: 'hl-recommend', label: 'Recommendation' },
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

export default function HistoricalEvents() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('Browse');
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formations, setFormations] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [filters, setFilters] = useState({ formation: '', incidentType: '', severity: '' });
  const [totalCount, setTotalCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [viewingPdf, setViewingPdf] = useState(null); // { docId, docName, pages }
  const [analyzed, setAnalyzed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getFormations().then(r => setFormations(r.data.formations || [])).catch(() => {});
    getIncidentTypes().then(r => setIncidentTypes(r.data.types || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchIncidents(); }, [filters]);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const params = {};
      if (filters.formation) params.formation = filters.formation;
      if (filters.incidentType) params.incidentType = filters.incidentType;
      if (filters.severity) params.severity = filters.severity;
      const res = await getIncidents(params);
      setIncidents(res.data.incidents || []);
      setTotalCount(res.data.count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) { fetchIncidents(); return; }
    setLoading(true);
    try {
      const res = await searchIncidents(searchQuery);
      setIncidents(res.data.incidents || []);
      setTotalCount(res.data.count || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function openPdf(docId, docName) {
    try {
      const res = await api.get(`/documents/${docId}`);
      setViewingPdf({ docId, docName, pages: res.data.pages || [], docInfo: res.data.document });
      setAnalyzed(false);
    } catch (err) {
      console.error(err);
      // Fallback: just open the PDF directly
      setViewingPdf({ docId, docName, pages: [], docInfo: null });
      setAnalyzed(false);
    }
  }

  const TABS = [{ key: 'Browse', label: t.events.browse }, { key: 'Search', label: t.events.search }];

  // ── PDF Viewer Overlay ──
  if (viewingPdf) {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const pdfUrl = `${apiBase}/documents/${viewingPdf.docId}/file`;
    const pages = viewingPdf.pages;
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
            <button className="btn-back" onClick={() => { setViewingPdf(null); setAnalyzed(false); }}>
              <BackIcon /> Back to Events
            </button>
            <h2>📄 {viewingPdf.docName}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {viewingPdf.docInfo && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {viewingPdf.docInfo.docType?.replace(/_/g, ' ')} • {viewingPdf.docInfo.totalPages || pages.length} pages
              </span>
            )}
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
              title={viewingPdf.docName}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>

          {/* Right: Analysis Panel */}
          {analyzed && (
            <div style={{ borderLeft: '2px solid #ea580c', overflowY: 'auto', background: 'var(--bg-card)' }}>
              {Object.keys(totalStats).length > 0 && (
                <div style={{ padding: '10px 14px', background: '#fefce8', borderBottom: '1px solid #fde047' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#854d0e', marginBottom: '6px' }}>🔍 Analysis Summary</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {Object.entries(totalStats).map(([label, count]) => (
                      <span key={label} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                        background: label === 'Risk Event' || label === 'Well Control' ? '#fee2e2' :
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
          <h2>{t.events.title}</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalCount} {t.events.records}</span>
        </div>
        <span className="data-source-indicator">{t.synthetic}</span>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => <button key={tb.key} className={`tab-item ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>{tb.label}</button>)}
      </div>

      {tab === 'Browse' && (
        <div className="subtab-bar" style={{ padding: '6px 18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{t.events.filter}:</span>
          <select className="select" style={{ fontSize: '11px' }} value={filters.formation} onChange={e => setFilters(f => ({ ...f, formation: e.target.value }))}>
            <option value="">{t.events.allFormations}</option>
            {formations.map(f => <option key={f._id} value={f.name}>{f.name}</option>)}
          </select>
          <select className="select" style={{ fontSize: '11px' }} value={filters.incidentType} onChange={e => setFilters(f => ({ ...f, incidentType: e.target.value }))}>
            <option value="">{t.events.allTypes}</option>
            {incidentTypes.map(it => <option key={it} value={it}>{it}</option>)}
          </select>
          <select className="select" style={{ fontSize: '11px' }} value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
            <option value="">{t.events.allSeverities}</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button className="btn btn-sm" onClick={() => setFilters({ formation: '', incidentType: '', severity: '' })}>{t.clear}</button>
        </div>
      )}

      {tab === 'Search' && (
        <div style={{ padding: '10px 18px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input className="input" style={{ flex: 1 }} placeholder={t.events.searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button type="submit" className="btn btn-primary btn-sm">{t.search}</button>
            <button type="button" className="btn btn-sm" onClick={() => { setSearchQuery(''); fetchIncidents(); }}>{t.clear}</button>
          </form>
        </div>
      )}

      <div className="page-body">
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-state">{t.loading}</div>
            ) : incidents.length === 0 ? (
              <div className="loading-state">{t.events.noIncidentsFound}</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}></th>
                    <th>{t.wellTable.well}</th>
                    <th>{t.wellTable.type}</th>
                    <th>{t.wellTable.formation}</th>
                    <th>{t.wellTable.depth}</th>
                    <th>{t.wellTable.severity}</th>
                    <th>{t.wellTable.description}</th>
                    <th>{t.wellTable.source}</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc, i) => {
                    const isExpanded = expandedId === (inc._id || i);
                    const hasDoc = inc.sourceDocumentId && inc.sourceDocumentId._id;
                    return (
                      <>
                        <tr
                          key={inc._id || i}
                          style={{ cursor: 'pointer', background: isExpanded ? 'var(--bg-muted)' : undefined }}
                          onClick={() => setExpandedId(isExpanded ? null : (inc._id || i))}
                        >
                          <td style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{inc.wellId?.wellName || '—'}</td>
                          <td style={{ fontWeight: 500 }}>{inc.incidentType}</td>
                          <td>{inc.formationId?.name || '—'}</td>
                          <td>{inc.depth} m</td>
                          <td><span className={`badge badge-${inc.severity}`}>{inc.severity}</span></td>
                          <td style={{ maxWidth: '250px', fontSize: '11px' }}>
                            {inc.description?.substring(0, 100)}{inc.description?.length > 100 ? '...' : ''}
                          </td>
                          <td style={{ fontSize: '10px' }}>
                            {hasDoc ? (
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>📄 p.{inc.sourcePage || '—'}</span>
                            ) : '—'}
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr key={`${inc._id || i}-detail`}>
                            <td colSpan="8" style={{ padding: 0, border: 'none' }}>
                              <div style={{ padding: '12px 18px', background: 'var(--bg-muted)', borderTop: '1px solid var(--border-light)', borderBottom: '2px solid var(--border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: hasDoc ? '1fr 1fr 280px' : '1fr 1fr', gap: '12px' }}>
                                  {/* Description */}
                                  <div>
                                    <div className="label" style={{ marginBottom: '4px' }}>Full Description</div>
                                    <div style={{ fontSize: '11px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                      {inc.description}
                                    </div>
                                    {inc.mudWeight && (
                                      <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        {inc.mudWeight && <span><strong>Mud:</strong> {inc.mudWeight} PPG</span>}
                                        {inc.torque && <span><strong>Torque:</strong> {inc.torque} Nm</span>}
                                        {inc.pumpPressure && <span><strong>Pump:</strong> {inc.pumpPressure} psi</span>}
                                        {inc.rpm != null && <span><strong>RPM:</strong> {inc.rpm}</span>}
                                        {inc.rop != null && <span><strong>ROP:</strong> {inc.rop} m/hr</span>}
                                      </div>
                                    )}
                                  </div>

                                  {/* Mitigation & Lessons */}
                                  <div>
                                    {inc.mitigation && (
                                      <div style={{ padding: '8px 10px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '3px', marginBottom: '6px', fontSize: '10px' }}>
                                        <strong style={{ color: 'var(--primary)' }}>Mitigation:</strong> {inc.mitigation}
                                      </div>
                                    )}
                                    {inc.lessonLearned && (
                                      <div style={{ padding: '8px 10px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '3px', fontSize: '10px' }}>
                                        <strong style={{ color: '#854d0e' }}>Lesson Learned:</strong> {inc.lessonLearned}
                                      </div>
                                    )}
                                  </div>

                                  {/* Source PDF */}
                                  {hasDoc && (
                                    <div>
                                      <div className="label" style={{ marginBottom: '4px' }}>📄 Source Document</div>
                                      <div className="evidence-pdf-card">
                                        <div className="evidence-pdf-header">
                                          <span className="pdf-icon">📄</span>
                                          <div>
                                            <div style={{ fontWeight: 700, fontSize: '11px' }}>{inc.sourceDocumentId.originalName}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                              Page {inc.sourcePage || '—'}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                          <button
                                            className="btn btn-sm btn-primary"
                                            onClick={(e) => { e.stopPropagation(); openPdf(inc.sourceDocumentId._id, inc.sourceDocumentId.originalName); }}
                                          >
                                            📖 View Full PDF
                                          </button>
                                          <button
                                            className="btn btn-sm btn-saffron"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPdf(inc.sourceDocumentId._id, inc.sourceDocumentId.originalName).then(() => setAnalyzed(true));
                                            }}
                                          >
                                            🔍 Analyze
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                                  {inc.wellId?._id && (
                                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/well-intelligence/${inc.wellId._id}`); }}>
                                      View Well →
                                    </button>
                                  )}
                                  <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); navigate('/nearby-wells', { state: { highlightWellId: inc.wellId?._id } }); }}>
                                    🗺️ View on Map
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
