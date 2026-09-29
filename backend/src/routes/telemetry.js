const express = require('express');
const router = express.Router();

// GET /api/telemetry/status
router.get('/status', (req, res) => {
  const sim = req.app.get('telemetrySim');
  res.json(sim.getStatus());
});

// GET /api/telemetry/current
router.get('/current', (req, res) => {
  const sim = req.app.get('telemetrySim');
  res.json(sim.getCurrentData());
});

// POST /api/telemetry/start
router.post('/start', (req, res) => {
  const sim = req.app.get('telemetrySim');
  sim.start();
  res.json({ message: 'Telemetry simulator started', status: sim.getStatus() });
});

// POST /api/telemetry/stop
router.post('/stop', (req, res) => {
  const sim = req.app.get('telemetrySim');
  sim.stop();
  res.json({ message: 'Telemetry simulator stopped', status: sim.getStatus() });
});

// POST /api/telemetry/reset
router.post('/reset', (req, res) => {
  const sim = req.app.get('telemetrySim');
  const startDepth = req.body.startDepth || 2980;
  sim.reset({ startDepth });
  res.json({ message: 'Telemetry simulator reset', status: sim.getStatus() });
});

module.exports = router;
