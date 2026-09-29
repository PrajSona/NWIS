import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { startTelemetry, stopTelemetry, resetTelemetry } from '../services/api';

const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;

const PARAM_CONFIG = [
  { key: 'depth', unit: 'm', color: '#1d4ed8', inverted: true },
  { key: 'torque', unit: 'Nm', color: '#16a34a' },
  { key: 'rpm', unit: '', color: '#7c3aed' },
  { key: 'pumpPressure', unit: 'psi', color: '#ea580c' },
  { key: 'mudWeight', unit: 'PPG', color: '#b91c1c' },
  { key: 'rop', unit: 'm/hr', color: '#0d9488' },
];

function TelemetryChart({ data, paramKey, color, unit, label, inverted }) {
  const values = data.map(d => d[paramKey] ?? 0);
  const labels = data.map((_, i) => i);

  const option = {
    animation: false,
    grid: { top: 8, right: 8, bottom: 22, left: 48 },
    xAxis: {
      type: 'category', data: labels, show: false,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value', inverse: inverted || false,
      axisLabel: { fontSize: 9, color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      splitNumber: 4,
    },
    series: [{
      type: 'line', data: values, smooth: true, showSymbol: false,
      lineStyle: { width: 2, color },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '30' },
            { offset: 1, color: color + '05' },
          ],
        },
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: color,
      borderWidth: 1,
      padding: [6, 10],
      textStyle: { fontSize: 11, color: '#f1f5f9' },
      formatter: (params) => {
        const v = params[0]?.value;
        return v != null ? `<span style="color:${color};font-weight:700">${label}</span><br/>${v.toFixed(2)} ${unit}` : '';
      },
    },
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '140px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={false}
    />
  );
}


