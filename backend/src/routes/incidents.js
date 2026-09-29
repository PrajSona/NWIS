const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Well = require('../models/Well');

// GET /api/incidents — All incidents with filters
router.get('/', async (req, res) => {
  try {
    const { wellId, formation, incidentType, severity, minDepth, maxDepth, limit } = req.query;
    const filter = {};

    if (wellId) filter.wellId = wellId;
    if (incidentType) filter.incidentType = incidentType;
    if (severity) filter.severity = severity;
    if (minDepth || maxDepth) {
      filter.depth = {};
      if (minDepth) filter.depth.$gte = parseFloat(minDepth);
      if (maxDepth) filter.depth.$lte = parseFloat(maxDepth);
    }

    let query = Incident.find(filter)
      .populate('wellId', 'wellName status fieldName')
      .populate('formationId', 'name')
      .populate('sourceDocumentId', 'filename originalName')
      .sort({ incidentDate: -1 });

    if (limit) query = query.limit(parseInt(limit));

    const incidents = await query.lean();

    // Filter by formation name if specified (need to filter after populate)
    let result = incidents;
    if (formation) {
      result = incidents.filter(
        i => i.formationId && i.formationId.name === formation
      );
    }

    res.json({ incidents: result, count: result.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/incidents/search?q=stuck pipe in barail
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: true, message: 'Search query required' });
    }

    // Use MongoDB text search
    const incidents = await Incident.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .populate('wellId', 'wellName status fieldName latitude longitude')
      .populate('formationId', 'name')
      .populate('sourceDocumentId', 'filename originalName')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    res.json({ incidents, count: incidents.length, query: q });
  } catch (err) {
    // If text index doesn't work, fall back to regex search
    try {
      const { q } = req.query;
      const regex = new RegExp(q.split(/\s+/).join('|'), 'i');
      const incidents = await Incident.find({
        $or: [
          { incidentType: regex },
          { description: regex },
          { mitigation: regex },
          { lessonLearned: regex },
        ],
      })
        .populate('wellId', 'wellName status fieldName latitude longitude')
        .populate('formationId', 'name')
        .populate('sourceDocumentId', 'filename originalName')
        .limit(20)
        .lean();

      res.json({ incidents, count: incidents.length, query: q, searchType: 'regex_fallback' });
    } catch (fallbackErr) {
      res.status(500).json({ error: true, message: fallbackErr.message });
    }
  }
});

// GET /api/incidents/types — Distinct incident types
router.get('/types', async (req, res) => {
  try {
    const types = await Incident.distinct('incidentType');
    res.json({ types });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/incidents/:id — Single incident
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('wellId')
      .populate('formationId')
      .populate('sourceDocumentId')
      .lean();

    if (!incident) return res.status(404).json({ error: true, message: 'Incident not found' });

    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
