import axios from 'axios';

// In production, VITE_API_URL points to the Render backend (e.g., https://nwis-backend.onrender.com/api)
// In development, Vite proxy handles /api → localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── WELLS ──────────────────────────────────────────────────
export const getWells = (params) => api.get('/wells', { params });
export const getWell = (id) => api.get(`/wells/${id}`);
export const getNearbyWells = (id, params) => api.get(`/wells/${id}/nearby`, { params });
export const getWellIncidents = (id) => api.get(`/wells/${id}/incidents`);

// ── INCIDENTS ──────────────────────────────────────────────
export const getIncidents = (params) => api.get('/incidents', { params });
export const searchIncidents = (q) => api.get('/incidents/search', { params: { q } });
export const getIncidentTypes = () => api.get('/incidents/types');
export const getIncident = (id) => api.get(`/incidents/${id}`);

// ── FORMATIONS ─────────────────────────────────────────────
export const getFormations = () => api.get('/formations');

// ── DOCUMENTS ──────────────────────────────────────────────
export const getDocuments = () => api.get('/documents');
export const getDocument = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (formData) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });

// ── CORRELATION ────────────────────────────────────────────
export const runCorrelation = (data) => api.post('/correlation', data);
export const getCorrelationWeights = () => api.get('/correlation/weights');

// ── TELEMETRY ──────────────────────────────────────────────
export const getTelemetryStatus = () => api.get('/telemetry/status');
export const getTelemetryCurrent = () => api.get('/telemetry/current');
export const startTelemetry = () => api.post('/telemetry/start');
export const stopTelemetry = () => api.post('/telemetry/stop');
export const resetTelemetry = (data) => api.post('/telemetry/reset', data);

// ── ALERTS ─────────────────────────────────────────────────
export const getAlerts = (params) => api.get('/alerts', { params });
export const getAlert = (id) => api.get(`/alerts/${id}`);
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);

// ── HEALTH ─────────────────────────────────────────────────
export const getHealth = () => api.get('/health');

export default api;
