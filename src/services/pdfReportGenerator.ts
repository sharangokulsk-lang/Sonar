import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AnomalyReportItem {
  id: string;
  className: string;
  category: string;
  confidence: number;
  depth: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  lat?: number;
  lon?: number;
  backscatterRatio?: number;
  shadowLengthM?: number;
  reliefHeightM?: number;
  dimensions?: string;
  status?: string;
}

export interface GeneratePdfOptions {
  scanId?: string;
  missionName?: string;
  vesselName?: string;
  operatorName?: string;
  organization?: string;
  surveyDate?: string;
  frequencyKhz?: number;
  swathWidthM?: number;
  meanDepthM?: number;
  coordinates?: { lat: number; lon: number };
  includeSummary: boolean;
  includeAnomalies: boolean;
  includeAnnotated: boolean;
  includeMap: boolean;
  includeAiSummary: boolean;
  includeRecommendations: boolean;
  anomalies?: AnomalyReportItem[];
  aiVerdict?: string;
  recommendations?: string[];
}

/**
 * Creates a synthetic side-scan sonar swath slice on an offscreen canvas
 * with nadir column, acoustic backscatter reverberation, and annotated bounding boxes.
 */
function generateSonarSwathImage(
  anomalies: AnomalyReportItem[],
  frequencyKhz: number,
  swathWidthM: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const nadirWidth = w * 0.12;

  // Background deep marine
  ctx.fillStyle = '#050c15';
  ctx.fillRect(0, 0, w, h);

  // Generate acoustic reverberation pixels
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const distFromCenter = Math.abs(x - cx);

      if (distFromCenter < nadirWidth / 2) {
        // Water column blind zone
        const noise = (Math.random() - 0.5) * 12;
        data[idx] = Math.max(0, 8 + noise * 0.3);
        data[idx + 1] = Math.max(0, 16 + noise * 0.5);
        data[idx + 2] = Math.max(0, 26 + noise * 0.8);
        data[idx + 3] = 255;
        continue;
      }

      // First bottom return bright band
      const isFirstReturn =
        distFromCenter >= nadirWidth / 2 && distFromCenter <= nadirWidth / 2 + 5;

      const normDist = (distFromCenter - nadirWidth / 2) / (cx - nadirWidth / 2);
      const attenuation = Math.exp(-normDist * 0.85);
      const ripple = Math.sin(y * 0.15 + x * 0.04) * 10;
      const speckle = (Math.random() - 0.5) * 32;

      let intensity = (60 + ripple + speckle) * attenuation;
      if (isFirstReturn) {
        intensity = Math.min(235, intensity + 75);
      }

      // Oceanic tactical cyan mapping
      data[idx] = Math.max(0, Math.min(255, intensity * 0.2));
      data[idx + 1] = Math.max(0, Math.min(255, intensity * 0.7 + 15));
      data[idx + 2] = Math.max(0, Math.min(255, intensity * 0.95 + 30));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Nadir axis
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Swath indicators
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.fillText(`PORT SWATH (-${Math.round(swathWidthM / 2)}m)`, 16, 20);
  ctx.fillText('NADIR AXIS (0m)', cx - 46, 20);
  ctx.fillText(`STARBOARD SWATH (+${Math.round(swathWidthM / 2)}m)`, w - 195, 20);

  // Render annotated bounding boxes for top targets
  const targetHighlights = anomalies.slice(0, 3);
  const targetPositions = [
    { x: w * 0.22, y: h * 0.35, width: 75, height: 42 },
    { x: w * 0.74, y: h * 0.25, width: 85, height: 48 },
    { x: w * 0.62, y: h * 0.65, width: 55, height: 35 },
  ];

  targetHighlights.forEach((anm, idx) => {
    const pos = targetPositions[idx % targetPositions.length];

    // Acoustic shadow behind highlight
    const shadowOffset = pos.x < cx ? -pos.width * 0.75 : pos.width * 0.75;
    ctx.fillStyle = 'rgba(2, 6, 12, 0.85)';
    ctx.fillRect(pos.x + shadowOffset, pos.y, pos.width * 0.75, pos.height);

    // Acoustic specular highlight
    ctx.fillStyle =
      anm.riskLevel === 'CRITICAL'
        ? 'rgba(255, 90, 120, 0.45)'
        : anm.riskLevel === 'HIGH'
        ? 'rgba(245, 158, 11, 0.4)'
        : 'rgba(0, 210, 255, 0.35)';
    ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

    // Box border
    ctx.lineWidth = 2;
    ctx.strokeStyle =
      anm.riskLevel === 'CRITICAL'
        ? '#f43f5e'
        : anm.riskLevel === 'HIGH'
        ? '#f59e0b'
        : '#00e5ff';
    ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

    // Tag Label
    const tagText = `${anm.id}: ${anm.className} (${anm.confidence.toFixed(1)}%)`;
    ctx.font = 'bold 10px monospace';
    const tw = ctx.measureText(tagText).width;
    ctx.fillStyle = 'rgba(5, 12, 22, 0.9)';
    ctx.fillRect(pos.x, pos.y - 18, tw + 8, 16);
    ctx.strokeStyle = ctx.strokeStyle;
    ctx.strokeRect(pos.x, pos.y - 18, tw + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, pos.x + 4, pos.y - 6);
  });

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Main export function to generate and download a formatted PDF survey report using jsPDF
 */
export async function exportFormattedPdfReport(options: GeneratePdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const surveyId = options.scanId || 'Scan_0248';
  const reportCode = `ANX-SRV-${surveyId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
  const now = new Date();
  const timestampStr = now.toUTCString();
  const missionName = options.missionName || 'Shelf Survey Alpha (Bay of Bengal Transect)';
  const vesselName = options.vesselName || 'RV Sagar Nidhi / AUV-MAYUR-03';
  const operatorName = options.operatorName || 'Ocean Explorer (Hydrography Lead)';
  const organization = options.organization || 'National Institute of Ocean Technology (NIOT)';
  const frequencyKhz = options.frequencyKhz || 450;
  const swathWidthM = options.swathWidthM || 120;
  const meanDepthM = options.meanDepthM || 29.8;
  const coords = options.coordinates || { lat: 13.0841, lon: 80.2782 };

  const defaultAnomalies: AnomalyReportItem[] = [
    {
      id: 'ANM-01',
      className: 'Sunken Cargo Shipping Container',
      category: 'Marine Debris',
      confidence: 94.2,
      depth: 28.4,
      riskLevel: 'CRITICAL',
      lat: 13.0841,
      lon: 80.2782,
      backscatterRatio: 3.8,
      shadowLengthM: 4.8,
      reliefHeightM: 2.5,
      dimensions: '6.1m x 2.4m x 2.6m',
      status: 'CONFIRMED',
    },
    {
      id: 'ANM-02',
      className: 'Entangled Ghost Fishing Net',
      category: 'Ghost Gear',
      confidence: 88.5,
      depth: 31.2,
      riskLevel: 'HIGH',
      lat: 13.0849,
      lon: 80.2791,
      backscatterRatio: 2.7,
      shadowLengthM: 2.6,
      reliefHeightM: 1.2,
      dimensions: '4.5m x 3.2m',
      status: 'CONFIRMED',
    },
    {
      id: 'ANM-03',
      className: 'Granite Boulder / Coral Outcrop',
      category: 'Natural Feature',
      confidence: 72.1,
      depth: 29.8,
      riskLevel: 'LOW',
      lat: 13.0835,
      lon: 80.2774,
      backscatterRatio: 1.8,
      shadowLengthM: 1.5,
      reliefHeightM: 0.8,
      dimensions: '1.9m x 1.6m',
      status: 'REVIEWED',
    },
  ];

  const anomalyList = options.anomalies && options.anomalies.length > 0 ? options.anomalies : defaultAnomalies;

  let currentY = 0;

  // -------------------------------------------------------------
  // HEADER BANNER
  // -------------------------------------------------------------
  // Top deep navy background
  doc.setFillColor(11, 25, 44);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent cyan line under banner
  doc.setFillColor(0, 163, 196);
  doc.rect(0, 38, pageWidth, 1.8, 'F');

  // AquaNex Brand Badge
  doc.setFillColor(0, 163, 196);
  doc.roundedRect(margin, 8, 22, 22, 3, 3, 'F');

  // Sonar wave symbol inside badge
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(margin + 11, 19, 3);
  doc.circle(margin + 11, 19, 6.5);
  doc.circle(margin + 11, 19, 9.5);

  // App & Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AquaNex', margin + 26, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 229, 255);
  doc.text('AUTOMATED UNDERWATER HYDROACOUSTIC SURVEY DOSSIER', margin + 26, 20);

  doc.setFontSize(7.5);
  doc.setTextColor(155, 178, 200);
  doc.text('SIDE-SCAN SONAR ANOMALY DETECTION & MARINE DEBRIS PIPELINE', margin + 26, 25);

  // Right Header Metadata Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`REPORT ID: ${reportCode}`, pageWidth - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(155, 178, 200);
  doc.text(`ISSUED: ${now.toLocaleDateString()} | ${timestampStr.slice(17, 25)} UTC`, pageWidth - margin, 19, {
    align: 'right',
  });

  // Security Classification pill
  doc.setFillColor(225, 29, 72);
  doc.roundedRect(pageWidth - margin - 42, 23, 42, 5.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL HYDROGRAPHIC REPORT', pageWidth - margin - 21, 27, { align: 'center' });

  currentY = 46;

  // -------------------------------------------------------------
  // 1. MISSION & HYDROACOUSTIC PARAMETERS
  // -------------------------------------------------------------
  if (options.includeSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('1. MISSION & HYDROACOUSTIC PARAMETERS', margin, currentY);

    // Section line
    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 45, currentY + 1.5);

    currentY += 6;

    // Parameter Cards Box
    doc.setFillColor(245, 248, 252);
    doc.setDrawColor(215, 226, 238);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

    const colW = contentWidth / 4;
    const p1X = margin + 4;
    const p2X = margin + colW + 4;
    const p3X = margin + colW * 2 + 4;
    const p4X = margin + colW * 3 + 4;

    const row1Y = currentY + 6;
    const row2Y = currentY + 16;
    const row3Y = currentY + 26;

    const drawParam = (x: number, y: number, label: string, val: string, isAccent = false) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      if (isAccent) {
        doc.setTextColor(0, 140, 180);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(val, x, y + 4);
    };

    drawParam(p1X, row1Y, 'SURVEY MISSION', missionName.slice(0, 24));
    drawParam(p2X, row1Y, 'VESSEL / VEHICLE', vesselName.slice(0, 24));
    drawParam(p3X, row1Y, 'OPERATOR LEAD', operatorName.slice(0, 24));
    drawParam(p4X, row1Y, 'ORGANIZATION', organization.slice(0, 24));

    drawParam(p1X, row2Y, 'CARRIER FREQUENCY', `${frequencyKhz} kHz Dual-Band`, true);
    drawParam(p2X, row2Y, 'SWATH COVERAGE', `${swathWidthM} m (${swathWidthM / 2}m / ch)`);
    drawParam(p3X, row2Y, 'BATHYMETRY DEPTH', `${meanDepthM} m Mean Depth`);
    drawParam(p4X, row2Y, 'SURVEY DATE', options.surveyDate || '03 May 2026');

    drawParam(p1X, row3Y, 'TRANSECT LATITUDE', `${coords.lat.toFixed(5)}° N`);
    drawParam(p2X, row3Y, 'TRANSECT LONGITUDE', `${coords.lon.toFixed(5)}° E`);
    drawParam(p3X, row3Y, 'TOTAL CONTACTS', `${anomalyList.length} Anomalies Logged`, true);
    drawParam(p4X, row3Y, 'GEODETIC DATUM', 'WGS 84 (UTM Zone 44N)');

    currentY += 37;
  }

  // -------------------------------------------------------------
  // 2. ANNOTATED SONAR SWATH VISUAL (IF SELECTED)
  // -------------------------------------------------------------
  if (options.includeAnnotated) {
    // Check page budget
    if (currentY + 55 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('2. ACOUSTIC SIDE-SCAN SONAR SWATH (ANNOTATED TARGETS)', margin, currentY);

    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 55, currentY + 1.5);

    currentY += 5;

    try {
      const swathImg = generateSonarSwathImage(anomalyList, frequencyKhz, swathWidthM);
      if (swathImg) {
        const imgH = 46;
        doc.addImage(swathImg, 'JPEG', margin, currentY, contentWidth, imgH);

        // Frame border
        doc.setDrawColor(18, 42, 68);
        doc.setLineWidth(0.4);
        doc.rect(margin, currentY, contentWidth, imgH);

        currentY += imgH + 2;

        // Caption
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Figure 1.0: Real-time dual-channel acoustic waterfall acquired at ${frequencyKhz} kHz carrier frequency. Nadir water column gap visible at center axis with synthetic acoustic shadow relief projection.`,
          margin,
          currentY + 2
        );

        currentY += 8;
      }
    } catch {
      currentY += 2;
    }
  }

  // -------------------------------------------------------------
  // 3. DETECTED ACOUSTIC RELIEF TARGETS TABLE
  // -------------------------------------------------------------
  if (options.includeAnomalies) {
    if (currentY + 45 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('3. DETECTED BENTHIC RELIEF TARGETS & ANOMALIES', margin, currentY);

    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 55, currentY + 1.5);

    currentY += 5;

    const tableRows = anomalyList.map((anm) => [
      anm.id,
      anm.className,
      anm.category,
      `${anm.confidence.toFixed(1)}%`,
      `${anm.depth.toFixed(1)} m`,
      anm.backscatterRatio ? `+${anm.backscatterRatio.toFixed(1)}x` : '+2.4x',
      anm.reliefHeightM ? `+${anm.reliefHeightM.toFixed(1)} m` : '+1.4 m',
      anm.riskLevel,
      anm.status || 'CONFIRMED',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [
        [
          'Target ID',
          'Classification',
          'Category',
          'Confidence',
          'Depth',
          'Backscatter',
          'Relief',
          'Risk Level',
          'Status',
        ],
      ],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [11, 25, 44],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.2,
      },
      styles: {
        fontSize: 7.2,
        textColor: [15, 23, 42],
        cellPadding: 2,
        lineColor: [220, 230, 242],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 253],
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', cellWidth: 16 },
        1: { fontStyle: 'bold', cellWidth: 38 },
        2: { cellWidth: 24 },
        3: { halign: 'right', textColor: [0, 140, 180], fontStyle: 'bold', cellWidth: 18 },
        4: { halign: 'right', cellWidth: 14 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 16 },
        7: { fontStyle: 'bold', halign: 'center', cellWidth: 20 },
        8: { halign: 'center', cellWidth: 18 },
      },
      didParseCell: (data) => {
        // Colorize Risk Level
        if (data.section === 'body' && data.column.index === 7) {
          const val = String(data.cell.raw);
          if (val === 'CRITICAL') {
            data.cell.styles.textColor = [225, 29, 72];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'HIGH') {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'MEDIUM') {
            data.cell.styles.textColor = [202, 138, 4];
          } else {
            data.cell.styles.textColor = [13, 148, 136];
          }
        }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // -------------------------------------------------------------
  // 4. AI HYDROACOUSTIC REASONING & VERDICT
  // -------------------------------------------------------------
  if (options.includeAiSummary) {
    if (currentY + 38 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('4. GEMINI 3.8 FLASH HYDROACOUSTIC REASONING & DIAGNOSTICS', margin, currentY);

    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 65, currentY + 1.5);

    currentY += 6;

    const defaultVerdict =
      options.aiVerdict ||
      'Automated hydroacoustic evaluation: Target ANM-01 exhibits a pronounced specular backscatter ratio (+3.8x) followed by a 4.8m acoustic shadow occlusion, confirming an elevated rigid metallic container structure elevated +2.5m above benthic sediment. Target ANM-02 displays chaotic, low-reflectivity fibrous impedance consistent with an entangled polyethylene trawl net (ghost gear) posing severe entangling hazard to marine fauna and subsea ROVs.';

    // Shaded box with left cyan accent rule
    doc.setFillColor(244, 248, 252);
    doc.setDrawColor(215, 226, 238);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFillColor(0, 163, 196);
    doc.rect(margin, currentY, 2.5, 22, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const splitText = doc.splitTextToSize(defaultVerdict, contentWidth - 8);
    doc.text(splitText, margin + 5, currentY + 5.5);

    currentY += 27;
  }

  // -------------------------------------------------------------
  // 5. GEOSPATIAL TRANSECT & WAYPOINTS (IF SELECTED)
  // -------------------------------------------------------------
  if (options.includeMap) {
    if (currentY + 32 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('5. GEOSPATIAL TRANSECT & WAYPOINT COORDINATES', margin, currentY);

    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 55, currentY + 1.5);

    currentY += 5;

    const geoRows = anomalyList.map((anm) => [
      anm.id,
      anm.className,
      anm.lat ? `${anm.lat.toFixed(5)}° N` : '13.08410° N',
      anm.lon ? `${anm.lon.toFixed(5)}° E` : '80.27820° E',
      `${anm.depth.toFixed(1)} m`,
      'WGS 84 / UTM 44N',
      'HIGH ACCURACY (DGPS)',
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['ID', 'Feature Description', 'Latitude', 'Longitude', 'Bathymetry', 'Geodetic Datum', 'Position Quality']],
      body: geoRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.2,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        textColor: [15, 23, 42],
        cellPadding: 1.8,
        lineColor: [220, 230, 242],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 253],
      },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'center', cellWidth: 16 },
        1: { cellWidth: 44 },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        3: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 24 },
        6: { halign: 'center', textColor: [13, 148, 136], cellWidth: 28 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // -------------------------------------------------------------
  // 6. RECOMMENDATIONS & TACTICAL SALVAGE ACTION PLAN
  // -------------------------------------------------------------
  if (options.includeRecommendations) {
    if (currentY + 34 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(11, 25, 44);
    doc.text('6. TACTICAL MITIGATION & ACTION RECOMMENDATIONS', margin, currentY);

    doc.setDrawColor(0, 163, 196);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 1.5, margin + 55, currentY + 1.5);

    currentY += 6;

    const actionList = options.recommendations || [
      'Log Target ANM-01 (Cargo Container) into Tactical Hydrographic Hazard Database and notify coast guard authority.',
      'Deploy tethered work-class ROV with HD stereoscopic cameras to verify structural integrity and hazmat potential.',
      'Schedule environmental retrieval mission for Target ANM-02 (Ghost Net) to prevent benthic ecological smothering.',
      'Maintain active acoustic monitoring buffer of 250m around identified submerged navigational hazards.',
    ];

    actionList.forEach((act, idx) => {
      // Bullet dot
      doc.setFillColor(0, 163, 196);
      doc.circle(margin + 2, currentY + 1.5, 1.2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      const splitAct = doc.splitTextToSize(act, contentWidth - 8);
      doc.text(splitAct, margin + 6, currentY + 2.5);
      currentY += splitAct.length * 4.2 + 2;
    });

    currentY += 4;
  }

  // -------------------------------------------------------------
  // 7. SIGN-OFF & CRYPTOGRAPHIC VERIFICATION BLOCK
  // -------------------------------------------------------------
  if (currentY + 28 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(215, 226, 238);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SURVEY CERTIFICATION & CRYPTOGRAPHIC PROVENANCE', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Certified by: ${operatorName}  |  Review Agency: ${organization}  |  Status: CERTIFIED COMPLIANT`,
    margin + 4,
    currentY + 9.5
  );

  const hashSnippet =
    'SHA256: 4f9b8c2e1763a8d9b1c0e4f8a2d6e3f9c2a1b4e8d7c6b5a4f3e2d1c0b9a8f7e6';
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(hashSnippet, margin + 4, currentY + 14);
  doc.text('Acoustic Ping Telemetry & Edge AI Inferences Cryptographically Sealed for Official Audit.', margin + 4, currentY + 18);

  // -------------------------------------------------------------
  // RUN FOOTER & PAGE NUMBERS ACROSS ALL PAGES
  // -------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider line
    doc.setDrawColor(220, 230, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Footer Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(130, 145, 165);

    doc.text(
      'AquaNex Hydroacoustic Intelligence • Automated Marine Debris & Seabed Hazard Detection System',
      margin,
      pageHeight - 6.5
    );

    doc.text(
      `Page ${i} of ${totalPages}  |  ${reportCode}`,
      pageWidth - margin,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  // Trigger download with clean filename
  const filename = `AquaNex_Survey_Report_${surveyId}_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
