const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../demo-pdfs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function drawHeader(doc, title, reportNo, date, org) {
  doc.rect(0, 0, 612, 4).fill('#c2410c');
  doc.rect(0, 4, 612, 60).fill('#1a1a2e');
  doc.fontSize(8).fillColor('#ffffff').text('RESTRICTED — INTERNAL USE ONLY', 40, 14, { align: 'right', width: 530 });
  doc.fontSize(16).fillColor('#ea580c').text(org || 'ONGC — MUMBAI REGION', 40, 20);
  doc.fontSize(7).fillColor('#aaaacc').text('Ministry of Petroleum & Natural Gas', 40, 40);
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
function footer(doc, pageNum, totalPages, org) {
  doc.rect(0, 740, 612, 52).fill('#f8fafc');
  doc.moveTo(40, 740).lineTo(572, 740).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  doc.fontSize(7).fillColor('#94a3b8').text(`RESTRICTED  |  ${org || 'ONGC Mumbai'}`, 40, 750, { width: 530, align: 'center' });
  doc.fontSize(7).fillColor('#94a3b8').text(`Page ${pageNum} of ${totalPages}`, 40, 762, { width: 530, align: 'center' });
}

// ═══ PDF 3: Mud Engineering Report ═══
function createPDF3() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const fp = path.join(outDir, 'PS26121_Mud_Engineering_Report_BHS_2024.pdf');
  doc.pipe(fs.createWriteStream(fp));

  drawHeader(doc, 'MUD ENGINEERING REPORT', 'PS26121/MUD/MBH/2024/015', '25-Jul-2024');

  sectionTitle(doc, '1. WELL & MUD SYSTEM OVERVIEW');
  tableRow(doc, 'Well:', 'PS26121-MBH-09');
  tableRow(doc, 'Platform:', 'BHS-172, Mumbai High South');
  tableRow(doc, 'Current Depth:', '2,620 m MD');
  tableRow(doc, 'Formation:', 'Bassein Limestone');
  tableRow(doc, 'Mud System:', 'KCl-Polymer (Water Based)');
  tableRow(doc, 'Mud Weight:', '11.6 PPG');
  tableRow(doc, 'Funnel Viscosity:', '48 sec/qt');
  tableRow(doc, 'Plastic Viscosity:', '22 cP');
  tableRow(doc, 'Yield Point:', '18 lb/100ft²');
  tableRow(doc, 'pH:', '10.2');
  tableRow(doc, 'HTHP Filtrate:', '6.8 ml/30min');

  sectionTitle(doc, '2. MUD WEIGHT PROGRAM');
  bodyText(doc, 'The mud weight has been maintained at 11.6 PPG through the Bassein formation as per the drilling program. The pore pressure gradient in this interval is estimated at 10.8 PPG EMW, providing a 0.8 PPG overbalance. Fracture gradient at current depth is 14.2 PPG EMW.');
  bodyText(doc, 'WARNING: Based on offset well data from PS26121-MBH-07, the pore pressure is expected to increase to 12.3 PPG EMW between 2,700m and 2,800m due to a gas cap transition. The mud weight must be increased to minimum 12.8 PPG before drilling below 2,680m.');

  sectionTitle(doc, '3. PROBLEMS ENCOUNTERED');
  bodyText(doc, '3.1 HIGH FILTRATE LOSS (2,450m-2,550m):');
  bodyText(doc, 'HTHP filtrate loss increased from 4.2 ml to 8.5 ml/30min while drilling the lower Panna shale. This was caused by contamination from drilled solids and insufficient polymer concentration. Corrective action: Added 3 ppb PAC-R (polyanionic cellulose) and 5 ppb modified starch. Filtrate reduced to 5.1 ml within 12 hours.');

  bodyText(doc, '3.2 CLAY SWELLING — BASSEIN MARL (2,180m):');
  bodyText(doc, 'Reactive marl in the Bassein formation caused wellbore instability at 2,180m. Torque increased from 380 Nm to 490 Nm. The KCl concentration was increased from 5% to 8% w/v to inhibit clay hydration. Additional 2 ppb glycol-based shale inhibitor was added. Torque normalized within 6 hours of treatment.');

  sectionTitle(doc, '4. RECOMMENDATIONS');
  bodyText(doc, '1. SWITCH TO OBM: For the reservoir section below 2,600m, it is strongly recommended to switch to an Oil-Based Mud system (70:30 OWR) to prevent formation damage and improve wellbore stability in the horizontal section.\n\n2. FILTRATE CONTROL: Maintain HTHP filtrate below 5 ml/30min at all times. Pre-treat with 2 ppb PAC-R before entering new formations.\n\n3. BARITE STOCK: Ensure minimum 50 MT barite is on platform before drilling below 2,680m for emergency mud weight increase.\n\n4. LOSS PREVENTION: Pre-mix 100 bbls of LCM-laden mud (50 ppb CaCO3 fine + 25 ppb mica) before entering the Bombay Formation.');

  sectionTitle(doc, 'PREPARED BY');
  tableRow(doc, 'Mud Engineer:', 'A. Joshi, Senior Mud Engineer — M/s MI-SWACO');
  tableRow(doc, 'Reviewed:', 'D. Kulkarni, Drilling Fluid Supervisor — ONGC');

  footer(doc, 1, 1);
  doc.end();
  console.log('  ✓', fp);
}

