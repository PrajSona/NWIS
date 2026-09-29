const express = require('express');
const router = express.Router();
const Well = require('../models/Well');
const WellFormation = require('../models/WellFormation');
const Incident = require('../models/Incident');
const Document = require('../models/Document');
const DocumentPage = require('../models/DocumentPage');
const { RiskEngine, calculateDistanceMeters } = require('../risk-engine/engine');

// GET /api/wells — List all wells
router.get('/', async (req, res) => {
  try {
    const { status, wellType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (wellType) filter.wellType = wellType;

    const wells = await Well.find(filter).sort({ status: 1, wellName: 1 }).lean();
    res.json({ wells, count: wells.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// GET /api/wells/nearby-location — Find wells near arbitrary lat/lng
// This is the core of the new workflow: engineer clicks on map
// ══════════════════════════════════════════════════════════════
router.get('/nearby-location', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseInt(req.query.radius) || 5000;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: true, message: 'lat and lng are required' });
    }

    // Find all wells within radius of the proposed location
    const nearbyWells = await Well.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    }).lean();

    // Enrich with incidents and distance
    const results = [];
    let totalIncidents = 0;
    let highSeverityCount = 0;
    const incidentBreakdown = {};

    for (const nw of nearbyWells) {
      const distance = calculateDistanceMeters(lat, lng, nw.latitude, nw.longitude);

      const incidents = await Incident.find({ wellId: nw._id })
        .populate('formationId')
        .sort({ depth: 1 })
        .lean();

      totalIncidents += incidents.length;
      for (const inc of incidents) {
        if (inc.severity === 'high' || inc.severity === 'critical') highSeverityCount++;
        incidentBreakdown[inc.incidentType] = (incidentBreakdown[inc.incidentType] || 0) + 1;
      }

      results.push({
        well: nw,
        distance: Math.round(distance),
        distanceKm: Math.round(distance / 100) / 10,
        incidents,
        incidentCount: incidents.length,
      });
    }

    results.sort((a, b) => a.distance - b.distance);

    res.json({
      proposedLocation: { lat, lng },
      radius,
      nearbyWells: results,
      count: results.length,
      totalIncidents,
      highSeverityCount,
      incidentBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/wells/analyze-location — AI Risk Analysis
// Runs the risk engine for a proposed location, gathers
// supporting PDF evidence from legacy documents
// ══════════════════════════════════════════════════════════════
router.post('/analyze-location', async (req, res) => {
  try {
    const { lat, lng, proposedDepth = 3000, radius = 5000 } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: true, message: 'lat and lng are required' });
    }

    // 1. Find nearby wells
    const nearbyWells = await Well.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius,
        },
      },
    }).lean();

    if (nearbyWells.length === 0) {
      return res.json({
        riskLevel: 'LOW',
        adjustedScore: 0,
        primaryRiskType: null,
        description: 'No nearby historical wells found within search radius. Insufficient data for risk assessment.',
        reasons: ['No historical wells found within the specified radius.'],
        correlatedIncidents: [],
        correlatedWells: [],
        supportingDocuments: [],
      });
    }

    // 2. Get all incidents for nearby wells
    const nearbyWellIds = nearbyWells.map(w => w._id);
    const allIncidents = await Incident.find({
      wellId: { $in: nearbyWellIds },
    }).populate('formationId').lean();

    // 3. Determine formations at proposed depth from nearby wells
    const nearbyFormations = await WellFormation.find({
      wellId: { $in: nearbyWellIds },
      topDepth: { $lte: proposedDepth },
      bottomDepth: { $gte: proposedDepth },
    }).populate('formationId').lean();

    const likelyFormation = nearbyFormations.length > 0
      ? nearbyFormations[0].formationId
      : null;

    // 4. Calculate relevance for each incident
    const correlations = [];
    const riskTypeScores = {};
    const corroboratingWells = {};

    for (const incident of allIncidents) {
      const well = nearbyWells.find(w => w._id.toString() === incident.wellId.toString());
      if (!well) continue;

      const distance = calculateDistanceMeters(lat, lng, well.latitude, well.longitude);

      const sameTypeCount = allIncidents.filter(
        i => i.wellId.toString() === well._id.toString() &&
             i.incidentType === incident.incidentType
      ).length;

      const relevance = RiskEngine.calculateRelevance({
        activeFormation: likelyFormation ? likelyFormation.name : null,
        activeDepth: proposedDepth,
        distance,
        historicalFormation: incident.formationId ? incident.formationId.name : null,
        historicalDepth: incident.depth || 0,
        incidentType: incident.incidentType,
        incidentCount: sameTypeCount,
      });

      if (relevance.totalScore >= 0.2) {
        correlations.push({
          well: { _id: well._id, wellName: well.wellName, distance: Math.round(distance), totalDepth: well.totalDepth },
          incident: {
            _id: incident._id,
            incidentType: incident.incidentType,
            depth: incident.depth,
            severity: incident.severity,
            description: incident.description,
            mitigation: incident.mitigation,
            lessonLearned: incident.lessonLearned,
            formation: incident.formationId ? incident.formationId.name : null,
            sourceDocumentId: incident.sourceDocumentId,
            sourcePage: incident.sourcePage,
          },
          relevance,
        });

        const type = incident.incidentType;
        if (!riskTypeScores[type]) riskTypeScores[type] = 0;
        riskTypeScores[type] = Math.max(riskTypeScores[type], relevance.totalScore);

        if (!corroboratingWells[type]) corroboratingWells[type] = new Set();
        corroboratingWells[type].add(well._id.toString());
      }
    }

    correlations.sort((a, b) => b.relevance.totalScore - a.relevance.totalScore);

    // 5. Determine risk level
    let maxScore = 0;
    let primaryRiskType = null;
    for (const [type, score] of Object.entries(riskTypeScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryRiskType = type;
      }
    }

    let adjustedScore = maxScore;
    if (primaryRiskType && corroboratingWells[primaryRiskType]) {
      const wellCount = corroboratingWells[primaryRiskType].size;
      if (wellCount >= 3) adjustedScore = Math.min(1, adjustedScore * 1.2);
      else if (wellCount >= 2) adjustedScore = Math.min(1, adjustedScore * 1.1);
    }

    let riskLevel = 'LOW';
    if (adjustedScore >= 0.85) riskLevel = 'CRITICAL';
    else if (adjustedScore >= 0.7) riskLevel = 'HIGH';
    else if (adjustedScore >= 0.5) riskLevel = 'MODERATE';

    // 6. Build reasoning
    const reasons = [];
    if (primaryRiskType && riskLevel !== 'LOW') {
      const wellCount = corroboratingWells[primaryRiskType]?.size || 0;
      reasons.push(`${wellCount} nearby historical well(s) experienced ${primaryRiskType.toLowerCase()} events.`);
      if (likelyFormation) {
        reasons.push(`Proposed depth (${proposedDepth}m) falls within the ${likelyFormation.name} formation, which has historical incidents.`);
      }
      const relevantCorr = correlations.filter(c => c.incident.incidentType === primaryRiskType);
      if (relevantCorr.length > 0) {
        const avgDepth = relevantCorr.reduce((sum, c) => sum + (c.incident.depth || 0), 0) / relevantCorr.length;
        reasons.push(`Historical ${primaryRiskType.toLowerCase()} events occurred at average depth of ${Math.round(avgDepth)}m (proposed: ${proposedDepth}m).`);
      }
      // Add mitigation advice from historical incidents
      const bestCorrelation = correlations.find(c => c.incident.incidentType === primaryRiskType && c.incident.lessonLearned);
      if (bestCorrelation) {
        reasons.push(`Lesson learned from ${bestCorrelation.well.wellName}: "${bestCorrelation.incident.lessonLearned}"`);
      }
    } else {
      reasons.push('No significant historical risk patterns detected at the proposed depth.');
      reasons.push(`${nearbyWells.length} well(s) analyzed within ${radius / 1000}km radius.`);
    }

    // 7. Gather supporting PDF evidence from legacy documents
    const supportingDocuments = [];
    const seenDocIds = new Set();

    for (const corr of correlations.slice(0, 8)) {
      if (corr.incident.sourceDocumentId && !seenDocIds.has(corr.incident.sourceDocumentId.toString())) {
        seenDocIds.add(corr.incident.sourceDocumentId.toString());
        try {
          const doc = await Document.findById(corr.incident.sourceDocumentId).lean();
          if (doc) {
            let excerpt = null;
            if (corr.incident.sourcePage) {
              const page = await DocumentPage.findOne({
                documentId: doc._id,
                pageNumber: corr.incident.sourcePage,
              }).lean();
              if (page) {
                excerpt = page.extractedText || page.ocrText || null;
              }
            }

            supportingDocuments.push({
              documentId: doc._id,
              documentName: doc.originalName,
              docType: doc.docType,
              relevantPage: corr.incident.sourcePage,
              excerpt,
              incidentType: corr.incident.incidentType,
              depth: corr.incident.depth,
              severity: corr.incident.severity,
              wellName: corr.well.wellName,
              relevanceScore: corr.relevance.totalScore,
            });
          }
        } catch { /* skip */ }
      }
    }

    // 8. Build description
    let description = '';
    if (primaryRiskType && riskLevel !== 'LOW') {
      const wellCount = corroboratingWells[primaryRiskType]?.size || 0;
      description = `⚠ Potential ${primaryRiskType} Risk — ${wellCount} nearby well(s) experienced ${primaryRiskType.toLowerCase()} at comparable depth in ${likelyFormation ? likelyFormation.name : 'similar'} formation. ${supportingDocuments.length} legacy document(s) provide supporting evidence.`;
    } else {
      description = 'No significant risk patterns detected. Continue with standard precautions.';
    }

    // 9. Build unique correlated wells list
    const uniqueWellIds = new Set();
    const correlatedWells = [];
    for (const c of correlations) {
      if (!uniqueWellIds.has(c.well._id.toString())) {
        uniqueWellIds.add(c.well._id.toString());
        correlatedWells.push(c.well);
      }
    }

    res.json({
      proposedLocation: { lat, lng },
      proposedDepth,
      riskLevel,
      adjustedScore: Math.round(adjustedScore * 1000) / 1000,
      primaryRiskType,
      description,
      reasons,
      currentFormation: likelyFormation ? likelyFormation.name : null,
      correlatedIncidents: correlations.slice(0, 10),
      correlatedWells: correlatedWells.slice(0, 10),
      supportingDocuments,
      nearbyWellCount: nearbyWells.length,
      totalIncidentsAnalyzed: allIncidents.length,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/wells/:id — Single well with formations and incidents
router.get('/:id', async (req, res) => {
  try {
    const well = await Well.findById(req.params.id).lean();
    if (!well) return res.status(404).json({ error: true, message: 'Well not found' });

    const formations = await WellFormation.find({ wellId: well._id })
      .populate('formationId')
      .sort({ topDepth: 1 })
      .lean();

    const incidents = await Incident.find({ wellId: well._id })
      .populate('formationId')
      .sort({ depth: 1 })
      .lean();

    res.json({
      well,
      formations: formations.map(wf => ({
        _id: wf._id,
        formation: wf.formationId,
        topDepth: wf.topDepth,
        bottomDepth: wf.bottomDepth,
        remarks: wf.remarks,
      })),
      incidents,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/wells/:id/nearby?radius=5000 — Nearby wells using 2dsphere
router.get('/:id/nearby', async (req, res) => {
  try {
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: true, message: 'Well not found' });

    const radius = parseInt(req.query.radius) || 5000; // meters
    const formation = req.query.formation;
    const incidentType = req.query.incidentType;

    // MongoDB geospatial query
    const nearbyWells = await Well.find({
      _id: { $ne: well._id },
      location: {
        $nearSphere: {
          $geometry: well.location,
          $maxDistance: radius,
        },
      },
    }).lean();

    // Enrich with formations, incidents, and distance
    const results = [];
    for (const nw of nearbyWells) {
      const distance = calculateDistanceMeters(
        well.latitude, well.longitude,
        nw.latitude, nw.longitude
      );

      const formations = await WellFormation.find({ wellId: nw._id })
        .populate('formationId')
        .sort({ topDepth: 1 })
        .lean();

      const incidentFilter = { wellId: nw._id };
      if (incidentType) incidentFilter.incidentType = incidentType;

      const incidents = await Incident.find(incidentFilter)
        .populate('formationId')
        .sort({ depth: 1 })
        .lean();

      // Filter by formation if specified
      if (formation) {
        const hasFormation = formations.some(
          wf => wf.formationId && wf.formationId.name === formation
        );
        if (!hasFormation) continue;
      }

      results.push({
        well: nw,
        distance: Math.round(distance),
        distanceKm: Math.round(distance / 100) / 10,
        formations: formations.map(wf => ({
          formation: wf.formationId,
          topDepth: wf.topDepth,
          bottomDepth: wf.bottomDepth,
        })),
        incidents,
        incidentCount: incidents.length,
      });
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    res.json({
      activeWell: well,
      radius,
      nearbyWells: results,
      count: results.length,
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// GET /api/wells/:id/incidents — Incidents for a specific well
router.get('/:id/incidents', async (req, res) => {
  try {
    const incidents = await Incident.find({ wellId: req.params.id })
      .populate('formationId')
      .sort({ depth: 1 })
      .lean();

    res.json({ incidents, count: incidents.length });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
