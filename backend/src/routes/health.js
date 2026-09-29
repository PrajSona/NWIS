const express = require('express');
const router = express.Router();
const { getConnectionStatus } = require('../db');

// GET /api/health — Service health status
router.get('/', async (req, res) => {
  const mongoStatus = getConnectionStatus();

  // Check Ollama
  let ollamaStatus = { connected: false, error: null };
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      const data = await response.json();
      ollamaStatus = { connected: true, models: data.models?.length || 0 };
    }
  } catch (err) {
    ollamaStatus = { connected: false, error: 'Not running' };
  }

  // Check Qdrant
  let qdrantStatus = { connected: false, error: null };
  const qdrantUrl = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
  try {
    const response = await fetch(`${qdrantUrl}/collections`, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      qdrantStatus = { connected: true };
    }
  } catch (err) {
    qdrantStatus = { connected: false, error: 'Not running' };
  }

  // Check Python service
  let pythonStatus = { connected: false, error: null };
  const pythonUrl = process.env.PYTHON_SERVICE_URL;
  if (pythonUrl) {
    try {
      const response = await fetch(`${pythonUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        pythonStatus = { connected: true };
      }
    } catch (err) {
      pythonStatus = { connected: false, error: 'Not running' };
    }
  } else {
    pythonStatus = { connected: false, error: 'Not configured' };
  }

  res.json({
    status: mongoStatus.connected ? 'operational' : 'degraded',
    services: {
      mongodb: {
        connected: mongoStatus.connected,
        host: mongoStatus.host,
        database: mongoStatus.name,
      },
      ollama: ollamaStatus,
      qdrant: qdrantStatus,
      pythonService: pythonStatus,
      backend: { connected: true, uptime: process.uptime() },
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
