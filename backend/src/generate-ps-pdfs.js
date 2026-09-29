const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../demo-pdfs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function drawHeader(doc, title, reportNo, date) {
  doc.rect(0, 0, 612, 4).fill('#c2410c');
  doc.rect(0, 4, 612, 60).fill('#1a1a2e');
  doc.fontSize(8).fillColor('#ffffff').text('RESTRICTED — INTERNAL USE ONLY', 40, 14, { align: 'right', width: 530 });
  doc.fontSize(16).fillColor('#ea580c').text('ONGC — MUMBAI REGION', 40, 20);
  doc.fontSize(7).fillColor('#aaaacc').text('Oil and Natural Gas Corporation | Western Offshore Basin', 40, 40);
  doc.fontSize(7).fillColor('#aaaacc').text(`Report No: ${reportNo}  |  Date: ${date}`, 40, 50, { align: 'right', width: 530 });
  doc.moveTo(40, 72).lineTo(572, 72).strokeColor('#ea580c').lineWidth(2).stroke();
  doc.fillColor('#000000');
  doc.y = 82;
  doc.fontSize(14).fillColor('#1a1a2e').text(title, 40, 85, { align: 'center', width: 530 });
  doc.moveDown(1.5);
}

function sectionTitle(doc, title) {
  doc.moveDown(0.5);
  doc.rect(40, doc.y, 530, 18).fill('#f1f5f9');
  doc.fontSize(10).fillColor('#1e40af').text(title, 48, doc.y + 4, { width: 520 });
  doc.fillColor('#000000');
  doc.moveDown(1.2);
}

function bodyText(doc, text) {
  doc.fontSize(9).fillColor('#333333').text(text, 48, doc.y, { width: 510, lineGap: 3 });
  doc.moveDown(0.5);
}

function tableRow(doc, label, value) {
  const y = doc.y;
  doc.fontSize(8).fillColor('#666666').text(label, 55, y, { width: 140 });
  doc.fontSize(9).fillColor('#111111').text(value, 200, y, { width: 360 });
  doc.moveDown(0.8);
}

function footer(doc, pageNum, totalPages) {
  doc.rect(0, 740, 612, 52).fill('#f8fafc');
  doc.moveTo(40, 740).lineTo(572, 740).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  doc.fontSize(7).fillColor('#94a3b8').text('CLASSIFICATION: RESTRICTED  |  ONGC Mumbai Region  |  Bandra-Kurla Complex, Mumbai', 40, 750, { width: 530, align: 'center' });
  doc.fontSize(7).fillColor('#94a3b8').text(`Page ${pageNum} of ${totalPages}`, 40, 762, { width: 530, align: 'center' });
}

