/**
 * NWIS — Seed Data
 * 
 * Synthetic demo dataset for prototype demonstration.
 * Wells placed in Upper Assam (Duliajan/Digboi region) where OIL operates.
 * All data is SYNTHETIC and clearly marked as such.
 * 
 * Usage: node src/seed.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const Well = require('./models/Well');
const Formation = require('./models/Formation');
const WellFormation = require('./models/WellFormation');
const Incident = require('./models/Incident');
const DrillingEvent = require('./models/DrillingEvent');
const Document = require('./models/Document');
const DocumentPage = require('./models/DocumentPage');
const User = require('./models/User');

async function seed() {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing data...');

    await Promise.all([
      Well.deleteMany({}),
      Formation.deleteMany({}),
      WellFormation.deleteMany({}),
      Incident.deleteMany({}),
      DrillingEvent.deleteMany({}),
      Document.deleteMany({}),
      DocumentPage.deleteMany({}),
      User.deleteMany({}),
    ]);

    // ── USERS ──────────────────────────────────────────────
    console.log('[Seed] Creating users...');
    const users = await User.insertMany([
      { username: 'demo_engineer', displayName: 'Demo Engineer', role: 'engineer' },
      { username: 'demo_geologist', displayName: 'Demo Geologist', role: 'geologist' },
    ]);

    // ── FORMATIONS ─────────────────────────────────────────
    console.log('[Seed] Creating formations...');
    const formations = await Formation.insertMany([
      {
        name: 'Alluvium',
        description: 'Recent alluvial deposits',
        typicalLithology: 'Sand, clay, gravel',
        ageGroup: 'Quaternary',
      },
      {
        name: 'Girujan',
        description: 'Girujan Clay Formation — Upper Assam shelf',
        typicalLithology: 'Clay, siltstone with minor sand',
        ageGroup: 'Tertiary (Miocene)',
      },
      {
        name: 'Tipam',
        description: 'Tipam Sandstone Formation — major reservoir in Upper Assam',
        typicalLithology: 'Sandstone with shale intercalations',
        ageGroup: 'Tertiary (Miocene)',
      },
      {
        name: 'Barail',
        description: 'Barail Group — significant hydrocarbon-bearing formation in Assam-Arakan basin',
        typicalLithology: 'Sandstone, shale, coal seams',
        ageGroup: 'Tertiary (Oligocene)',
      },
      {
        name: 'Naga',
        description: 'Naga Thrust Belt — complex structural geology',
        typicalLithology: 'Shale, siltstone, thrust sheets',
        ageGroup: 'Tertiary (Eocene)',
      },
      {
        name: 'Tura',
        description: 'Tura Sandstone Formation — basal Tertiary sand',
        typicalLithology: 'Coarse sandstone, conglomerate',
        ageGroup: 'Tertiary (Paleocene)',
      },
    ]);

    const fmMap = {};
    for (const f of formations) {
      fmMap[f.name] = f;
    }

    // ── WELLS ──────────────────────────────────────────────
    // Centered around Duliajan, Upper Assam (~27.37°N, 95.31°E)
    // 1 km ≈ 0.009° latitude, ≈ 0.0101° longitude at this latitude
    console.log('[Seed] Creating wells...');

    const wellData = [
      {
        wellName: 'NWIS-ACTIVE-01',
        wellType: 'development',
        operator: 'Synthetic Operator',
        status: 'active',
        latitude: 27.3720,
        longitude: 95.3150,
        totalDepth: 3500,
        currentDepth: 3020,
        spudDate: new Date('2026-07-15'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-A',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.3850,
        longitude: 95.3280,
        totalDepth: 3200,
        spudDate: new Date('2023-03-10'),
        completionDate: new Date('2023-09-22'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-B',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.3980,
        longitude: 95.3100,
        totalDepth: 3180,
        spudDate: new Date('2022-06-05'),
        completionDate: new Date('2022-12-15'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-C',
        wellType: 'development',
        status: 'completed',
        latitude: 27.3600,
        longitude: 95.3250,
        totalDepth: 3100,
        spudDate: new Date('2024-01-20'),
        completionDate: new Date('2024-06-30'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-D',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.3680,
        longitude: 95.3030,
        totalDepth: 3300,
        spudDate: new Date('2021-11-01'),
        completionDate: new Date('2022-04-18'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-E',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.3300,
        longitude: 95.3400,
        totalDepth: 3400,
        spudDate: new Date('2020-08-12'),
        completionDate: new Date('2021-02-28'),
        fieldName: 'Digboi (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-F',
        wellType: 'development',
        status: 'completed',
        latitude: 27.3950,
        longitude: 95.3350,
        totalDepth: 2800,
        spudDate: new Date('2023-09-01'),
        completionDate: new Date('2024-01-15'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-G',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.4400,
        longitude: 95.3000,
        totalDepth: 3500,
        spudDate: new Date('2019-04-20'),
        completionDate: new Date('2019-11-10'),
        fieldName: 'Naharkatia (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-H',
        wellType: 'development',
        status: 'abandoned',
        latitude: 27.3580,
        longitude: 95.3200,
        totalDepth: 3000,
        spudDate: new Date('2022-02-14'),
        completionDate: new Date('2022-07-20'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-I',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.3400,
        longitude: 95.3500,
        totalDepth: 3250,
        spudDate: new Date('2021-05-10'),
        completionDate: new Date('2021-11-25'),
        fieldName: 'Digboi (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-J',
        wellType: 'exploration',
        status: 'completed',
        latitude: 27.2700,
        longitude: 95.3500,
        totalDepth: 3600,
        spudDate: new Date('2020-01-15'),
        completionDate: new Date('2020-08-30'),
        fieldName: 'Moran (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
      {
        wellName: 'SYNTH-DLJ-K',
        wellType: 'appraisal',
        status: 'suspended',
        latitude: 27.3450,
        longitude: 95.2800,
        totalDepth: 2600,
        spudDate: new Date('2024-03-01'),
        completionDate: new Date('2024-05-15'),
        fieldName: 'Duliajan (Demo)',
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      },
    ];

    // Save wells individually so pre-save hook populates location
    const wells = [];
    for (const wd of wellData) {
      const w = new Well(wd);
      await w.save();
      wells.push(w);
    }

    const wMap = {};
    for (const w of wells) {
      wMap[w.wellName] = w;
    }

    // ── WELL-FORMATIONS ────────────────────────────────────
    console.log('[Seed] Creating well-formation relationships...');

    const wfData = [
      // ACTIVE-01: drilling through Barail now
      { well: 'NWIS-ACTIVE-01', formation: 'Alluvium', top: 0, bottom: 200 },
      { well: 'NWIS-ACTIVE-01', formation: 'Girujan', top: 200, bottom: 850 },
      { well: 'NWIS-ACTIVE-01', formation: 'Tipam', top: 850, bottom: 1650 },
      { well: 'NWIS-ACTIVE-01', formation: 'Barail', top: 2980, bottom: 3240 },
      { well: 'NWIS-ACTIVE-01', formation: 'Naga', top: 3240, bottom: 3500 },

      // DLJ-A: completed, has Barail stuck pipe
      { well: 'SYNTH-DLJ-A', formation: 'Alluvium', top: 0, bottom: 180 },
      { well: 'SYNTH-DLJ-A', formation: 'Girujan', top: 180, bottom: 800 },
      { well: 'SYNTH-DLJ-A', formation: 'Tipam', top: 800, bottom: 1600 },
      { well: 'SYNTH-DLJ-A', formation: 'Barail', top: 2950, bottom: 3200 },

      // DLJ-B: completed, has Barail stuck pipe
      { well: 'SYNTH-DLJ-B', formation: 'Alluvium', top: 0, bottom: 190 },
      { well: 'SYNTH-DLJ-B', formation: 'Girujan', top: 190, bottom: 820 },
      { well: 'SYNTH-DLJ-B', formation: 'Tipam', top: 820, bottom: 1620 },
      { well: 'SYNTH-DLJ-B', formation: 'Barail', top: 2960, bottom: 3180 },

      // DLJ-C: nearby, Barail, but NO stuck pipe (demonstrates correlation)
      { well: 'SYNTH-DLJ-C', formation: 'Alluvium', top: 0, bottom: 170 },
      { well: 'SYNTH-DLJ-C', formation: 'Girujan', top: 170, bottom: 790 },
      { well: 'SYNTH-DLJ-C', formation: 'Tipam', top: 790, bottom: 1580 },
      { well: 'SYNTH-DLJ-C', formation: 'Barail', top: 2900, bottom: 3100 },

      // DLJ-D: close but DIFFERENT formation at relevant depth (Tipam), mud loss
      { well: 'SYNTH-DLJ-D', formation: 'Alluvium', top: 0, bottom: 200 },
      { well: 'SYNTH-DLJ-D', formation: 'Girujan', top: 200, bottom: 830 },
      { well: 'SYNTH-DLJ-D', formation: 'Tipam', top: 830, bottom: 1700 },
      { well: 'SYNTH-DLJ-D', formation: 'Barail', top: 3050, bottom: 3300 },

      // DLJ-E: farther, Barail overpressure
      { well: 'SYNTH-DLJ-E', formation: 'Girujan', top: 150, bottom: 780 },
      { well: 'SYNTH-DLJ-E', formation: 'Tipam', top: 780, bottom: 1550 },
      { well: 'SYNTH-DLJ-E', formation: 'Barail', top: 2900, bottom: 3200 },
      { well: 'SYNTH-DLJ-E', formation: 'Naga', top: 3200, bottom: 3400 },

      // DLJ-F: didn't reach Barail, torque spike in Tipam
      { well: 'SYNTH-DLJ-F', formation: 'Alluvium', top: 0, bottom: 210 },
      { well: 'SYNTH-DLJ-F', formation: 'Girujan', top: 210, bottom: 850 },
      { well: 'SYNTH-DLJ-F', formation: 'Tipam', top: 850, bottom: 2800 },

      // DLJ-G: far, Barail stuck pipe (validates pattern but won't appear in 5km)
      { well: 'SYNTH-DLJ-G', formation: 'Girujan', top: 100, bottom: 750 },
      { well: 'SYNTH-DLJ-G', formation: 'Tipam', top: 750, bottom: 1500 },
      { well: 'SYNTH-DLJ-G', formation: 'Barail', top: 2920, bottom: 3250 },
      { well: 'SYNTH-DLJ-G', formation: 'Naga', top: 3250, bottom: 3500 },

      // DLJ-H: close, Girujan cementing problem
      { well: 'SYNTH-DLJ-H', formation: 'Alluvium', top: 0, bottom: 190 },
      { well: 'SYNTH-DLJ-H', formation: 'Girujan', top: 190, bottom: 810 },
      { well: 'SYNTH-DLJ-H', formation: 'Tipam', top: 810, bottom: 1630 },
      { well: 'SYNTH-DLJ-H', formation: 'Barail', top: 2970, bottom: 3000 },

      // DLJ-I: moderate distance, Barail mud loss
      { well: 'SYNTH-DLJ-I', formation: 'Girujan', top: 160, bottom: 800 },
      { well: 'SYNTH-DLJ-I', formation: 'Tipam', top: 800, bottom: 1600 },
      { well: 'SYNTH-DLJ-I', formation: 'Barail', top: 2940, bottom: 3250 },

      // DLJ-J: very far, Barail stuck pipe (won't appear in 5km/10km)
      { well: 'SYNTH-DLJ-J', formation: 'Tipam', top: 700, bottom: 1500 },
      { well: 'SYNTH-DLJ-J', formation: 'Barail', top: 2880, bottom: 3300 },
      { well: 'SYNTH-DLJ-J', formation: 'Naga', top: 3300, bottom: 3600 },

      // DLJ-K: moderate distance, Tura only, shallow
      { well: 'SYNTH-DLJ-K', formation: 'Alluvium', top: 0, bottom: 220 },
      { well: 'SYNTH-DLJ-K', formation: 'Girujan', top: 220, bottom: 900 },
      { well: 'SYNTH-DLJ-K', formation: 'Tura', top: 2200, bottom: 2600 },
    ];

    const wellFormations = [];
    for (const wf of wfData) {
      wellFormations.push({
        wellId: wMap[wf.well]._id,
        formationId: fmMap[wf.formation]._id,
        topDepth: wf.top,
        bottomDepth: wf.bottom,
      });
    }
    await WellFormation.insertMany(wellFormations);

    // ── SYNTHETIC DOCUMENTS ────────────────────────────────
    console.log('[Seed] Creating synthetic source documents...');
    const path = require('path');
    const fs = require('fs');
    const systemDocsDir = path.resolve(__dirname, '../uploads/system');

    // Get actual file sizes if the PDFs exist
    function getFileSize(filename) {
      const fp = path.join(systemDocsDir, filename);
      try { return fs.statSync(fp).size; } catch { return 2048000; }
    }

    const docs = await Document.insertMany([
      {
        filename: 'WCR_SYNTH-DLJ-A_2023.pdf',
        originalName: 'WCR_SYNTH-DLJ-A_2023.pdf',
        filePath: path.join(systemDocsDir, 'WCR_SYNTH-DLJ-A_2023.pdf'),
        fileSize: getFileSize('WCR_SYNTH-DLJ-A_2023.pdf'),
        docType: 'well_completion_report',
        processingStatus: 'completed',
        totalPages: 4,
        extractedEvents: 3,
        isSynthetic: true,
        dataSource: 'Legacy Data — System Pre-loaded',
        processedAt: new Date('2026-08-01'),
      },
      {
        filename: 'WCR_SYNTH-DLJ-B_2022.pdf',
        originalName: 'WCR_SYNTH-DLJ-B_2022.pdf',
        filePath: path.join(systemDocsDir, 'WCR_SYNTH-DLJ-B_2022.pdf'),
        fileSize: getFileSize('WCR_SYNTH-DLJ-B_2022.pdf'),
        docType: 'well_completion_report',
        processingStatus: 'completed',
        totalPages: 3,
        extractedEvents: 2,
        isSynthetic: true,
        dataSource: 'Legacy Data — System Pre-loaded',
        processedAt: new Date('2026-08-01'),
      },
      {
        filename: 'DrillingReport_SYNTH-DLJ-D_2022.pdf',
        originalName: 'DrillingReport_SYNTH-DLJ-D_2022.pdf',
        filePath: path.join(systemDocsDir, 'DrillingReport_SYNTH-DLJ-D_2022.pdf'),
        fileSize: getFileSize('DrillingReport_SYNTH-DLJ-D_2022.pdf'),
        docType: 'drilling_report',
        processingStatus: 'completed',
        totalPages: 2,
        extractedEvents: 2,
        isSynthetic: true,
        dataSource: 'Legacy Data — System Pre-loaded',
        processedAt: new Date('2026-08-01'),
      },
    ]);

    const docMap = {};
    for (const d of docs) {
      docMap[d.filename] = d;
    }

    // ── INCIDENTS ──────────────────────────────────────────
    console.log('[Seed] Creating historical incidents...');
    const incidentData = [
      // DLJ-A: Stuck Pipe in Barail at 3040m — KEY for demo scenario
      {
        well: 'SYNTH-DLJ-A', formation: 'Barail', type: 'Stuck Pipe',
        depth: 3040, severity: 'high',
        description: 'Drill pipe became stuck at 3040m in the Barail formation. Differential sticking suspected due to thick mud cake buildup on permeable sand section. Pipe became immovable after 20 minutes of no circulation.',
        mudWeight: 12.2, torque: 520, pumpPressure: 3200, rpm: 0, rop: 0,
        mitigation: 'Applied jarring sequence for 4 hours. Spotting fluid (diesel-based) was pumped. Pipe freed after 6 hours. Mud system adjusted to reduce filtrate loss. Added lubricant to mud system.',
        lessonLearned: 'Monitor differential pressure closely in Barail sand sections. Maintain continuous circulation. Consider using non-damaging mud system when entering Barail. Keep pipe moving at all times in permeable zones.',
        incidentDate: new Date('2023-07-18'),
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 3,
      },
      // DLJ-A: Minor torque spike earlier
      {
        well: 'SYNTH-DLJ-A', formation: 'Tipam', type: 'Torque Spike',
        depth: 1450, severity: 'low',
        description: 'Torque increased from 350 Nm to 420 Nm while drilling through Tipam sandstone at 1450m. Attributed to tight hole conditions due to clay swelling.',
        mudWeight: 10.5, torque: 420, pumpPressure: 2800, rpm: 110, rop: 8,
        mitigation: 'Increased mud weight slightly. Performed wiper trip. Hole cleaned satisfactorily.',
        lessonLearned: 'Clay swelling in Tipam can cause intermittent tight hole. Maintain inhibitive mud properties.',
        incidentDate: new Date('2023-05-22'),
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 2,
      },
      // DLJ-A: Mud loss in Barail
      {
        well: 'SYNTH-DLJ-A', formation: 'Barail', type: 'Mud Loss',
        depth: 3080, severity: 'medium',
        description: 'Partial mud loss of approximately 15 bbl/hr observed at 3080m in fractured Barail section. Losses attributed to natural fracture network.',
        mudWeight: 12.4, torque: 380, pumpPressure: 2600, rpm: 80, rop: 3,
        mitigation: 'LCM (Lost Circulation Material) pill pumped. Losses reduced to 5 bbl/hr. Continued drilling with controlled losses.',
        lessonLearned: 'Barail fracture zones require LCM availability on-site. Reduce ECD when approaching known loss zones.',
        incidentDate: new Date('2023-07-25'),
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 4,
      },
      // DLJ-B: Stuck Pipe in Barail at 3050m — KEY for demo scenario
      {
        well: 'SYNTH-DLJ-B', formation: 'Barail', type: 'Stuck Pipe',
        depth: 3050, severity: 'high',
        description: 'Stuck pipe event at 3050m depth in Barail formation. Pack-off type sticking due to wellbore instability in shale section. Circulation was lost temporarily before pipe became stuck.',
        mudWeight: 12.0, torque: 510, pumpPressure: 3350, rpm: 0, rop: 0,
        mitigation: 'Attempted jarring with no success for 3 hours. Pumped high-viscosity pill. Eventually freed pipe by working with increased pump rate and rotation. Lost 18 hours of drilling time.',
        lessonLearned: 'Barail shale sections are prone to wellbore instability. Maintain adequate mud weight to prevent hole collapse. Monitor ECD and equivalent circulating density carefully. Short trips recommended every 100m in Barail.',
        incidentDate: new Date('2022-09-14'),
        doc: 'WCR_SYNTH-DLJ-B_2022.pdf', page: 2,
      },
      // DLJ-B: Overpressure
      {
        well: 'SYNTH-DLJ-B', formation: 'Barail', type: 'Overpressure',
        depth: 3120, severity: 'medium',
        description: 'Unexpected pore pressure increase detected at 3120m in Barail. Kick indicators observed including flow increase and pit volume gain of 8 barrels.',
        mudWeight: 12.0, torque: 400, pumpPressure: 3500, rpm: 90, rop: 5,
        mitigation: 'Well shut in per well control procedures. Kill weight mud mixed and circulated. Kill mud weight: 12.8 PPG. Well secured after 2 circulations.',
        lessonLearned: 'Pore pressure can increase significantly in deeper Barail sections. Monitor pit volumes and flow rates continuously. Have kill weight mud materials readily available.',
        incidentDate: new Date('2022-10-02'),
        doc: 'WCR_SYNTH-DLJ-B_2022.pdf', page: 3,
      },
      // DLJ-C: Minor event only — no stuck pipe (shows correlation selectivity)
      {
        well: 'SYNTH-DLJ-C', formation: 'Tipam', type: 'Torque Spike',
        depth: 1520, severity: 'low',
        description: 'Brief torque increase to 400 Nm at 1520m in Tipam. Resolved by back-reaming.',
        mudWeight: 10.2, torque: 400, pumpPressure: 2700, rpm: 100, rop: 6,
        mitigation: 'Back-reamed 50m section. Increased flow rate.',
        lessonLearned: 'Monitor torque trends while drilling through Tipam clay layers.',
        incidentDate: new Date('2024-03-15'),
      },
      // DLJ-D: Mud Loss in Tipam (different formation — tests correlation logic)
      {
        well: 'SYNTH-DLJ-D', formation: 'Tipam', type: 'Mud Loss',
        depth: 1650, severity: 'medium',
        description: 'Severe mud loss at 1650m in Tipam sandstone. Losses reached 30 bbl/hr into a highly permeable sand zone.',
        mudWeight: 10.8, torque: 350, pumpPressure: 2200, rpm: 80, rop: 4,
        mitigation: 'Pumped multiple LCM pills. Set cement plug. Drilled through plug and continued with reduced mud weight.',
        lessonLearned: 'Tipam high-permeability zones require proactive LCM treatment. Consider managed pressure drilling techniques.',
        incidentDate: new Date('2022-01-10'),
        doc: 'DrillingReport_SYNTH-DLJ-D_2022.pdf', page: 1,
      },
      // DLJ-D: Stuck pipe in Barail (different depth range)
      {
        well: 'SYNTH-DLJ-D', formation: 'Barail', type: 'Stuck Pipe',
        depth: 3150, severity: 'medium',
        description: 'Mechanical sticking at 3150m in Barail due to key seating in dog-leg. Pipe could not be rotated or reciprocated.',
        mudWeight: 12.5, torque: 480, pumpPressure: 3100, rpm: 0, rop: 0,
        mitigation: 'Jarring freed the pipe after 2 hours. Reamed the section to eliminate key seat.',
        lessonLearned: 'Monitor dog-leg severity. Keep BHA design compatible with well trajectory to prevent key seating.',
        incidentDate: new Date('2022-03-20'),
        doc: 'DrillingReport_SYNTH-DLJ-D_2022.pdf', page: 2,
      },
      // DLJ-E: Overpressure in Barail
      {
        well: 'SYNTH-DLJ-E', formation: 'Barail', type: 'Overpressure',
        depth: 3200, severity: 'high',
        description: 'Significant overpressure encountered at 3200m in Barail. Gas influx detected. Well control situation for 6 hours.',
        mudWeight: 12.3, torque: 420, pumpPressure: 3600, rpm: 60, rop: 2,
        mitigation: 'Well shut in. Kill mud circulated at 13.2 PPG. Casing point reassessed.',
        lessonLearned: 'Deep Barail sections in this area show higher-than-expected pore pressures. Pre-plan for heavier kill mud availability.',
        incidentDate: new Date('2021-01-18'),
      },
      // DLJ-F: Torque Spike in Tipam
      {
        well: 'SYNTH-DLJ-F', formation: 'Tipam', type: 'Torque Spike',
        depth: 1200, severity: 'medium',
        description: 'Torque spike to 480 Nm at 1200m in Tipam. Suspected micro-dog-leg causing friction.',
        mudWeight: 10.0, torque: 480, pumpPressure: 2900, rpm: 90, rop: 5,
        mitigation: 'Performed short trip. Applied additional lubricant to mud system. Torque normalized.',
        lessonLearned: 'Survey frequently in Tipam to detect micro-dog-legs early.',
        incidentDate: new Date('2023-10-08'),
      },
      // DLJ-H: Cementing Problem in Girujan
      {
        well: 'SYNTH-DLJ-H', formation: 'Girujan', type: 'Cementing Problem',
        depth: 750, severity: 'medium',
        description: 'Incomplete cement displacement in Girujan at 750m. Cement bond log showed channels behind 9-5/8" casing.',
        mudWeight: 9.8, torque: 300, pumpPressure: 2400, rpm: 0, rop: 0,
        mitigation: 'Performed remedial cement squeeze job. Repeated CBL showed improved bond.',
        lessonLearned: 'Girujan clay can cause mud contamination of cement. Ensure adequate spacer volumes and casing centralization.',
        incidentDate: new Date('2022-04-02'),
      },
      // DLJ-I: Mud Loss in Barail
      {
        well: 'SYNTH-DLJ-I', formation: 'Barail', type: 'Mud Loss',
        depth: 3100, severity: 'medium',
        description: 'Mud loss of 20 bbl/hr at 3100m in Barail fractured zone. Similar to losses experienced in DLJ-A.',
        mudWeight: 12.1, torque: 370, pumpPressure: 2500, rpm: 85, rop: 4,
        mitigation: 'LCM pill with fine to medium blend. Losses controlled within 4 hours.',
        lessonLearned: 'Barail fractured zones in this area consistently show partial losses. Pre-stage LCM materials.',
        incidentDate: new Date('2021-08-22'),
      },
      // DLJ-G: Stuck Pipe in Barail — far well, validates pattern
      {
        well: 'SYNTH-DLJ-G', formation: 'Barail', type: 'Stuck Pipe',
        depth: 3060, severity: 'high',
        description: 'Stuck pipe at 3060m in Barail formation. Differential sticking in sand/shale transition. Similar mechanism to events at DLJ-A and DLJ-B.',
        mudWeight: 12.4, torque: 530, pumpPressure: 3250, rpm: 0, rop: 0,
        mitigation: 'Freed pipe using combination of jarring and spotting fluid. Total NPT: 14 hours.',
        lessonLearned: 'Regional pattern of stuck pipe in Barail at 3000-3100m depth range. Multiple wells confirm this risk zone.',
        incidentDate: new Date('2019-08-05'),
      },
      // DLJ-J: Stuck Pipe in Barail — very far, won't appear in 5km search
      {
        well: 'SYNTH-DLJ-J', formation: 'Barail', type: 'Stuck Pipe',
        depth: 3080, severity: 'high',
        description: 'Stuck pipe at 3080m in Barail. Wellbore instability related.',
        mudWeight: 12.6, torque: 500, pumpPressure: 3300, rpm: 0, rop: 0,
        mitigation: 'Side-tracked well. Original fish left in hole.',
        lessonLearned: 'Barail stuck pipe risk is consistent across the region.',
        incidentDate: new Date('2020-05-12'),
      },
    ];

    const incidents = [];
    for (const inc of incidentData) {
      const incObj = {
        wellId: wMap[inc.well]._id,
        formationId: fmMap[inc.formation]._id,
        incidentType: inc.type,
        depth: inc.depth,
        description: inc.description,
        severity: inc.severity,
        mudWeight: inc.mudWeight,
        torque: inc.torque,
        pumpPressure: inc.pumpPressure,
        rpm: inc.rpm,
        rop: inc.rop,
        mitigation: inc.mitigation,
        lessonLearned: inc.lessonLearned,
        incidentDate: inc.incidentDate,
        isSynthetic: true,
        dataSource: 'Synthetic Demo Dataset',
      };
      if (inc.doc) {
        incObj.sourceDocumentId = docMap[inc.doc]._id;
        incObj.sourcePage = inc.page;
      }
      incidents.push(incObj);
    }
    const savedIncidents = await Incident.insertMany(incidents);

    // ── DRILLING EVENTS ────────────────────────────────────
    console.log('[Seed] Creating drilling events...');
    const eventData = [
      { well: 'NWIS-ACTIVE-01', type: 'Spud', depth: 0, desc: 'Well spudded', date: new Date('2026-07-15') },
      { well: 'NWIS-ACTIVE-01', type: 'Casing Set', depth: 850, desc: '13-3/8" surface casing set and cemented', date: new Date('2026-07-28') },
      { well: 'NWIS-ACTIVE-01', type: 'Formation Change', depth: 2980, desc: 'Entered Barail formation', date: new Date('2026-09-10') },
      { well: 'NWIS-ACTIVE-01', type: 'Casing Set', depth: 1650, desc: '9-5/8" intermediate casing set and cemented', date: new Date('2026-08-15') },
      { well: 'SYNTH-DLJ-A', type: 'Spud', depth: 0, desc: 'Well spudded', date: new Date('2023-03-10') },
      { well: 'SYNTH-DLJ-A', type: 'Formation Change', depth: 2950, desc: 'Entered Barail formation', date: new Date('2023-06-20') },
      { well: 'SYNTH-DLJ-A', type: 'NPT - Stuck Pipe', depth: 3040, desc: 'Stuck pipe event. NPT: 6 hours', date: new Date('2023-07-18'), duration: 6 },
      { well: 'SYNTH-DLJ-B', type: 'Spud', depth: 0, desc: 'Well spudded', date: new Date('2022-06-05') },
      { well: 'SYNTH-DLJ-B', type: 'NPT - Stuck Pipe', depth: 3050, desc: 'Stuck pipe event. NPT: 18 hours', date: new Date('2022-09-14'), duration: 18 },
      { well: 'SYNTH-DLJ-B', type: 'Well Control', depth: 3120, desc: 'Well control event. Kick detected', date: new Date('2022-10-02'), duration: 12 },
    ];

    const events = [];
    for (const e of eventData) {
      events.push({
        wellId: wMap[e.well]._id,
        eventType: e.type,
        depth: e.depth,
        description: e.desc,
        eventDate: e.date,
        durationHours: e.duration || null,
      });
    }
    await DrillingEvent.insertMany(events);

    // ── DOCUMENT PAGES (synthetic excerpts for evidence) ───
    console.log('[Seed] Creating synthetic document pages...');
    const pageData = [
      {
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 3,
        text: 'Section 4.3 — Drilling Problems\n\nAt 3040m depth in the Barail formation, the drill pipe became stuck. Differential sticking was suspected as the primary mechanism due to thick mud cake buildup observed on the permeable sand section. The pipe became completely immovable after approximately 20 minutes of no circulation.\n\nMud weight at the time of the event was 12.2 PPG. Torque reading had reached 520 Nm before the pipe became stuck. Pump pressure was recorded at 3200 psi.\n\nJarring sequence was initiated immediately. After 4 hours of jarring with no success, a diesel-based spotting fluid was pumped around the stuck point. The pipe was eventually freed after a total of 6 hours of remedial operations.\n\nRecommendations:\n- Monitor differential pressure closely when drilling through Barail sand sections\n- Maintain continuous circulation at all times\n- Consider using non-damaging mud system when entering Barail\n- Keep pipe moving at all times in permeable zones',
      },
      {
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 2,
        text: 'Section 3.2 — Tipam Section Drilling\n\nWhile drilling through the Tipam sandstone at 1450m, torque increased from the baseline of 350 Nm to approximately 420 Nm. The increase was attributed to tight hole conditions arising from clay swelling in the interbedded clay layers.\n\nMud weight was maintained at 10.5 PPG. A wiper trip was performed and the hole was cleaned satisfactorily. Mud properties were adjusted to improve inhibition.',
      },
      {
        doc: 'WCR_SYNTH-DLJ-A_2023.pdf', page: 4,
        text: 'Section 4.5 — Mud Losses\n\nPartial mud loss of approximately 15 barrels per hour was observed at 3080m in a fractured section of the Barail formation. The losses were attributed to a natural fracture network. LCM (Lost Circulation Material) pill was pumped and losses were reduced to approximately 5 barrels per hour. Drilling continued with controlled losses.\n\nMud weight at the time: 12.4 PPG.',
      },
      {
        doc: 'WCR_SYNTH-DLJ-B_2022.pdf', page: 2,
        text: 'Section 5.1 — Stuck Pipe Incident\n\nAt 3050m depth in the Barail formation, a stuck pipe event occurred. The sticking mechanism was identified as pack-off type due to wellbore instability in the shale section. Circulation was lost temporarily before the pipe became stuck.\n\nDrilling parameters at the time:\n- Mud weight: 12.0 PPG\n- Torque: 510 Nm (last reading before stuck)\n- Pump pressure: 3350 psi\n- RPM: 0 (stopped)\n- ROP: 0 (stopped)\n\nJarring was attempted with no success for 3 hours. A high-viscosity pill was pumped. The pipe was eventually freed by working with increased pump rate and rotation. Total NPT: 18 hours.\n\nThis is the second stuck pipe event recorded in the Barail formation in this area, following the DLJ-A event at a similar depth (3040m).',
      },
      {
        doc: 'WCR_SYNTH-DLJ-B_2022.pdf', page: 3,
        text: 'Section 5.3 — Well Control Event\n\nAt 3120m depth in the Barail formation, an unexpected pore pressure increase was detected. Kick indicators included:\n- Increase in flow rate\n- Pit volume gain of 8 barrels\n\nThe well was shut in per standard well control procedures. Kill weight mud was mixed at 12.8 PPG and circulated. The well was secured after 2 full circulations.\n\nThis pore pressure anomaly suggests that deeper Barail sections in this area may have higher-than-expected pore pressures.',
      },
      {
        doc: 'DrillingReport_SYNTH-DLJ-D_2022.pdf', page: 1,
        text: 'Section 3 — Drilling Problems Summary\n\n3.1 Mud Loss Event\n\nAt 1650m in the Tipam sandstone, severe mud loss was encountered. Losses reached 30 barrels per hour into a highly permeable sand zone. Multiple LCM pills were pumped with limited success. A cement plug was set at 1640m, drilled through, and drilling continued with a reduced mud weight of 10.2 PPG.\n\nThe Tipam high-permeability zones in this area consistently present loss challenges.',
      },
      {
        doc: 'DrillingReport_SYNTH-DLJ-D_2022.pdf', page: 2,
        text: 'Section 3.3 — Stuck Pipe Event\n\nMechanical sticking occurred at 3150m in the Barail formation. The cause was identified as key seating in a dog-leg with a severity of 3.5°/30m. The pipe could not be rotated or reciprocated.\n\nJarring freed the pipe after 2 hours of operations. The section was subsequently reamed to eliminate the key seat.\n\nRecommendation: Monitor dog-leg severity carefully. Ensure BHA design is compatible with planned well trajectory.',
      },
    ];

    const pages = [];
    for (const p of pageData) {
      pages.push({
        documentId: docMap[p.doc]._id,
        pageNumber: p.page,
        extractedText: p.text,
      });
    }
    await DocumentPage.insertMany(pages);

    // ── SUMMARY ────────────────────────────────────────────
    console.log('\n[Seed] ✓ Seeding complete:');
    console.log(`  Users:           ${users.length}`);
    console.log(`  Formations:      ${formations.length}`);
    console.log(`  Wells:           ${wells.length}`);
    console.log(`  Well-Formations: ${wellFormations.length}`);
    console.log(`  Documents:       ${docs.length}`);
    console.log(`  Incidents:       ${savedIncidents.length}`);
    console.log(`  Drilling Events: ${events.length}`);
    console.log(`  Document Pages:  ${pages.length}`);
    console.log('\n[Seed] All data is synthetic and labeled as such.');
    console.log('[Seed] Active well: NWIS-ACTIVE-01 (currently at 3020m in Barail)');
    console.log('[Seed] Demo scenario: Wells DLJ-A and DLJ-B have stuck pipe in Barail at ~3040-3050m');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
