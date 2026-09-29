import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getDocuments, getDocument, uploadDocument } from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

/* ── Keyword highlighter ── */
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

export default function Documents() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('Documents');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetail, setDocDetail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchDocuments(); }, []);

  async function fetchDocuments() {
    setLoading(true);
    try { const res = await getDocuments(); setDocuments(res.data.documents || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const docTypeEl = document.getElementById('docType');
      formData.append('docType', docTypeEl?.value || 'well_completion_report');
      const res = await uploadDocument(formData);
      setUploadResult({ success: true, message: res.data.message });
      fetchDocuments();
      setTab('Documents');
    } catch (err) {
      setUploadResult({ success: false, message: err.response?.data?.message || err.message });
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  async function viewDocument(doc) {
    setSelectedDoc(doc);
    setAnalyzed(false);
    try { const res = await getDocument(doc._id); setDocDetail(res.data); }
    catch (err) { console.error(err); }
  }

  const TABS = [{ key: 'Documents', label: t.docs.documents }, { key: 'Upload', label: t.docs.upload }];

  // ── PDF Viewer (when a document is selected) ──
  if (selectedDoc) {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const pdfUrl = `${apiBase}/documents/${selectedDoc._id}/file`;
    const pages = docDetail?.pages || [];
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
            <button className="btn-back" onClick={() => { setSelectedDoc(null); setDocDetail(null); setAnalyzed(false); }}>
              <BackIcon /> {t.docs.backToList}
            </button>
            <h2>📄 {selectedDoc.originalName}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {selectedDoc.docType?.replace(/_/g, ' ')} • {selectedDoc.totalPages || pages.length} pages • {selectedDoc.dataSource}
            </span>
            <span className={`badge ${selectedDoc.processingStatus === 'completed' ? 'badge-normal' : 'badge-warning'}`}>
              {selectedDoc.processingStatus}
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
              title={selectedDoc.originalName}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>

          {/* Right: Analysis Panel */}
          {analyzed && (
            <div style={{ borderLeft: '2px solid #ea580c', overflowY: 'auto', background: 'var(--bg-card)' }}>
              {/* Summary */}
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

              {/* Document Info */}
              {docDetail && (
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-light)', fontSize: '10px' }}>
                  <div className="label" style={{ marginBottom: '4px' }}>Document Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <div><strong>Size:</strong> {selectedDoc.fileSize ? (selectedDoc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '—'}</div>
                    <div><strong>Events:</strong> {selectedDoc.extractedEvents || 0}</div>
                  </div>

                  {/* Linked incidents */}
                  {docDetail.incidents?.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="label" style={{ marginBottom: '4px' }}>Linked Incidents ({docDetail.incidents.length})</div>
                      {docDetail.incidents.map((inc, i) => (
                        <div key={i} style={{ padding: '4px 8px', background: 'var(--bg-muted)', border: '1px solid var(--border-light)', borderRadius: '3px', marginBottom: '3px', fontSize: '10px' }}>
                          <strong>{inc.incidentType}</strong> — {inc.depth}m
                          <span className={`badge badge-${inc.severity}`} style={{ marginLeft: '4px' }}>{inc.severity}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>{inc.wellId?.wellName || ''} • p.{inc.sourcePage || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

  // ── List View ──
  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>{t.docs.title}</h2>
        </div>
        <span className="data-source-indicator">{t.synthetic}</span>
      </div>

      <div className="tab-bar">
        {TABS.map(tb => <button key={tb.key} className={`tab-item ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>{tb.label}</button>)}
      </div>

      <div className="page-body">
        {tab === 'Documents' && (
          <div className="card">
            <div className="card-header"><h3>{t.docs.allDocuments} ({documents.length})</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? <div className="loading-state">{t.loading}</div> :
              documents.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>{t.docs.noDocuments}</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t.docs.documentName}</th><th>{t.docs.type}</th><th>{t.wellTable.status}</th><th>{t.docs.pages}</th><th>{t.docs.events}</th><th>Source</th><th>{t.docs.date}</th><th>{t.actions}</th></tr></thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc._id}>
                        <td style={{ fontWeight: 600 }}>
                          📄 {doc.originalName}
                          {doc.isSynthetic && <span className="badge badge-synthetic" style={{ marginLeft: '6px', fontSize: '8px', padding: '1px 4px' }}>SYNTH</span>}
                        </td>
                        <td>{doc.docType?.replace(/_/g, ' ')}</td>
                        <td><span className={`badge ${doc.processingStatus === 'completed' ? 'badge-normal' : doc.processingStatus === 'failed' ? 'badge-risk' : 'badge-warning'}`}>{doc.processingStatus}</span></td>
                        <td>{doc.totalPages || '—'}</td>
                        <td>{doc.extractedEvents || 0}</td>
                        <td style={{ fontSize: '10px' }}>{doc.dataSource || '—'}</td>
                        <td>{new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-sm" onClick={() => viewDocument(doc)}>📖 View PDF</button>
                            <button className="btn btn-sm btn-saffron" onClick={() => { viewDocument(doc); setTimeout(() => setAnalyzed(true), 300); }}>🔍</button>
                            <button className="btn btn-sm btn-primary" onClick={() => navigate('/nearby-wells')} title="View on Nearby Map">🗺️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'Upload' && (
          <div className="card" style={{ maxWidth: '500px' }}>
            <div className="card-header"><h3>📤 Upload Legacy Data (PDF)</h3></div>
            <div className="card-body">
              <div className="info-box" style={{ marginBottom: '14px' }}>
                <strong>Legacy Data Storage:</strong> Upload drilling reports, well completion reports, or incident logs as PDF files.
                The system will store them as legacy data and use this knowledge for future AI risk analysis when engineers propose new drilling locations.
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label className="label">Document Type</label>
                <select className="select" style={{ width: '100%', marginBottom: '8px' }} id="docType" defaultValue="well_completion_report">
                  <option value="well_completion_report">Well Completion Report</option>
                  <option value="drilling_report">Drilling Report</option>
                  <option value="mud_report">Mud Engineering Report</option>
                  <option value="geological_report">Geological Report</option>
                  <option value="incident_report">Incident Investigation Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '100%' }}>
                {uploading ? '⏳ Uploading & Storing...' : '📄 Choose PDF File to Store as Legacy Data'}
              </button>
              {uploadResult && (
                <div className={`alert-panel ${uploadResult.success ? '' : 'risk'}`} style={{ marginTop: '12px' }}>
                  {uploadResult.success ? '✅' : '❌'} {uploadResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
