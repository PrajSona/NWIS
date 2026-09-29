/**
 * NWIS — Deterministic Risk Engine
 * 
 * Correlates current drilling conditions with historical incidents
 * to identify potential risks. Uses formation match, depth similarity,
 * geographic proximity, and telemetry comparison.
 * 
 * This is a RULE-BASED correlation engine, not a random generator.
 * All scores are deterministic given the same inputs.
 * 
 * IMPORTANT: These are PROTOTYPE correlation parameters,
 * NOT official OIL safety thresholds.
 */

const Well = require('../models/Well');
const Incident = require('../models/Incident');
const WellFormation = require('../models/WellFormation');
const Formation = require('../models/Formation');
const RiskAlert = require('../models/RiskAlert');

// ── CORRELATION WEIGHTS ────────────────────────────────────
// These are transparent prototype parameters.
// They can be adjusted and are displayed in the UI.
const WEIGHTS = {
  formationMatch: 0.35,    // Same formation → highest weight
  depthSimilarity: 0.25,   // Similar depth → second highest
  geographicProximity: 0.15, // Closer wells → some weight
  incidentFrequency: 0.25,  // Multiple incidents of same type → significant
};

// Thresholds (prototype values)
const THRESHOLDS = {
  maxDepthDifference: 200,    // meters — beyond this, depth similarity = 0
  maxDistance: 10000,          // meters — beyond this, proximity = 0
  minRelevanceScore: 0.3,     // Below this, well is not considered relevant
  riskLevels: {
    LOW: 0.3,
    MODERATE: 0.5,
    HIGH: 0.7,
    CRITICAL: 0.85,
  },
};

// Telemetry similarity thresholds (for comparing current vs historical)
const TELEMETRY_THRESHOLDS = {
  torque: { weight: 0.3, maxDiff: 200 },     // Nm
  pumpPressure: { weight: 0.3, maxDiff: 800 }, // psi
  mudWeight: { weight: 0.2, maxDiff: 2 },     // PPG
  rop: { weight: 0.2, maxDiff: 10 },          // m/hr
};

class RiskEngine {
  /**
   * Calculate relevance score for a historical well compared to the active well.
   * 
   * @param {Object} params
   * @param {string} params.activeFormation - Current formation name
   * @param {number} params.activeDepth - Current depth (m)
   * @param {number} params.distance - Distance to historical well (m)
   * @param {string} params.historicalFormation - Historical well's formation name
   * @param {number} params.historicalDepth - Depth of historical incident (m)
   * @param {string} params.incidentType - Type of historical incident
   * @param {number} params.incidentCount - Number of similar incidents at this well
   * @returns {Object} Relevance breakdown
   */
  static calculateRelevance(params) {
    const {
      activeFormation,
      activeDepth,
      distance,
      historicalFormation,
      historicalDepth,
      incidentType,
      incidentCount = 1,
    } = params;

    // 1. Formation match (binary with partial credit for adjacent formations)
    let formationScore = 0;
    if (activeFormation && historicalFormation) {
      if (activeFormation === historicalFormation) {
        formationScore = 1.0;
      } else {
        // Adjacent formation partial credit (simplified)
        const adjacencyMap = {
          'Girujan-Tipam': 0.3,
          'Tipam-Barail': 0.3,
          'Barail-Naga': 0.3,
          'Naga-Tura': 0.2,
        };
        const key1 = `${activeFormation}-${historicalFormation}`;
        const key2 = `${historicalFormation}-${activeFormation}`;
        formationScore = adjacencyMap[key1] || adjacencyMap[key2] || 0;
      }
    }

    // 2. Depth similarity (linear decay)
    const depthDiff = Math.abs(activeDepth - historicalDepth);
    const depthScore = Math.max(0, 1 - depthDiff / THRESHOLDS.maxDepthDifference);

    // 3. Geographic proximity (linear decay)
    const proximityScore = Math.max(0, 1 - distance / THRESHOLDS.maxDistance);

    // 4. Incident frequency (logarithmic — diminishing returns)
    const frequencyScore = Math.min(1, Math.log2(incidentCount + 1) / 3);

    // Weighted total
    const totalScore =
      WEIGHTS.formationMatch * formationScore +
      WEIGHTS.depthSimilarity * depthScore +
      WEIGHTS.geographicProximity * proximityScore +
      WEIGHTS.incidentFrequency * frequencyScore;

    return {
      totalScore: Math.round(totalScore * 1000) / 1000,
      breakdown: {
        formationMatch: {
          score: formationScore,
          weight: WEIGHTS.formationMatch,
          weighted: Math.round(WEIGHTS.formationMatch * formationScore * 1000) / 1000,
          detail: formationScore === 1 ? 'Exact match' :
                  formationScore > 0 ? 'Adjacent formation' : 'No match',
        },
        depthSimilarity: {
          score: Math.round(depthScore * 1000) / 1000,
          weight: WEIGHTS.depthSimilarity,
          weighted: Math.round(WEIGHTS.depthSimilarity * depthScore * 1000) / 1000,
          depthDifference: depthDiff,
          detail: `${depthDiff}m difference`,
        },
        geographicProximity: {
          score: Math.round(proximityScore * 1000) / 1000,
          weight: WEIGHTS.geographicProximity,
          weighted: Math.round(WEIGHTS.geographicProximity * proximityScore * 1000) / 1000,
          distance: Math.round(distance),
          detail: `${(distance / 1000).toFixed(1)} km`,
        },
        incidentFrequency: {
          score: Math.round(frequencyScore * 1000) / 1000,
          weight: WEIGHTS.incidentFrequency,
          weighted: Math.round(WEIGHTS.incidentFrequency * frequencyScore * 1000) / 1000,
          count: incidentCount,
          detail: `${incidentCount} similar incident(s)`,
        },
      },
    };
  }