export default function LiveDrilling() {
  const { telemetry, telemetryHistory, telemetryStatus, riskAlerts, setTelemetryHistory, activeWell } = useApp();
  const { t } = useLanguage();
  const [tab, setTab] = useState('Gauges');
  const [simRunning, setSimRunning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state; // from LocationSelector

  useEffect(() => { setSimRunning(telemetryStatus.running); }, [telemetryStatus.running]);

  const handleStart = async () => { try { await startTelemetry(); setSimRunning(true); } catch (e) { console.error(e); } };
  const handleStop = async () => { try { await stopTelemetry(); setSimRunning(false); } catch (e) { console.error(e); } };
  const handleReset = async () => {
    try {
      await resetTelemetry({ startDepth: 2980 });
      setSimRunning(false);
      setTelemetryHistory([]);
    } catch (e) { console.error(e); }
  };

  const state = telemetryStatus.state;
  const stateClass = state === 'NORMAL' ? 'normal' : state === 'WARNING' ? 'warning' : 'risk';
  const latestAlerts = riskAlerts.filter(a => a.assessment || a.riskFactor).slice(0, 10);

  const PARAM_LABELS = {
    depth: t.live.depth, torque: t.live.torque, rpm: t.live.rpm,
    pumpPressure: t.live.pumpPressure, mudWeight: t.live.mudWeight, rop: t.live.rop,
  };

  const TABS = [t.live.gauges, t.live.charts, t.live.alerts];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-back" onClick={() => navigate('/')}><BackIcon /> {t.back}</button>
          <h2>{t.live.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="data-source-indicator">{t.simulatedTelemetry}</span>
          <span className={`badge badge-${stateClass}`}>{simRunning ? state : t.live.stopped}</span>
          {!simRunning
            ? <button className="btn btn-sm btn-saffron" onClick={handleStart}>{t.live.startSimulation}</button>
            : <button className="btn btn-sm btn-danger" onClick={handleStop}>{t.live.stop}</button>
          }
          <button className="btn btn-sm" onClick={handleReset}>{t.live.reset}</button>
        </div>
      </div>

      {/* Active well info bar */}
      <div style={{ padding: '6px 18px', background: '#f1f5f9', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
          <span style={{ fontSize: '16px' }}>⛽</span>
          <div>
            <strong style={{ color: '#1e3a5f' }}>Well: {activeWell?.wellName || '—'}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>
              {activeWell?.fieldName || ''} • {activeWell?.wellType || ''} •
              {activeWell?.latitude?.toFixed(4)}°N, {activeWell?.longitude?.toFixed(4)}°E •
              Target: {activeWell?.totalDepth || '—'}m
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-primary" onClick={() => navigate('/nearby-wells', { state: { highlightWellId: activeWell?._id } })}>🗺️ View on Map</button>
          {activeWell && <button className="btn btn-sm" onClick={() => navigate(`/well-intelligence/${activeWell._id}`)}>📋 Well Intel</button>}
          <button className="btn btn-sm" onClick={() => navigate('/geo-correlation')}>📊 Correlate</button>
        </div>
      </div>

      {/* Context banner when navigated from location selector */}
      {locationState?.proposedLocation && (
        <div style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', borderBottom: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <span style={{ fontSize: '16px' }}>🎯</span>
            <div>
              <strong style={{ color: '#9a3412' }}>Simulating at Proposed Location</strong>
              <span style={{ color: '#78350f', marginLeft: '8px' }}>
                ({locationState.proposedLocation.lat?.toFixed(4)}°N, {locationState.proposedLocation.lng?.toFixed(4)}°E)
                • Target Depth: {locationState.proposedDepth}m
                {locationState.riskLevel && <> • AI Risk: <span className={`badge badge-${locationState.riskLevel === 'CRITICAL' || locationState.riskLevel === 'HIGH' ? 'high' : locationState.riskLevel === 'MODERATE' ? 'medium' : 'low'}`}>{locationState.riskLevel}</span></>}
                {locationState.primaryRisk && <> — {locationState.primaryRisk}</>}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        {TABS.map((tabLabel, i) => (
          <button key={i} className={`tab-item ${tab === ['Gauges','Charts','Alerts'][i] ? 'active' : ''}`}
            onClick={() => setTab(['Gauges','Charts','Alerts'][i])}>
            {tabLabel} {i === 2 && latestAlerts.length > 0 ? `(${latestAlerts.length})` : ''}
          </button>
        ))}
      </div>

      <div className="page-body">
        {/* ─── Gauges ─── */}
        {tab === 'Gauges' && (
          <>
            {latestAlerts.length > 0 && (
              <div className="alert-panel risk" style={{ marginBottom: '10px' }}>
                <div className="alert-title">⚠ {latestAlerts[0].type ? `Potential ${latestAlerts[0].type} Risk` : 'Risk Detected'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Depth: {latestAlerts[0].depth?.toFixed(0)}m · Formation: {latestAlerts[0].formation || '—'} · Risk Factor: {latestAlerts[0].riskFactor}
                </div>
                <button className="btn btn-sm" style={{ marginTop: '6px' }} onClick={() => navigate('/evidence')}>{t.live.viewEvidence}</button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {PARAM_CONFIG.map(p => (
                <div className="card" key={p.key}>
                  <div className="card-body" style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <div className="metric-label">{PARAM_LABELS[p.key]}</div>
                    <div className={`metric-value telemetry-value ${stateClass}`} style={{ fontSize: '22px', margin: '4px 0 2px' }}>
                      {telemetry ? (telemetry[p.key]?.toFixed(p.key === 'mudWeight' ? 2 : 1) || '—') : '—'}
                    </div>
                    <div className="metric-unit">{p.unit}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini sparklines below gauges */}
            {telemetryHistory.length > 5 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                {PARAM_CONFIG.slice(0, 3).map(p => (
                  <div className="card" key={p.key}>
                    <div className="card-header">
                      <h3>{PARAM_LABELS[p.key]} ({p.unit})</h3>
                      <span style={{ fontSize: '9px', color: 'var(--text-light)' }}>{telemetryHistory.length} pts</span>
                    </div>
                    <div className="card-body" style={{ padding: '2px' }}>
                      <TelemetryChart data={telemetryHistory} paramKey={p.key} color={p.color}
                        unit={p.unit} label={PARAM_LABELS[p.key]} inverted={p.inverted} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="info-box" style={{ marginTop: '10px' }}>
              <strong>{t.live.howItWorks}</strong> {t.live.howItWorksDesc}
            </div>
          </>
        )}

        {/* ─── Charts ─── */}
        {tab === 'Charts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PARAM_CONFIG.map(p => (
              <div className="card" key={p.key}>
                <div className="card-header">
                  <h3>{PARAM_LABELS[p.key]} {p.unit && `(${p.unit})`}</h3>
                  <span style={{ fontSize: '9px', color: 'var(--text-light)' }}>{telemetryHistory.length} {t.live.samples}</span>
                </div>
                <div className="card-body" style={{ padding: '2px' }}>
                  <TelemetryChart data={telemetryHistory} paramKey={p.key} color={p.color}
                    unit={p.unit} label={PARAM_LABELS[p.key]} inverted={p.inverted} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Alerts ─── */}
        {tab === 'Alerts' && (
          <div className="card">
            <div className="card-header">
              <h3>{t.live.riskAlertsDuring}</h3>
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/evidence')}>{t.dashboard.openEvidenceViewer}</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {latestAlerts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  {t.live.noRiskAlerts}
                </div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t.wellTable.type}</th><th>{t.wellTable.level}</th><th>{t.wellTable.depth}</th><th>{t.wellTable.formation}</th><th>{t.wellTable.time}</th></tr></thead>
                  <tbody>
                    {latestAlerts.map((a, i) => (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate('/evidence')}>
                        <td style={{ fontWeight: 600 }}>{a.type || a.assessment?.primaryRiskType || 'Risk'}</td>
                        <td><span className={`badge badge-${a.state === 'RISK' ? 'risk' : 'warning'}`}>{a.state || 'RISK'}</span></td>
                        <td>{a.depth?.toFixed(0)} m</td>
                        <td>{a.formation || '—'}</td>
                        <td>{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '—'}</td>
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
