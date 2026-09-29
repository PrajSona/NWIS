/**
 * Generate Fake PDFs — Professional-looking drilling reports
 * 
 * Creates:
 *  1. PDFs that are pre-loaded in the system (system legacy data)
 *  2. Additional 3-4 PDFs for demo upload (placed in a separate folder)
 * 
 * Usage: node src/generate-pdfs.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure directories exist
const systemDocsDir = path.resolve(__dirname, '../uploads/system');
const demoPdfsDir = path.resolve(__dirname, '../../demo-pdfs');

if (!fs.existsSync(systemDocsDir)) fs.mkdirSync(systemDocsDir, { recursive: true });
if (!fs.existsSync(demoPdfsDir)) fs.mkdirSync(demoPdfsDir, { recursive: true });

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function addHeader(doc, title, reportNumber, date) {
  // Organization header
  doc.fontSize(8).font('Helvetica').fillColor('#666666')
     .text('OIL INDIA LIMITED — CONFIDENTIAL', 50, 40, { align: 'center' });
  doc.fontSize(6).text('Duliajan, Dibrugarh, Assam 786602, India', { align: 'center' });

  // Horizontal line
  doc.moveTo(50, 62).lineTo(545, 62).strokeColor('#1e3a5f').lineWidth(2).stroke();
  doc.moveTo(50, 65).lineTo(545, 65).strokeColor('#ea580c').lineWidth(0.5).stroke();

  // Title
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(title, 50, 80, { align: 'center' });

  // Report info
  doc.fontSize(9).font('Helvetica').fillColor('#333333');
  doc.text(`Report No: ${reportNumber}`, 50, 110);
  doc.text(`Date: ${date}`, 350, 110);
  doc.text('Classification: INTERNAL USE ONLY', 50, 122);

  doc.moveTo(50, 138).lineTo(545, 138).strokeColor('#cccccc').lineWidth(0.5).stroke();
  doc.y = 150;
}

function addSection(doc, sectionNum, title, y) {
  if (y > 700) { doc.addPage(); y = 50; }
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(`${sectionNum}. ${title}`, 50, y);
  doc.moveTo(50, y + 16).lineTo(300, y + 16).strokeColor('#ea580c').lineWidth(0.5).stroke();
  return y + 25;
}

function addParagraph(doc, text, y, indent = 50) {
  if (y > 700) { doc.addPage(); y = 50; }
  doc.fontSize(10).font('Helvetica').fillColor('#333333')
     .text(text, indent, y, { width: 490, lineGap: 3 });
  return doc.y + 8;
}

function addTable(doc, headers, rows, y) {
  if (y > 600) { doc.addPage(); y = 50; }
  const colWidth = 490 / headers.length;
  const startX = 50;

  // Header row
  doc.rect(startX, y, 490, 18).fill('#1e3a5f');
  headers.forEach((h, i) => {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
       .text(h, startX + i * colWidth + 5, y + 5, { width: colWidth - 10 });
  });
  y += 18;

  // Data rows
  rows.forEach((row, ri) => {
    if (y > 720) { doc.addPage(); y = 50; }
    const bg = ri % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(startX, y, 490, 16).fill(bg);
    row.forEach((cell, ci) => {
      doc.fontSize(8).font('Helvetica').fillColor('#333333')
         .text(String(cell), startX + ci * colWidth + 5, y + 4, { width: colWidth - 10 });
    });
    y += 16;
  });

  // Bottom border
  doc.moveTo(startX, y).lineTo(startX + 490, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  return y + 10;
}

function addFooter(doc, pageNum) {
  doc.fontSize(7).font('Helvetica').fillColor('#999999')
     .text(`Page ${pageNum}`, 50, 760, { align: 'center' })
     .text('OIL India Limited — Prototype Demo Document — NOT FOR OPERATIONAL USE', 50, 770, { align: 'center' });
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENT 1: Well Completion Report — DLJ-A
   ═══════════════════════════════════════════════════════════ */