  /**
   * Calculate telemetry similarity between current and historical conditions.
   */
  static calculateTelemetrySimilarity(current, historical) {
    let totalWeight = 0;
    let weightedSimilarity = 0;
    const details = {};

    for (const [param, config] of Object.entries(TELEMETRY_THRESHOLDS)) {
      const currentVal = current[param];
      const historicalVal = historical[param];

      if (currentVal != null && historicalVal != null) {
        const diff = Math.abs(currentVal - historicalVal);
        const similarity = Math.max(0, 1 - diff / config.maxDiff);
        weightedSimilarity += similarity * config.weight;
        totalWeight += config.weight;
        details[param] = {
          current: currentVal,
          historical: historicalVal,
          difference: Math.round(diff * 10) / 10,
          similarity: Math.round(similarity * 1000) / 1000,
        };
      }
    }

    const overallSimilarity = totalWeight > 0 ? weightedSimilarity / totalWeight : 0;
    return {
      similarity: Math.round(overallSimilarity * 1000) / 1000,
      details,
    };
  }

  /**
   * Evaluate risk for an active well at its current depth.
   * Queries MongoDB for nearby wells and historical incidents.
   * 
   * @param {Object} params
   * @param {string} params.wellId - Active well ID
   * @param {number} params.currentDepth - Current drilling depth
   * @param {Object} params.currentTelemetry - Current telemetry readings
   * @param {number} params.radius - Search radius in meters (default 5000)
   * @returns {Object} Risk assessment
   */
  static async evaluateRisk(params) {
    const {
      wellId,
      currentDepth,
      currentTelemetry = {},
      radius = 5000,
    } = params;

    // Get the active well
    const activeWell = await Well.findById(wellId);
    if (!activeWell) {
      return { error: 'Active well not found' };
    }

    // Determine current formation
    const currentFormations = await WellFormation.find({ wellId })
      .populate('formationId')
      .lean();

    let currentFormation = null;
    for (const wf of currentFormations) {
      if (currentDepth >= wf.topDepth && currentDepth <= wf.bottomDepth) {
        currentFormation = wf.formationId;
        break;
      }
    }

    // Find nearby wells using 2dsphere
    const nearbyWells = await Well.find({
      _id: { $ne: wellId },
      location: {
        $nearSphere: {
          $geometry: activeWell.location,
          $maxDistance: radius,
        },
      },
    }).lean();

    if (nearbyWells.length === 0) {
      return {
        riskLevel: 'LOW',
        description: 'No nearby historical wells found within search radius.',
        correlatedWells: [],
        correlatedIncidents: [],
        reasoning: { nearbyWellCount: 0 },
      };
    }

    // Get incidents for nearby wells
    const nearbyWellIds = nearbyWells.map(w => w._id);
    const nearbyIncidents = await Incident.find({
      wellId: { $in: nearbyWellIds },
    }).populate('formationId').lean();

    // Calculate relevance for each incident
    const correlations = [];

    for (const incident of nearbyIncidents) {
      const well = nearbyWells.find(w => w._id.toString() === incident.wellId.toString());
      if (!well) continue;

      // Calculate distance
      const distance = calculateDistanceMeters(
        activeWell.latitude, activeWell.longitude,
        well.latitude, well.longitude
      );

      // Count incidents of the same type at this well
      const sameTypeCount = nearbyIncidents.filter(
        i => i.wellId.toString() === well._id.toString() &&
             i.incidentType === incident.incidentType
      ).length;

      const relevance = RiskEngine.calculateRelevance({
        activeFormation: currentFormation ? currentFormation.name : null,
        activeDepth: currentDepth,
        distance,
        historicalFormation: incident.formationId ? incident.formationId.name : null,
        historicalDepth: incident.depth || 0,
        incidentType: incident.incidentType,
        incidentCount: sameTypeCount,
      });

      // Calculate telemetry similarity if historical params exist
      let telemetrySimilarity = null;
      if (currentTelemetry && incident.torque) {
        telemetrySimilarity = RiskEngine.calculateTelemetrySimilarity(
          currentTelemetry,
          {
            torque: incident.torque,
            pumpPressure: incident.pumpPressure,
            mudWeight: incident.mudWeight,
            rop: incident.rop,
          }
        );
      }

      if (relevance.totalScore >= THRESHOLDS.minRelevanceScore) {
        correlations.push({
          well: {
            _id: well._id,
            wellName: well.wellName,
            distance: Math.round(distance),
            totalDepth: well.totalDepth,
          },
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
          telemetrySimilarity,
        });
      }
    }

    // Sort by relevance score
    correlations.sort((a, b) => b.relevance.totalScore - a.relevance.totalScore);

    // Determine overall risk level
    let maxScore = 0;
    let primaryRiskType = null;
    const riskTypeScores = {};

    for (const c of correlations) {
      const score = c.relevance.totalScore;
      const type = c.incident.incidentType;

      if (!riskTypeScores[type]) riskTypeScores[type] = 0;
      riskTypeScores[type] = Math.max(riskTypeScores[type], score);

      if (score > maxScore) {
        maxScore = score;
        primaryRiskType = type;
      }
    }

    // Boost score if multiple wells corroborate same risk type
    const corroboratingWells = {};
    for (const c of correlations) {
      const type = c.incident.incidentType;
      if (!corroboratingWells[type]) corroboratingWells[type] = new Set();
      corroboratingWells[type].add(c.well._id.toString());
    }

    let adjustedScore = maxScore;
    if (primaryRiskType && corroboratingWells[primaryRiskType]) {
      const wellCount = corroboratingWells[primaryRiskType].size;
      if (wellCount >= 3) adjustedScore = Math.min(1, adjustedScore * 1.2);
      else if (wellCount >= 2) adjustedScore = Math.min(1, adjustedScore * 1.1);
    }

    // Map score to risk level
    let riskLevel = 'LOW';
    if (adjustedScore >= THRESHOLDS.riskLevels.CRITICAL) riskLevel = 'CRITICAL';
    else if (adjustedScore >= THRESHOLDS.riskLevels.HIGH) riskLevel = 'HIGH';
    else if (adjustedScore >= THRESHOLDS.riskLevels.MODERATE) riskLevel = 'MODERATE';

    // Build description
    let description = '';
    if (primaryRiskType && riskLevel !== 'LOW') {
      const wellCount = corroboratingWells[primaryRiskType]?.size || 0;
      description = `Potential ${primaryRiskType} Risk — ${wellCount} nearby historical well(s) experienced ${primaryRiskType.toLowerCase()} in ${currentFormation ? currentFormation.name : 'similar'} formation at comparable depth.`;
    } else {
      description = 'No significant historical risk patterns detected at current depth.';
    }

    // Build reasoning
    const reasons = [];
    if (primaryRiskType && riskLevel !== 'LOW') {
      const wellCount = corroboratingWells[primaryRiskType]?.size || 0;
      reasons.push(`${wellCount} nearby historical well(s) experienced ${primaryRiskType.toLowerCase()}.`);
      if (currentFormation) {
        reasons.push(`Same formation: ${currentFormation.name}.`);
      }
      const relevantCorr = correlations.filter(c => c.incident.incidentType === primaryRiskType);
      if (relevantCorr.length > 0) {
        const avgDepthDiff = relevantCorr.reduce(
          (sum, c) => sum + c.relevance.breakdown.depthSimilarity.depthDifference, 0
        ) / relevantCorr.length;
        reasons.push(`Current depth is within ${Math.round(avgDepthDiff)}m of historical incident depth(s).`);
      }
      if (currentTelemetry.torque) {
        reasons.push('Current telemetry shows similarity with historical conditions.');
      }
    }

    return {
      riskLevel,
      adjustedScore: Math.round(adjustedScore * 1000) / 1000,
      primaryRiskType,
      description,
      reasons,
      currentFormation: currentFormation ? currentFormation.name : null,
      currentDepth,
      correlatedIncidents: correlations.slice(0, 10), // Top 10
      correlatedWells: [...new Set(correlations.map(c => c.well))].slice(0, 10),
      weights: WEIGHTS,
      thresholds: THRESHOLDS,
    };
  }

  static getWeights() {
    return { ...WEIGHTS };
  }

  static getThresholds() {
    return { ...THRESHOLDS };
  }
}

/**
 * Calculate distance between two lat/lng points using Haversine formula.
 * Returns distance in meters.
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = { RiskEngine, calculateDistanceMeters, WEIGHTS, THRESHOLDS };