// ═══ PDF 4: Geological Well Prognosis ═══
function createPDF4() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const fp = path.join(outDir, 'PS26121_Geological_Prognosis_Mumbai_North_2024.pdf');
  doc.pipe(fs.createWriteStream(fp));

  drawHeader(doc, 'GEOLOGICAL WELL PROGNOSIS REPORT', 'PS26121/GEO/MBN/2024/003', '10-Sep-2024');

  sectionTitle(doc, '1. PROPOSED WELL');
  tableRow(doc, 'Well Name:', 'PS26121-MBN-15 (Proposed)');
  tableRow(doc, 'Field:', 'Mumbai High North Extension');
  tableRow(doc, 'Location:', '19.52°N, 71.28°E');
  tableRow(doc, 'Water Depth:', '72 m');
  tableRow(doc, 'Proposed TD:', '3,100 m MD');
  tableRow(doc, 'Objective:', 'Bombay Fm. L-III Reservoir (oil)');
  tableRow(doc, 'Well Type:', 'Exploration — Vertical with sidetrack option');

  sectionTitle(doc, '2. PREDICTED FORMATION TOPS');
  tableRow(doc, 'Seabed:', '0 m');
  tableRow(doc, 'Neogene Sediments:', '0 - 820 m (unconsolidated sands, clays)');
  tableRow(doc, 'Panna Formation:', '820 - 1,700 m (shale, minor sands)');
  tableRow(doc, 'Bassein Formation:', '1,700 - 2,350 m (limestone, marl)');
  tableRow(doc, 'Bombay Formation:', '2,350 - 3,100 m (L-III limestone reservoir)');

  sectionTitle(doc, '3. PORE PRESSURE & FRACTURE GRADIENT');
  bodyText(doc, 'The pore pressure model for PS26121-MBN-15 is based on offset wells MBH-07, MBH-12, and regional seismic velocity data. Key observations:');
  bodyText(doc, '• Normal hydrostatic gradient (8.6 PPG) from surface to 1,700m.\n• Mild overpressure in Panna shales (10.2-10.8 PPG EMW) from 1,700m to 2,100m.\n• Transition zone at Bassein top (2,100-2,200m): pressure increases to 11.2 PPG EMW.\n• CAUTION: Based on PS26121-MBH-12 kick event (Aug 2024), a gas cap may exist at the top of the Bassein at approximately 2,340m with pressure up to 12.3 PPG EMW. This is 0.6 PPG higher than the regional model predicts.\n• Bombay Formation reservoir pressure: estimated 9.8-10.2 PPG EMW (depleted).');
  bodyText(doc, 'FRACTURE GRADIENT: Estimated 14.0-14.5 PPG EMW in Bassein, dropping to 13.2 PPG EMW in depleted Bombay reservoir.');

  sectionTitle(doc, '4. EXPECTED DRILLING HAZARDS');
  bodyText(doc, '4.1 SHALLOW GAS: Low risk — no shallow gas anomalies on seismic. Standard precautions apply (diverter ready).');
  bodyText(doc, '4.2 OVERPRESSURE / KICK: HIGH RISK at Bassein gas cap (~2,340m). Reference PS26121-MBH-12 incident report. Minimum mud weight 12.0 PPG recommended before entering Bassein.');
  bodyText(doc, '4.3 LOST CIRCULATION: HIGH RISK in Bombay L-III reservoir — total losses expected in vuggy/fractured limestone. Pre-stage 300 bbls LCM.');
  bodyText(doc, '4.4 WELLBORE INSTABILITY: Moderate risk in Bassein marl (reactive clays). OBM recommended. If WBM is used, maintain KCl concentration >7%.');
  bodyText(doc, '4.5 H2S: LOW RISK — No H2S encountered in offset wells. Gas composition: >99% methane.');

  sectionTitle(doc, 'PREPARED BY');
  tableRow(doc, 'Geologist:', 'Dr. P. Joshi, Chief Geologist — Western Basin');
  tableRow(doc, 'Geophysicist:', 'R. Menon, Senior Geophysicist — Seismic');

  footer(doc, 1, 1);
  doc.end();
  console.log('  ✓', fp);
}

