const express = require('express');
const router = express.Router();
const RiskAlert = require('../models/RiskAlert');

// GET /api/alerts — Recent risk alerts
router.get('/', async (req, res) => {
  try {
    const { wellId, riskLevel, limit = 20 } = req.query;
    const filter = {};
    if (wellId) filter.wellId = wellId;
    if (riskLevel) filter.riskLevel = riskLevel;

    const alerts = await RiskAlert.find(filter)
      .populate('wellId', 'wellName status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const alert = await RiskAlert.findById(req.params.id)
      .populate('wellId')
      .lean();

    if (!alert) return res.status(404).json({ error: true, message: 'Alert not found' });
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await RiskAlert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true, acknowledgedAt: new Date() },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: true, message: 'Alert not found' });
    res.json({ alert, message: 'Alert acknowledged' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