// ══════════════════════════════════════════════════════════════
// PDF 1: PS26121_WCR_Mumbai_Offshore_2024.pdf
// Well Completion Report — Mumbai High field, stuck pipe + loss
// ══════════════════════════════════════════════════════════════
function createPDF1() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const filePath = path.join(outDir, 'PS26121_WCR_Mumbai_Offshore_2024.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  // ── Page 1 ──
  drawHeader(doc, 'WELL COMPLETION REPORT', 'PS26121/WCR/MBH/2024/031', '18-Jun-2024');

  sectionTitle(doc, '1. WELL INFORMATION');
  tableRow(doc, 'Well Name:', 'PS26121-MBH-07');
  tableRow(doc, 'Field:', 'Mumbai High South, Western Offshore Basin');
  tableRow(doc, 'Block:', 'MB-OSN-2022/3');
  tableRow(doc, 'Platform:', 'BHS-172 (Mumbai High South)');
  tableRow(doc, 'Spud Date:', '22-Jan-2024');
  tableRow(doc, 'Completion Date:', '10-Jun-2024');
  tableRow(doc, 'Total Depth:', '2,850 m MD (2,780 m TVD)');
  tableRow(doc, 'Water Depth:', '76 m');
  tableRow(doc, 'Well Type:', 'Development — Horizontal (Offshore)');
  tableRow(doc, 'Rig:', 'Sagar Gaurav (JU-375, 2500 HP)');
  tableRow(doc, 'Latitude:', '19.3845° N');
  tableRow(doc, 'Longitude:', '71.3628° E');

  sectionTitle(doc, '2. DRILLING SUMMARY');
  bodyText(doc, 'Well PS26121-MBH-07 was drilled as a horizontal development well targeting the Bombay Formation (L-III limestone reservoir) at approximately 2,500m TVD in the Mumbai High South field. The horizontal section extended 320m within the reservoir to maximize production contact area.');
  bodyText(doc, 'The 20" conductor was driven to 180m below mudline. Surface casing (13-3/8") was set at 850m through the Neogene sediments. Intermediate casing (9-5/8") was set at 2,100m through the Panna formation. A 7" production liner was run through the horizontal section to 2,850m MD.');
  bodyText(doc, 'Total drilling time: 139 days including 18 days of NPT due to weather downtime (monsoon), stuck pipe, and mud loss events as detailed in Section 4.');

  sectionTitle(doc, '3. FORMATION TOPS');
  tableRow(doc, 'Seabed:', '0 m (76m water depth)');
  tableRow(doc, 'Neogene Sediments:', '0 - 780 m');
  tableRow(doc, 'Panna Formation:', '780 - 1,650 m');
  tableRow(doc, 'Bassein Formation:', '1,650 - 2,200 m (limestone/marl)');
  tableRow(doc, 'Bombay Formation:', '2,200 - 2,850 m TD (L-III reservoir)');

  footer(doc, 1, 4);

  // ── Page 2 ──
  doc.addPage();
  drawHeader(doc, 'WELL COMPLETION REPORT — PS26121-MBH-07', 'PS26121/WCR/MBH/2024/031', '18-Jun-2024');

  sectionTitle(doc, '4. DRILLING PROBLEMS & INCIDENTS');

  sectionTitle(doc, '4.1 Stuck Pipe Event (Bassein Formation — 2,180m)');
  bodyText(doc, 'At 2,180m MD while drilling through the Bassein formation (interbedded limestone and marl), the drill string became stuck during a short trip. The pipe had been pulled 30m off bottom for a wiper trip when it became stuck while running back to bottom. Pack-off type sticking was identified due to wellbore instability in the marl sections.');
  bodyText(doc, 'DRILLING PARAMETERS AT TIME OF INCIDENT:');
  tableRow(doc, 'Depth:', '2,180 m MD');
  tableRow(doc, 'Mud Weight:', '11.8 PPG (WBM — Water Based Mud)');
  tableRow(doc, 'Torque:', '490 Nm (max before stuck)');
  tableRow(doc, 'Pump Pressure:', '2,950 psi');
  tableRow(doc, 'Overpull:', 'Attempted 80,000 lbs over string weight');
  tableRow(doc, 'Hole Angle:', '45° (building section)');
  bodyText(doc, 'REMEDIAL ACTIONS TAKEN:');
  bodyText(doc, '• Applied overpull up to 80,000 lbs — no movement.\n• Jarring sequence (mechanical jars) for 4 hours — intermittent movement detected.\n• Pumped high-viscosity sweep (100 bbls) to clean annulus.\n• Increased mud weight to 12.2 PPG to stabilize marl sections.\n• Pipe freed after 7 hours of working. Total NPT: 9 hours including mud weight adjustment.\n• Estimated cost impact: ₹28 Lakhs (including additional mud materials for offshore logistics).');
  bodyText(doc, 'ROOT CAUSE: The Bassein marl sections are reactive and prone to swelling and sloughing when exposed to water-based mud for extended periods. The 45° hole angle created a high-side ledge where cuttings accumulated. The combination of cuttings accumulation and marl instability caused pack-off.');
  bodyText(doc, 'RECOMMENDATIONS:\n• Switch to Oil-Based Mud (OBM) before entering Bassein formation in future wells.\n• Maintain continuous circulation during trips — avoid static pipe in Bassein marl.\n• Perform frequent wiper trips (every 100m) in the building section.\n• Ensure adequate hole cleaning — minimum annular velocity of 120 ft/min in directional sections.');

  footer(doc, 2, 4);

  // ── Page 3 ──
  doc.addPage();
  drawHeader(doc, 'WELL COMPLETION REPORT — PS26121-MBH-07', 'PS26121/WCR/MBH/2024/031', '18-Jun-2024');

  sectionTitle(doc, '4.2 Mud Loss Event (Bombay Formation — 2,480m)');
  bodyText(doc, 'Severe total mud loss was encountered at 2,480m while drilling the horizontal section in the Bombay Formation (L-III limestone). Losses went from zero to total (no returns) within minutes of penetrating a vuggy/fractured limestone interval.');
  bodyText(doc, 'PARAMETERS DURING LOSS EVENT:');
  tableRow(doc, 'Depth:', '2,480 m MD (2,500 m TVD)');
  tableRow(doc, 'Mud Weight:', '10.2 PPG (reduced for reservoir drilling)');
  tableRow(doc, 'Loss Rate:', 'Total loss — no returns to surface');
  tableRow(doc, 'Annular Pressure:', 'Lost hydrostatic column');
  tableRow(doc, 'Formation Pressure:', '~9.8 PPG EMW (depleted reservoir)');
  bodyText(doc, 'REMEDIAL ACTIONS:\n• Pumped 120 bbls of LCM pill with coarse blend (100 ppb CaCO3 + 50 ppb cedar fiber + 25 ppb graphite).\n• Pulled out of hole. Set a crosslinked gel plug (Flo-Stop) at 2,475-2,485m.\n• Drilled through plug after 12 hours — losses reduced to 15 bbl/hr (manageable).\n• Continued drilling with controlled losses to TD (2,850m MD).\n• Total NPT: 2.5 days. Cost impact: ₹55 Lakhs (including expensive offshore LCM logistics).');
  bodyText(doc, 'LESSONS LEARNED:\n• The L-III limestone reservoir in Mumbai High South has extensive vugular porosity and natural fractures. Total losses should be expected and planned for.\n• Pre-stage a minimum of 300 bbls of LCM material on the platform before entering the reservoir section.\n• Consider drilling the reservoir section with aerated mud or managed pressure drilling to reduce loss severity.\n• Future horizontal wells should plan for at least 3 days of loss-related NPT in the AFE.');

  sectionTitle(doc, '4.3 Weather Downtime');
  bodyText(doc, 'Operations were suspended for 6 days between 2-Jun and 8-Jun due to Cyclone Remal approach. The jackup rig was pre-loaded and all equipment secured. No damage to rig or equipment. Operations resumed on 8-Jun after weather cleared. Sea state returned to <2m significant wave height.');

  footer(doc, 3, 4);

  // ── Page 4 ──
  doc.addPage();
  drawHeader(doc, 'WELL COMPLETION REPORT — PS26121-MBH-07', 'PS26121/WCR/MBH/2024/031', '18-Jun-2024');

  sectionTitle(doc, '5. WELL TEST RESULTS');
  bodyText(doc, 'The Bombay Formation L-III reservoir was tested through 7" liner. Horizontal open-hole completion with ICD (Inflow Control Devices) over 320m interval.');
  tableRow(doc, 'Test Duration:', '96 hours (multi-rate flow + build-up)');
  tableRow(doc, 'Initial Flow Rate:', '1,850 BOPD + 1.2 MMscf/d gas');
  tableRow(doc, 'Stabilized Rate:', '1,620 BOPD (choke 32/64")');
  tableRow(doc, 'Water Cut:', '12% (seawater breakthrough from adjacent injector)');
  tableRow(doc, 'GOR:', '648 scf/bbl');
  tableRow(doc, 'Flowing Tubing Pressure:', '890 psi');
  tableRow(doc, 'Reservoir Pressure:', '2,820 psi at datum (depleted from original 4,100 psi)');
  tableRow(doc, 'PI (Productivity Index):', '4.2 bbl/day/psi');

  sectionTitle(doc, '6. SUMMARY & RECOMMENDATIONS');
  bodyText(doc, 'Well PS26121-MBH-07 has been completed successfully as a horizontal L-III oil producer in Mumbai High South. The horizontal section successfully improved reservoir contact, resulting in rates 3x higher than offset vertical wells.');
  bodyText(doc, 'KEY RECOMMENDATIONS FOR FUTURE MUMBAI HIGH WELLS:');
  bodyText(doc, '1. The Bassein formation marl sections (1,650-2,200m) require Oil-Based Mud for wellbore stability, particularly in directional/horizontal wells with inclinations above 30°.\n\n2. Total mud loss in L-III reservoir is inevitable in vuggy zones. Budget minimum ₹50 Lakhs for LCM materials per well. Pre-stage all materials on platform before entering reservoir.\n\n3. Managed Pressure Drilling (MPD) capability should be installed on all Mumbai High South platforms for reservoir drilling to reduce losses and improve wellbore pressure control.\n\n4. Cyclone season (Jun-Sep) must be factored into well planning — minimum 10 days weather contingency in AFE for wells spudded after April.');

  sectionTitle(doc, 'APPROVAL');
  tableRow(doc, 'Prepared By:', 'V. Deshmukh, Senior Drilling Engineer — Offshore');
  tableRow(doc, 'Reviewed By:', 'S. Patil, GM — Drilling Operations (Mumbai)');
  tableRow(doc, 'Approved By:', 'R. Nair, Executive Director — Mumbai Region');

  footer(doc, 4, 4);
  doc.end();
  console.log('  ✓ Created:', filePath);
}