// ═══ PDF 5: Daily Drilling Report ═══
function createPDF5() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const fp = path.join(outDir, 'PS26121_Daily_Drilling_Report_DDR_2024.pdf');
  doc.pipe(fs.createWriteStream(fp));

  drawHeader(doc, 'DAILY DRILLING REPORT (DDR)', 'PS26121/DDR/MBH/2024/Day-87', '14-Aug-2024');

  sectionTitle(doc, 'DAILY SUMMARY');
  tableRow(doc, 'Well:', 'PS26121-MBH-07');
  tableRow(doc, 'Report Date:', '14-Aug-2024 (Day 87 of 139)');
  tableRow(doc, 'Depth Start:', '2,450 m MD');
  tableRow(doc, 'Depth End:', '2,492 m MD');
  tableRow(doc, 'Footage:', '42 m');
  tableRow(doc, 'Formation:', 'Bombay Formation — L-III Reservoir');
  tableRow(doc, 'Avg. ROP:', '5.2 m/hr');
  tableRow(doc, 'Rig State:', 'Drilling Ahead');

  sectionTitle(doc, 'OPERATIONS — 24 HOUR SUMMARY');
  bodyText(doc, '00:00 - 06:00: Drilled ahead from 2,450m to 2,468m. ROP averaging 3.0 m/hr in tight limestone. Torque steady at 420-440 Nm. Pump pressure 2,980 psi.');
  bodyText(doc, '06:00 - 06:45: Made connection at 2,468m. Flow check — OK, no flow observed.');
  bodyText(doc, '06:45 - 10:00: Drilled ahead from 2,468m to 2,480m. At 2,478m, ROP increased sharply from 3 m/hr to 14 m/hr — DRILLING BREAK. Driller conducted flow check — positive flow detected. Pit gain: +12 bbls over 4 minutes.');
  bodyText(doc, '10:00 - 10:15: TOTAL LOSSES commenced at 2,480m. Returns dropped to zero within 5 minutes of penetrating fractured/vuggy zone. Pumps stopped.');
  bodyText(doc, '10:15 - 14:00: Pumped LCM pill #1 (100 ppb CaCO3 + 50 ppb cedar fiber + 25 ppb graphite) — 120 bbls. Waited 2 hours for set. Resumed circulation — losses reduced to 35 bbl/hr.');
  bodyText(doc, '14:00 - 18:00: Pumped LCM pill #2 (Flo-Stop crosslinked gel plug at 2,475-2,485m). Waited 4 hours.');
  bodyText(doc, '18:00 - 22:00: Drilled through gel plug. Losses reduced to 15 bbl/hr (manageable). Continued drilling to 2,492m with controlled losses.');
  bodyText(doc, '22:00 - 24:00: Drilled ahead to 2,492m TD for the day. ROP 5.8 m/hr in reservoir limestone. Continued with 15 bbl/hr controlled losses.');

  sectionTitle(doc, 'MUD PROPERTIES (End of Day)');
  tableRow(doc, 'Mud Weight:', '10.2 PPG');
  tableRow(doc, 'Funnel Viscosity:', '52 sec/qt');
  tableRow(doc, 'Plastic Viscosity:', '24 cP');
  tableRow(doc, 'HTHP Filtrate:', '5.4 ml/30min');
  tableRow(doc, 'Mud Losses:', '15 bbl/hr (controlled)');

  sectionTitle(doc, 'NEXT 24 HRS PLAN');
  bodyText(doc, 'Continue drilling horizontal section toward 2,550m. Monitor losses — if >30 bbl/hr, pump additional LCM. Stage cement squeeze if losses become total again. Target ROP: 4-6 m/hr.');

  footer(doc, 1, 1);
  doc.end();
  console.log('  ✓', fp);
}

