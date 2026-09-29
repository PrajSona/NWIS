const express = require('express');
const router = express.Router();
const { RiskEngine } = require('../risk-engine/engine');
const Well = require('../models/Well');
const WellFormation = require('../models/WellFormation');
const Incident = require('../models/Incident');
const { calculateDistanceMeters } = require('../risk-engine/engine');

// POST /api/correlation — Run correlation between active well and nearby wells
router.post('/', async (req, res) => {
  try {
    const { wellId, targetWellId, currentDepth, radius = 5000 } = req.body;

    if (!wellId) {
      return res.status(400).json({ error: true, message: 'wellId is required' });
    }

    const activeWell = await Well.findById(wellId);
    if (!activeWell) {
      return res.status(404).json({ error: true, message: 'Active well not found' });
    }

    const depth = currentDepth || activeWell.currentDepth || activeWell.totalDepth;

    // Get active well's current formation
    const activeFormations = await WellFormation.find({ wellId })
      .populate('formationId')
      .lean();

    let currentFormation = null;
    for (const wf of activeFormations) {
      if (depth >= wf.topDepth && depth <= wf.bottomDepth) {
        currentFormation = wf.formationId;
        break;
      }
    }

    // If targetWellId specified, correlate with just that well
    if (targetWellId) {
      const targetWell = await Well.findById(targetWellId);
      if (!targetWell) {
        return res.status(404).json({ error: true, message: 'Target well not found' });
      }

      const distance = calculateDistanceMeters(
        activeWell.latitude, activeWell.longitude,
        targetWell.latitude, targetWell.longitude
      );

      const targetFormations = await WellFormation.find({ wellId: targetWellId })
        .populate('formationId')
        .sort({ topDepth: 1 })
        .lean();

      const targetIncidents = await Incident.find({ wellId: targetWellId })
        .populate('formationId')
        .lean();

      const correlations = [];
      for (const incident of targetIncidents) {
        const relevance = RiskEngine.calculateRelevance({
          activeFormation: currentFormation ? currentFormation.name : null,
          activeDepth: depth,
          distance,
          historicalFormation: incident.formationId ? incident.formationId.name : null,
          historicalDepth: incident.depth || 0,
          incidentType: incident.incidentType,
          incidentCount: targetIncidents.filter(i => i.incidentType === incident.incidentType).length,
        });

        correlations.push({
          incident,
          relevance,
        });
      }

      correlations.sort((a, b) => b.relevance.totalScore - a.relevance.totalScore);

      return res.json({
        activeWell: {
          ...activeWell.toObject(),
          currentFormation: currentFormation ? currentFormation.name : null,
          currentDepth: depth,
          formations: activeFormations.map(wf => ({
            formation: wf.formationId,
            topDepth: wf.topDepth,
            bottomDepth: wf.bottomDepth,
          })),
        },
        targetWell: {
          ...targetWell.toObject(),
          distance: Math.round(distance),
          distanceKm: Math.round(distance / 100) / 10,
          formations: targetFormations.map(wf => ({
            formation: wf.formationId,
            topDepth: wf.topDepth,
            bottomDepth: wf.bottomDepth,
          })),
        },
        correlations,
        weights: RiskEngine.getWeights(),
      });
    }

    // Full risk evaluation against all nearby wells
    const assessment = await RiskEngine.evaluateRisk({
      wellId,
      currentDepth: depth,
      currentTelemetry: req.body.currentTelemetry || {},
      radius,
    });

    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/correlation/weights — Get current correlation weights
router.get('/weights', (req, res) => {
  res.json({
    weights: RiskEngine.getWeights(),
    thresholds: RiskEngine.getThresholds(),
    note: 'These are prototype correlation parameters — not official safety thresholds.',
  });
});

module.exports = router;