// ══════════════════════════════════════════════════════════════
// PDF 2: PS26121_Incident_Investigation_Kick_Mumbai_2024.pdf
// Kick/overpressure event in Mumbai offshore
// ══════════════════════════════════════════════════════════════
function createPDF2() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const filePath = path.join(outDir, 'PS26121_Incident_Investigation_Blowout_Prevention_2024.pdf');
  doc.pipe(fs.createWriteStream(filePath));

  // ── Page 1 ──
  drawHeader(doc, 'INCIDENT INVESTIGATION REPORT\nGAS KICK — WELL CONTROL EVENT', 'PS26121/IIR/MBH/2024/008', '05-Aug-2024');

  doc.moveDown(0.5);
  doc.rect(48, doc.y, 516, 22).fill('#dc2626');
  doc.fontSize(10).fillColor('#ffffff').text('SEVERITY: HIGH  |  GAS KICK — WELL SHUT-IN  |  DURATION: 14 HOURS', 56, doc.y - 18, { width: 500, align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1.5);

  sectionTitle(doc, '1. INCIDENT SUMMARY');
  tableRow(doc, 'Well:', 'PS26121-MBH-12');
  tableRow(doc, 'Field:', 'Mumbai High North, Western Offshore');
  tableRow(doc, 'Platform:', 'BHN-A (North Complex)');
  tableRow(doc, 'Date/Time:', '01-Aug-2024, 14:22 IST');
  tableRow(doc, 'Depth at Incident:', '2,340 m MD (Bassein Formation)');
  tableRow(doc, 'Water Depth:', '68 m');
  tableRow(doc, 'Crew:', 'Day Shift — Driller: K. Sawant, OIM: J. Mehta');
  tableRow(doc, 'Operation:', 'Drilling ahead at 2,340m — Bassein limestone/gas cap transition');

  sectionTitle(doc, '2. SEQUENCE OF EVENTS');
  bodyText(doc, '14:22 IST — While drilling at 2,340m MD with 11.5 PPG mud weight in the Bassein formation, the following kick indicators were observed:\n• Sudden increase in background gas from 2% to 28% (measured by gas chromatograph)\n• Pit volume gain: +18 barrels over 6 minutes\n• Flow rate increase from 520 GPM to 680 GPM\n• ROP increase from 6 m/hr to 22 m/hr (drilling break)\n• Connection gas readings spiked to 45% total gas');
  bodyText(doc, '14:28 IST — Driller K. Sawant immediately recognized the gas kick and executed emergency well shut-in:\n• Raised kelly/top drive\n• Stopped pumps\n• Closed upper annular BOP\n• Drill pipe shut-in pressure (SIDPP): 520 psi\n• Casing shut-in pressure (SICP): 610 psi\n• Gas type confirmed as methane (99.2%) — no H2S detected');
  bodyText(doc, '14:45 IST — Offshore Installation Manager (OIM) J. Mehta activated Level-2 Emergency Response. All non-essential personnel mustered. Standby vessel Malaviya-7 positioned downwind at 500m.');
  bodyText(doc, '15:30 IST — Kill mud weight calculated at 12.6 PPG (increase of 1.1 PPG). Barite mixing commenced. Estimated 180 bbls required for kill.');
  bodyText(doc, '18:00 IST — Kill circulation initiated using Wait & Weight Method. Initial circulating pressure: 1,850 psi.');
  bodyText(doc, '00:30 IST (02-Aug) — First circulation completed. Gas fully displaced. Flared through platform boom — maximum flare rate estimated at 3 MMscf/d for 45 minutes.');
  bodyText(doc, '04:22 IST (02-Aug) — Second verification circulation completed. Well static. SIDPP = 0, SICP = 0. Well declared secure. Total event duration: 14 hours.');

  footer(doc, 1, 3);

  // ── Page 2 ──
  doc.addPage();
  drawHeader(doc, 'INCIDENT INVESTIGATION — PS26121-MBH-12 GAS KICK', 'PS26121/IIR/MBH/2024/008', '05-Aug-2024');

  sectionTitle(doc, '3. ROOT CAUSE ANALYSIS');
  bodyText(doc, 'PRIMARY CAUSE: The well penetrated an uncharted gas pocket at the top of the Bassein limestone gas cap at 2,340m. The regional geological model predicted the gas-oil contact (GOC) at 2,450m TVD in this area. However, a structural high (anticlinal closure) created a localized gas accumulation 110m shallower than predicted.');
  bodyText(doc, 'CONTRIBUTING FACTORS:');
  bodyText(doc, '1. The pre-drill seismic interpretation (vintage 2019 3D survey) did not have sufficient resolution to identify the subtle structural high. Post-incident depth conversion using updated velocity model confirms the anticlinal feature.');
  bodyText(doc, '2. Mud weight of 11.5 PPG was designed for the expected pore pressure gradient of 10.8 PPG. The gas cap pressure was 12.3 PPG EMW — resulting in a 0.8 PPG underbalance when the gas was penetrated.');
  bodyText(doc, '3. The drilling break (ROP increase from 6 to 22 m/hr) indicated transition from tight limestone to porous gas-bearing limestone. This change was not immediately correlated with the geological prognosis.');

  sectionTitle(doc, '4. DRILLING PARAMETERS ANALYSIS');
  tableRow(doc, 'Pre-kick Mud Weight:', '11.5 PPG');
  tableRow(doc, 'Kill Mud Weight:', '12.6 PPG (Wait & Weight Method)');
  tableRow(doc, 'Gas Cap Pressure:', '12.3 PPG EMW');
  tableRow(doc, 'Kick Volume:', '18 barrels');
  tableRow(doc, 'Kick Intensity:', '0.8 PPG underbalance (severe)');
  tableRow(doc, 'Max SICP:', '780 psi (during gas migration)');
  tableRow(doc, 'Gas Composition:', '99.2% Methane, 0.5% Ethane, 0.3% CO2');
  tableRow(doc, 'H2S:', '0 ppm — Confirmed non-toxic');
  tableRow(doc, 'Max Flare Rate:', '~3 MMscf/d (45 min during displacement)');
  tableRow(doc, 'BOP Rating:', '10,000 psi — Adequate (max SICP was 780 psi)');

  sectionTitle(doc, '5. ENVIRONMENTAL IMPACT');
  bodyText(doc, 'Gas was safely flared through the platform boom during displacement. No uncontrolled gas release to atmosphere. No oil spill. Marine environmental monitoring conducted for 48 hours after incident — no impact detected. OSCP (Oil Spill Contingency Plan) was placed on standby but not activated.');

  footer(doc, 2, 3);

  // ── Page 3 ──
  doc.addPage();
  drawHeader(doc, 'INCIDENT INVESTIGATION — PS26121-MBH-12 GAS KICK', 'PS26121/IIR/MBH/2024/008', '05-Aug-2024');

  sectionTitle(doc, '6. CORRECTIVE ACTIONS');
  bodyText(doc, 'IMMEDIATE ACTIONS (Completed):');
  bodyText(doc, '• Mud weight raised to 13.0 PPG for continued drilling (0.7 PPG trip margin).\n• Updated geological prognosis with revised gas cap depth in this structural block.\n• Emergency response drill conducted for all BHN-A platform personnel.\n• BOP stack pressure-tested to 10,000 psi — passed. All BOPs function-tested satisfactorily.');

  bodyText(doc, 'LONG-TERM ACTIONS (In Progress):');
  bodyText(doc, '• Commission new high-resolution 3D seismic survey over Mumbai High North Complex (planned Q1 2025, budget ₹85 Crores).\n• Update structural maps for all Bassein gas cap wells within 3 km of PS26121-MBH-12.\n• Install automated kick detection system (Safe Influx) on all 4 active rigs in Mumbai High North.\n• Review and update MAASP calculations for all Bassein wells based on actual gas cap pressures encountered.');

  sectionTitle(doc, '7. RECOMMENDATIONS FOR FUTURE WELLS');
  bodyText(doc, '1. GAS CAP RISK: All future wells in Mumbai High North targeting the Bassein formation must treat the interval from 2,200m to 2,500m as a HIGH GAS RISK zone. Minimum mud weight should be 12.0 PPG when entering Bassein, regardless of predicted pore pressure.');
  bodyText(doc, '2. REAL-TIME MONITORING: Continuous gas chromatography with automated alarm thresholds must be operational. Alarm trigger: total gas >15% or any drilling break >2x normal ROP.');
  bodyText(doc, '3. WELL CONTROL READINESS: Kill weight barite for additional 1.5 PPG must be pre-mixed and stored on platform before drilling below 2,000m. Surface BOP test must be conducted within 24 hours of entering Bassein.');
  bodyText(doc, '4. EMERGENCY RESPONSE: Standby vessel must be on location within 1 km during all Bassein drilling operations. Platform Emergency Shutdown System (ESD) to be function-tested weekly during Bassein drilling.');
  bodyText(doc, '5. GEOLOGICAL: Pilot hole with LWD (Logging While Drilling) gamma ray + resistivity must precede any horizontal well in Bassein to identify gas cap depth before committing to build section.');

  sectionTitle(doc, 'INVESTIGATION TEAM');
  tableRow(doc, 'Lead Investigator:', 'Capt. S. Ghosh, HSE Manager — Offshore West');
  tableRow(doc, 'Drilling Expert:', 'A. Fernandes, Chief Drilling Supt. — Mumbai');
  tableRow(doc, 'Geology Expert:', 'Dr. P. Joshi, Chief Geologist — Western Basin');
  tableRow(doc, 'Operations:', 'M. Kulkarni, Platform Manager — BHN-A');

  doc.moveDown(1);
  doc.rect(48, doc.y, 516, 20).fill('#fee2e2');
  doc.fontSize(8).fillColor('#991b1b').text('MANDATORY DISTRIBUTION: All OIMs, Toolpushers, and Drillers on Mumbai High platforms within 24 hours — per ONGC HSE Directive 2024/MH-07.', 56, doc.y - 16, { width: 500, align: 'center' });

  footer(doc, 3, 3);
  doc.end();
  console.log('  ✓ Created:', filePath);
}

console.log('[PDF Generator] Creating PS26121 Mumbai Offshore demo PDFs...\n');
createPDF1();
createPDF2();
console.log('\n[PDF Generator] ✓ Done! Files are in:', outDir);
console.log('Upload these via the Legacy Documents page to test the system.');