function generateWCR_DLJ_A() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(systemDocsDir, 'WCR_SYNTH-DLJ-A_2023.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  // Page 1
  addHeader(doc, 'WELL COMPLETION REPORT', 'WCR/DLJ-A/2023/047', '22 September 2023');
  let y = 155;

  y = addSection(doc, '1', 'EXECUTIVE SUMMARY', y);
  y = addParagraph(doc, 'This report presents the drilling and completion summary for exploration well SYNTH-DLJ-A located in the Duliajan field, Upper Assam Basin. The well was spudded on 10 March 2023 and reached total depth of 3200m on 22 September 2023. Key objectives included evaluation of hydrocarbon potential in Tipam and Barail formations.', y);
  y = addParagraph(doc, 'During the drilling campaign, several notable incidents occurred including a stuck pipe event in the Barail formation at 3040m depth, partial mud losses at 3080m, and a minor torque spike in the Tipam section at 1450m. Detailed descriptions and mitigations are provided in subsequent sections.', y);

  y = addSection(doc, '2', 'WELL DATA SUMMARY', y);
  y = addTable(doc,
    ['Parameter', 'Value', 'Remarks'],
    [
      ['Well Name', 'SYNTH-DLJ-A', 'Exploration'],
      ['Field', 'Duliajan (Upper Assam)', 'OIL India Ltd.'],
      ['Latitude / Longitude', '27.3850°N / 95.3280°E', 'WGS 84'],
      ['Spud Date', '10 March 2023', '—'],
      ['Total Depth', '3200 m MD', 'Barail Fm.'],
      ['Surface Casing', '13-3/8" at 850m', 'Cemented to surface'],
      ['Intermediate Casing', '9-5/8" at 1650m', 'Cemented to 1200m'],
      ['Mud System', 'WBM → OBM at 2900m', 'Switched for Barail'],
      ['Final Status', 'Completed', 'P&A after evaluation'],
    ], y);

  // Page 2 — Drilling Section
  doc.addPage();
  addFooter(doc, 2);
  y = 50;

  y = addSection(doc, '3', 'DRILLING OPERATIONS', y);
  y = addSection(doc, '3.1', 'Surface Section (0–850m)', y);
  y = addParagraph(doc, 'The surface section was drilled with a 17-1/2" bit through Alluvium deposits. Drilling proceeded without significant problems. 13-3/8" surface casing was set at 850m and cemented to surface with standard class G cement. Cement bond log (CBL) confirmed satisfactory bond.', y);

  y = addSection(doc, '3.2', 'Tipam Section Drilling (850–1650m)', y);
  y = addParagraph(doc, 'While drilling through the Tipam sandstone at 1450m, torque increased from the baseline of 350 Nm to approximately 420 Nm. The increase was attributed to tight hole conditions arising from clay swelling in the interbedded clay layers.\n\nMud weight was maintained at 10.5 PPG. A wiper trip was performed and the hole was cleaned satisfactorily. Mud properties were adjusted to improve inhibition.', y);
  y = addTable(doc,
    ['Parameter', 'Before Event', 'During Event', 'After Mitigation'],
    [
      ['Torque (Nm)', '350', '420', '360'],
      ['Mud Weight (PPG)', '10.5', '10.5', '10.7'],
      ['Pump Pressure (psi)', '2800', '2800', '2800'],
      ['ROP (m/hr)', '12', '8', '10'],
    ], y);

  // Page 3 — Stuck Pipe
  doc.addPage();
  addFooter(doc, 3);
  y = 50;

  y = addSection(doc, '4', 'DRILLING PROBLEMS', y);
  y = addSection(doc, '4.1', 'Stuck Pipe Event — Barail Formation (3040m)', y);
  y = addParagraph(doc, 'At 3040m depth in the Barail formation, the drill pipe became stuck. Differential sticking was suspected as the primary mechanism due to thick mud cake buildup observed on the permeable sand section. The pipe became completely immovable after approximately 20 minutes of no circulation.', y);
  y = addParagraph(doc, 'Mud weight at the time of the event was 12.2 PPG. Torque reading had reached 520 Nm before the pipe became stuck. Pump pressure was recorded at 3200 psi.', y);

  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Depth of Incident', '3040 m MD'],
      ['Formation', 'Barail (Oligocene)'],
      ['Sticking Mechanism', 'Differential Sticking'],
      ['Mud Weight', '12.2 PPG'],
      ['Last Torque Reading', '520 Nm'],
      ['Pump Pressure', '3200 psi'],
      ['Time Stuck', '~6 hours total'],
      ['NPT', '6 hours'],
    ], y);

  y = addParagraph(doc, 'Mitigation Actions:\n• Jarring sequence initiated immediately\n• After 4 hours of jarring with no success, diesel-based spotting fluid pumped\n• Pipe freed after total 6 hours of remedial operations\n• Mud system adjusted to reduce filtrate loss\n• Lubricant added to mud system', y);

  y = addParagraph(doc, 'Recommendations:\n• Monitor differential pressure closely when drilling through Barail sand sections\n• Maintain continuous circulation at all times\n• Consider using non-damaging mud system when entering Barail\n• Keep pipe moving at all times in permeable zones', y);

  // Page 4 — Mud Loss
  doc.addPage();
  addFooter(doc, 4);
  y = 50;

  y = addSection(doc, '4.2', 'Mud Loss Event — Barail Formation (3080m)', y);
  y = addParagraph(doc, 'Partial mud loss of approximately 15 barrels per hour was observed at 3080m in a fractured section of the Barail formation. The losses were attributed to a natural fracture network encountered while drilling through the transition zone between sand and shale members of the Barail Group.', y);

  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Depth', '3080 m MD'],
      ['Formation', 'Barail (fractured zone)'],
      ['Loss Rate', '~15 bbl/hr'],
      ['Mud Weight', '12.4 PPG'],
      ['Torque', '380 Nm'],
      ['Pump Pressure', '2600 psi'],
    ], y);

  y = addParagraph(doc, 'LCM (Lost Circulation Material) pill was pumped with a blend of fine to coarse materials. Losses were reduced to approximately 5 barrels per hour. Drilling continued with controlled losses.\n\nRecommendation: Barail fracture zones require LCM availability on-site. Reduce ECD when approaching known loss zones.', y);

  y = addSection(doc, '5', 'LESSONS LEARNED', y);
  y = addParagraph(doc, '1. Barail formation in the Duliajan area is prone to differential sticking in permeable sand sections at depths around 3000-3100m.\n\n2. Continuous circulation is critical in Barail to prevent mud cake buildup.\n\n3. Pre-stage LCM materials before entering Barail fractured zones.\n\n4. Monitor torque trends closely — torque > 500 Nm in Barail should trigger immediate remedial action.\n\n5. Consider switching to oil-based mud system before entering Barail formation.', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENT 2: Well Completion Report — DLJ-B
   ═══════════════════════════════════════════════════════════ */
function generateWCR_DLJ_B() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(systemDocsDir, 'WCR_SYNTH-DLJ-B_2022.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'WELL COMPLETION REPORT', 'WCR/DLJ-B/2022/031', '15 December 2022');
  let y = 155;

  y = addSection(doc, '1', 'EXECUTIVE SUMMARY', y);
  y = addParagraph(doc, 'Well SYNTH-DLJ-B is an exploration well located in the Duliajan field, Upper Assam Basin. The well was spudded on 05 June 2022 and reached total depth of 3180m. The primary objective was evaluation of Barail Group reservoirs.\n\nTwo significant drilling incidents were encountered: a stuck pipe event at 3050m and an overpressure/kick event at 3120m in the Barail formation. Both events were successfully managed with standard well control procedures.', y);

  y = addSection(doc, '2', 'WELL INFORMATION', y);
  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Well Name', 'SYNTH-DLJ-B'],
      ['Location', '27.3980°N / 95.3100°E'],
      ['Spud Date', '05 June 2022'],
      ['TD Reached', '3180 m MD'],
      ['Target Formation', 'Barail Group'],
      ['Mud System', 'WBM → OBM'],
      ['Final Status', 'Completed / P&A'],
    ], y);

  // Page 2
  doc.addPage();
  addFooter(doc, 2);
  y = 50;

  y = addSection(doc, '5', 'DRILLING PROBLEMS', y);
  y = addSection(doc, '5.1', 'Stuck Pipe Incident — Barail Formation (3050m)', y);
  y = addParagraph(doc, 'At 3050m depth in the Barail formation, a stuck pipe event occurred. The sticking mechanism was identified as pack-off type due to wellbore instability in the shale section. Circulation was lost temporarily before the pipe became stuck.\n\nDrilling parameters at the time:\n• Mud weight: 12.0 PPG\n• Torque: 510 Nm (last reading before stuck)\n• Pump pressure: 3350 psi\n• RPM: 0 (stopped)\n• ROP: 0 (stopped)', y);

  y = addParagraph(doc, 'Jarring was attempted with no success for 3 hours. A high-viscosity pill was pumped. The pipe was eventually freed by working with increased pump rate and rotation. Total NPT: 18 hours.\n\nThis is the second stuck pipe event recorded in the Barail formation in this area, following the DLJ-A event at a similar depth (3040m). This confirms the regional risk pattern.', y);

  y = addTable(doc,
    ['Parameter', 'DLJ-B (this well)', 'DLJ-A (offset)'],
    [
      ['Stuck Depth', '3050 m', '3040 m'],
      ['Formation', 'Barail', 'Barail'],
      ['Mechanism', 'Pack-off', 'Differential'],
      ['Mud Weight (PPG)', '12.0', '12.2'],
      ['Torque (Nm)', '510', '520'],
      ['NPT (hours)', '18', '6'],
    ], y);

  // Page 3
  doc.addPage();
  addFooter(doc, 3);
  y = 50;

  y = addSection(doc, '5.2', 'Well Control Event — Barail Formation (3120m)', y);
  y = addParagraph(doc, 'At 3120m depth in the Barail formation, an unexpected pore pressure increase was detected. Kick indicators included:\n• Increase in flow rate\n• Pit volume gain of 8 barrels\n\nThe well was shut in per standard well control procedures. Kill weight mud was mixed at 12.8 PPG and circulated. The well was secured after 2 full circulations.\n\nThis pore pressure anomaly suggests that deeper Barail sections in this area may have higher-than-expected pore pressures.', y);

  y = addSection(doc, '6', 'CONCLUSIONS & LESSONS LEARNED', y);
  y = addParagraph(doc, '1. Barail shale sections between 3000-3100m are prone to wellbore instability and pack-off type sticking.\n\n2. Multiple wells (DLJ-A, DLJ-B) confirm stuck pipe risk in Barail at ~3040-3050m depth.\n\n3. Pore pressure can increase significantly in deeper Barail sections. Monitor pit volumes and flow rates continuously.\n\n4. Maintain adequate mud weight to prevent hole collapse in Barail shale.\n\n5. Short trips recommended every 100m in Barail formation.\n\n6. Have kill weight mud materials readily available when drilling Barail below 3100m.', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENT 3: Drilling Report — DLJ-D
   ═══════════════════════════════════════════════════════════ */
function generateDR_DLJ_D() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(systemDocsDir, 'DrillingReport_SYNTH-DLJ-D_2022.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'DAILY DRILLING REPORT — FINAL SUMMARY', 'DDR/DLJ-D/2022/018', '18 April 2022');
  let y = 155;

  y = addSection(doc, '1', 'WELL SUMMARY', y);
  y = addParagraph(doc, 'This report summarizes the drilling operations for well SYNTH-DLJ-D, an exploration well in the Duliajan field. The well encountered significant mud loss issues in the Tipam formation and a mechanical stuck pipe event in the Barail formation.', y);

  y = addSection(doc, '3', 'DRILLING PROBLEMS SUMMARY', y);
  y = addSection(doc, '3.1', 'Mud Loss Event — Tipam Formation (1650m)', y);
  y = addParagraph(doc, 'At 1650m in the Tipam sandstone, severe mud loss was encountered. Losses reached 30 barrels per hour into a highly permeable sand zone. Multiple LCM pills were pumped with limited success. A cement plug was set at 1640m, drilled through, and drilling continued with a reduced mud weight of 10.2 PPG.\n\nThe Tipam high-permeability zones in this area consistently present loss challenges.', y);

  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Depth', '1650 m MD'],
      ['Formation', 'Tipam Sandstone'],
      ['Loss Rate', '30 bbl/hr (severe)'],
      ['Mud Weight', '10.8 → 10.2 PPG'],
      ['LCM Treatment', 'Multiple pills'],
      ['Cement Plug', 'Set at 1640m'],
    ], y);

  // Page 2
  doc.addPage();
  addFooter(doc, 2);
  y = 50;

  y = addSection(doc, '3.2', 'Stuck Pipe Event — Barail Formation (3150m)', y);
  y = addParagraph(doc, 'Mechanical sticking occurred at 3150m in the Barail formation. The cause was identified as key seating in a dog-leg with a severity of 3.5°/30m. The pipe could not be rotated or reciprocated.\n\nJarring freed the pipe after 2 hours of operations. The section was subsequently reamed to eliminate the key seat.\n\nRecommendation: Monitor dog-leg severity carefully. Ensure BHA design is compatible with planned well trajectory.', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

/* ═══════════════════════════════════════════════════════════
   DEMO PDFS — For upload demonstration (NOT pre-loaded)
   ═══════════════════════════════════════════════════════════ */

function generateDemoPDF_1() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(demoPdfsDir, 'WCR_SYNTH-DLJ-E_2021_Overpressure_Report.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'WELL COMPLETION REPORT', 'WCR/DLJ-E/2021/012', '28 February 2021');
  let y = 155;

  y = addSection(doc, '1', 'EXECUTIVE SUMMARY', y);
  y = addParagraph(doc, 'Well SYNTH-DLJ-E is an exploration well located in the Digboi field area, Upper Assam Basin. The well was drilled to a total depth of 3400m. A significant overpressure event was encountered in the Barail formation at 3200m depth, resulting in a gas influx and well control situation lasting 6 hours.', y);

  y = addSection(doc, '2', 'WELL DATA', y);
  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Well Name', 'SYNTH-DLJ-E'],
      ['Field', 'Digboi (Upper Assam)'],
      ['Location', '27.3300°N / 95.3400°E'],
      ['Total Depth', '3400 m MD'],
      ['Spud Date', '12 August 2020'],
      ['Completion Date', '28 February 2021'],
    ], y);

  y = addSection(doc, '3', 'OVERPRESSURE EVENT — BARAIL (3200m)', y);
  y = addParagraph(doc, 'At 3200m depth, significant overpressure was encountered in the Barail formation. Gas influx was detected with the following indicators:\n\n• Sudden increase in background gas from 2% to 15%\n• Pit volume gain of 12 barrels in 3 minutes\n• Drilling break — ROP increased from 2 m/hr to 8 m/hr\n• Pump pressure dropped by 200 psi\n\nThe well was immediately shut in using the soft shut-in procedure. SIDPP (Shut-In Drill Pipe Pressure) was recorded at 580 psi.\n\nKill weight mud was calculated at 13.2 PPG (from original 12.3 PPG). The well was killed using the Driller\'s Method with two complete circulations.\n\nTotal well control event duration: 6 hours\nCasualties: None\nEquipment damage: None', y);

  doc.addPage();
  addFooter(doc, 2);
  y = 50;

  y = addSection(doc, '4', 'PORE PRESSURE ANALYSIS', y);
  y = addParagraph(doc, 'Post-event analysis revealed that the Barail formation in the Digboi area exhibits higher pore pressures than predicted by the pre-drill model. The actual pore pressure gradient was 13.0 PPG equivalent at 3200m, compared to the predicted 11.5 PPG.\n\nThis discrepancy suggests a transition zone from normally pressured to overpressured Barail exists between 3100-3200m in this area. Future wells targeting Barail at these depths should be planned with appropriate mud weight margins.', y);

  y = addSection(doc, '5', 'LESSONS LEARNED', y);
  y = addParagraph(doc, '1. Deep Barail sections (>3100m) in the Digboi-Duliajan area show higher-than-expected pore pressures.\n\n2. Pre-plan for heavier kill mud availability (13.5+ PPG) when drilling Barail below 3100m.\n\n3. Real-time pore pressure monitoring using d-exponent and seismic data should be employed.\n\n4. Casing point at top of Barail should be re-evaluated for future wells.\n\n5. Maintain vigilant monitoring of kick indicators including background gas, pit volume, and drilling breaks.', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

function generateDemoPDF_2() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(demoPdfsDir, 'MudReport_SYNTH-DLJ-F_2024_Torque_Analysis.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'MUD ENGINEERING REPORT', 'MER/DLJ-F/2024/009', '15 January 2024');
  let y = 155;

  y = addSection(doc, '1', 'SCOPE', y);
  y = addParagraph(doc, 'This report covers the mud engineering operations for well SYNTH-DLJ-F in the Duliajan field. The well was drilled to 2800m total depth. A significant torque spike event occurred in the Tipam formation at 1200m depth due to a suspected micro-dog-leg causing friction.', y);

  y = addSection(doc, '2', 'MUD PROGRAM SUMMARY', y);
  y = addTable(doc,
    ['Section', 'Formation', 'Mud Type', 'Weight (PPG)', 'Remarks'],
    [
      ['Surface (0-850m)', 'Alluvium', 'Spud Mud', '8.8-9.0', 'Bentonite-based'],
      ['Intermediate (850-1800m)', 'Tipam', 'WBM (KCl-Polymer)', '10.0-10.5', 'Inhibitive'],
      ['Production (1800-2800m)', 'Tipam (deep)', 'WBM Enhanced', '10.2-10.8', 'Lubricant added'],
    ], y);

  y = addSection(doc, '3', 'TORQUE SPIKE EVENT — TIPAM (1200m)', y);
  y = addParagraph(doc, 'At 1200m depth in the Tipam formation, a sudden torque spike was observed. Torque increased from the baseline of 320 Nm to 480 Nm within a 5-meter interval. The event coincided with a suspected micro-dog-leg identified on the directional survey.\n\nDrilling Parameters at Time of Event:\n• Torque: 480 Nm (peak) — normal baseline 320 Nm\n• Mud Weight: 10.0 PPG\n• Pump Pressure: 2900 psi\n• RPM: 90\n• ROP: 5 m/hr (reduced from 12 m/hr)\n\nCorrective Actions:\n1. Performed short trip (pulled back 50m, ran back to bottom)\n2. Added diesel-based lubricant to mud system (2% by volume)\n3. Increased flow rate to improve hole cleaning\n4. Torque normalized to 340 Nm after treatment\n\nRecommendation: Survey frequently in Tipam to detect micro-dog-legs early. Consider reaming problematic sections before continuing.', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

function generateDemoPDF_3() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(demoPdfsDir, 'GeologicalReport_Barail_Formation_Study_2023.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'GEOLOGICAL FORMATION STUDY REPORT', 'GEO/BAR/2023/005', '15 November 2023');
  let y = 155;

  y = addSection(doc, '1', 'INTRODUCTION', y);
  y = addParagraph(doc, 'This geological study report presents a comprehensive analysis of the Barail Group formations across the Duliajan-Digboi area of Upper Assam. The study incorporates data from 8 wells drilled between 2019-2023 and identifies key risk zones based on lithological variations, pore pressure trends, and historical drilling incidents.', y);

  y = addSection(doc, '2', 'BARAIL GROUP — OVERVIEW', y);
  y = addParagraph(doc, 'The Barail Group (Oligocene age) in the study area consists of alternating sandstone and shale members with occasional coal seams. The formation is encountered between 2880m and 3300m depth across the study area, with significant lateral variation in thickness and lithology.\n\nKey characteristics:\n• Top of Barail: 2880m (DLJ-J) to 2980m (ACTIVE-01)\n• Base of Barail: 3100m (DLJ-C) to 3300m (DLJ-D)\n• Dominant lithology: Fine-grained sandstone interbedded with dark grey shale\n• Fracture zones: Commonly observed between 3060-3100m\n• Pore pressure: Normal to slightly overpressured (11.5-13.0 PPG equivalent)', y);

  y = addSection(doc, '3', 'RISK ZONES IDENTIFIED', y);
  y = addTable(doc,
    ['Depth Range', 'Risk Type', 'Severity', 'Wells Affected', 'Formation'],
    [
      ['3000-3060m', 'Stuck Pipe', 'HIGH', 'DLJ-A, DLJ-B, DLJ-G', 'Barail (sand/shale)'],
      ['3060-3100m', 'Mud Loss', 'MEDIUM', 'DLJ-A, DLJ-I', 'Barail (fractured)'],
      ['3100-3200m', 'Overpressure', 'HIGH', 'DLJ-B, DLJ-E', 'Barail (deep shale)'],
      ['3150-3200m', 'Key Seating', 'MEDIUM', 'DLJ-D', 'Barail (dog-leg zone)'],
      ['1400-1700m', 'Torque Spikes', 'LOW', 'DLJ-A, DLJ-C, DLJ-F', 'Tipam (clay swelling)'],
    ], y);

  doc.addPage();
  addFooter(doc, 2);
  y = 50;

  y = addSection(doc, '4', 'REGIONAL STUCK PIPE ANALYSIS', y);
  y = addParagraph(doc, 'Analysis of stuck pipe events across the study area reveals a consistent risk pattern in the Barail formation between 3000-3060m depth. Four wells (DLJ-A, DLJ-B, DLJ-D, DLJ-G) experienced stuck pipe at this depth range, with the following common factors:\n\n1. All events occurred in the sand/shale transition zone of the Barail\n2. Differential sticking and pack-off were the primary mechanisms\n3. Mud weights ranged from 12.0 to 12.5 PPG at time of events\n4. Torque readings exceeded 480 Nm in all cases before sticking occurred\n\nThis pattern strongly suggests that any new wells planned in this area should implement proactive measures when approaching the 3000-3060m interval in the Barail formation.', y);

  y = addSection(doc, '5', 'RECOMMENDATIONS FOR FUTURE WELLS', y);
  y = addParagraph(doc, '1. MANDATORY: Switch to oil-based or synthetic-based mud before entering Barail formation\n2. Set casing at top of Barail if wellbore stability concerns exist\n3. Reduce WOB and increase RPM when drilling through 3000-3060m in Barail\n4. Maintain continuous circulation — NEVER stop circulation in Barail\n5. Pre-stage 50 bbls of spotting fluid and LCM material before entering risk zones\n6. Plan casing point review at 3100m to address potential overpressure below\n7. Implement real-time torque monitoring with automatic alerts at 480 Nm threshold\n8. Conduct wiper trips every 50m when drilling Barail below 3000m', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

function generateDemoPDF_4() {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filePath = path.join(demoPdfsDir, 'IncidentReport_SYNTH-DLJ-H_Cementing_2022.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  addHeader(doc, 'INCIDENT INVESTIGATION REPORT', 'IIR/DLJ-H/2022/003', '15 July 2022');
  let y = 155;

  y = addSection(doc, '1', 'INCIDENT SUMMARY', y);
  y = addParagraph(doc, 'This report documents the cementing problem encountered during the casing operation of well SYNTH-DLJ-H at 750m depth in the Girujan Clay Formation. Incomplete cement displacement was observed, with the Cement Bond Log (CBL) showing channels behind the 9-5/8" casing.', y);

  y = addSection(doc, '2', 'INCIDENT DETAILS', y);
  y = addTable(doc,
    ['Parameter', 'Value'],
    [
      ['Well', 'SYNTH-DLJ-H'],
      ['Date', '02 April 2022'],
      ['Depth', '750 m MD'],
      ['Formation', 'Girujan Clay'],
      ['Casing Size', '9-5/8"'],
      ['Cement Type', 'Class G + Additives'],
      ['Problem', 'Incomplete displacement'],
      ['Severity', 'Medium'],
    ], y);

  y = addSection(doc, '3', 'ROOT CAUSE ANALYSIS', y);
  y = addParagraph(doc, 'The root cause analysis identified the following contributing factors:\n\n1. Insufficient spacer volume between mud and cement — only 15 bbl used (recommended: 25+ bbl)\n2. Poor casing centralization in the washed-out Girujan section\n3. Girujan clay contaminated the cement slurry during displacement\n4. Pump rate during cement displacement was below the turbulent flow threshold\n5. No cement float equipment was used, allowing U-tubing\n\nThe Girujan Clay formation is particularly challenging for cement operations due to:\n• High plasticity clay causing irregular borehole geometry\n• Tendency to wash out, creating enlarged hole sections\n• Clay-cement interaction leading to contamination channels', y);

  y = addSection(doc, '4', 'CORRECTIVE ACTIONS & LESSONS LEARNED', y);
  y = addParagraph(doc, '1. Remedial cement squeeze performed — CBL improved to acceptable levels\n2. Future wells: Use minimum 25 bbl spacer in Girujan sections\n3. Improve casing centralization — use bow-spring centralizers at closer spacing in Girujan\n4. Increase cement displacement pump rate to achieve turbulent flow\n5. Use cement with clay-inhibiting additives when cementing through Girujan\n6. Consider running caliper log before casing to identify washouts', y);

  doc.end();
  console.log(`  ✓ Created: ${filePath}`);
  return filePath;
}

/* ═══════════════════════════════════════════════════════════
   MAIN — Generate all PDFs
   ═══════════════════════════════════════════════════════════ */
async function main() {
  console.log('\n[PDF Generator] Creating realistic PDF documents...\n');

  console.log('System Legacy PDFs (pre-loaded in system):');
  generateWCR_DLJ_A();
  generateWCR_DLJ_B();
  generateDR_DLJ_D();

  console.log('\nDemo Upload PDFs (for upload demonstration):');
  generateDemoPDF_1();
  generateDemoPDF_2();
  generateDemoPDF_3();
  generateDemoPDF_4();

  console.log('\n[PDF Generator] ✓ All PDFs generated successfully!');
  console.log(`\nSystem PDFs location: ${systemDocsDir}`);
  console.log(`Demo PDFs location:   ${demoPdfsDir}`);
  console.log('\nDemo PDFs are for manual upload via the Documents page to test legacy data storage.');
}

main();