// ═══ PDF 6: Safety Alert Bulletin ═══
function createPDF6() {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: 70, bottom: 80, left: 40, right: 40 } });
  const fp = path.join(outDir, 'PS26121_Safety_Alert_Bulletin_Offshore_2024.pdf');
  doc.pipe(fs.createWriteStream(fp));

  drawHeader(doc, 'SAFETY ALERT BULLETIN', 'PS26121/SAB/MBH/2024/04', '12-Sep-2024', 'ONGC SAFETY DIRECTORATE');

  doc.moveDown(0.3);
  doc.rect(48, doc.y, 516, 22).fill('#ea580c');
  doc.fontSize(10).fillColor('#ffffff').text('MANDATORY READING — ALL OFFSHORE DRILLING PERSONNEL — MUMBAI REGION', 56, doc.y - 18, { width: 500, align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1.5);

  sectionTitle(doc, 'SUBJECT: MULTIPLE WELL CONTROL EVENTS — MUMBAI HIGH BASSEIN FORMATION');
  bodyText(doc, 'This Safety Alert is issued following two gas kick events in the Mumbai High field within 3 months (PS26121-MBH-12 on 01-Aug-2024 and an additional well control event at BHN-C platform on 28-Aug-2024). Both events occurred while drilling through the Bassein formation gas cap at approximately 2,300-2,400m depth.');

  sectionTitle(doc, 'KEY FINDINGS');
  bodyText(doc, '1. The Bassein formation gas cap depth varies by up to 150m across structural highs that are not well-resolved on existing seismic data.\n\n2. Pre-drill pore pressure models consistently underestimate gas cap pressure by 0.5-0.8 PPG in areas of structural complexity.\n\n3. Both events were successfully controlled using standard well control procedures. No injuries, environmental damage, or equipment failure occurred.\n\n4. Response time was excellent in both cases — shut-in within 6-10 minutes of kick detection.');

  sectionTitle(doc, 'MANDATORY ACTIONS');
  bodyText(doc, '1. IMMEDIATE (within 7 days):\n   • All drillers and assistant drillers on Mumbai High platforms must complete a 4-hour Well Control Refresher session.\n   • BOP function tests must be conducted on all active wells within 24 hours.\n   • Verify accumulator bottle pressures on all platforms.');
  bodyText(doc, '2. BEFORE DRILLING BASSEIN (mandatory for all wells):\n   • Minimum mud weight: 12.0 PPG when entering Bassein, regardless of predicted pore pressure.\n   • Kill weight barite for +1.5 PPG must be pre-mixed and available on rig floor.\n   • Standby vessel within 1 km during all Bassein drilling.\n   • Real-time gas monitoring with alarm at 15% total gas.\n   • Drilling break protocol: Any ROP increase >2x must trigger immediate flow check.');
  bodyText(doc, '3. TRAINING (within 30 days):\n   • All drilling crews must hold IWCF Level 4 certification.\n   • Platform-specific well control drills monthly during Bassein drilling.\n   • OIM quarterly review of Well Control Manual compliance.');

  sectionTitle(doc, 'REFERENCE DOCUMENTS');
  bodyText(doc, '• PS26121/IIR/MBH/2024/008 — Incident Investigation: PS26121-MBH-12 Gas Kick\n• PS26121/WCR/MBH/2024/031 — Well Completion Report: PS26121-MBH-07\n• PS26121/GEO/MBN/2024/003 — Geological Prognosis: MBN-15\n• ONGC-WC-STD-2024 Rev 4 — Well Control Standard Operating Procedure');

  sectionTitle(doc, 'ISSUED BY');
  tableRow(doc, 'Director:', 'V. Singh, Director — Safety, ONGC');
  tableRow(doc, 'Distribution:', 'All OIMs, Toolpushers, Drillers, HSE Officers — Mumbai Region');
  tableRow(doc, 'Compliance Due:', '30-Sep-2024');

  doc.moveDown(1);
  doc.rect(48, doc.y, 516, 20).fill('#fee2e2');
  doc.fontSize(8).fillColor('#991b1b').text('NON-COMPLIANCE WITH THIS BULLETIN IS A LEVEL-2 SAFETY VIOLATION PER ONGC SAFETY CODE 2024.', 56, doc.y - 16, { width: 500, align: 'center' });

  footer(doc, 1, 1, 'ONGC Safety Directorate — Mumbai');
  doc.end();
  console.log('  ✓', fp);
}

console.log('[PDF Generator] Creating 4 additional PS26121 demo PDFs...\n');
createPDF3();
createPDF4();
createPDF5();
createPDF6();
console.log('\nDone! Upload these via Legacy Documents to test.');
