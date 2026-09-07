import { TargetClassDefinition, Mission, SonarScan, Detection, Operator, SurveySession } from '../types';

export const TARGET_CLASSES: TargetClassDefinition[] = [
  {
    id: 'marine_debris',
    name: 'Marine Debris',
    description: 'Anthropogenic waste including abandoned fishing gear (ghost nets), discarded plastics, submerged containers, and metallic refuse.',
    category: 'debris',
    colorHex: '#ef4444',
    badgeBg: 'bg-red-950/60 border-red-500/50',
    badgeText: 'text-red-400',
    defaultSeverity: 'HIGH',
    baseRiskWeight: 80,
    isMarineDebris: true,
  },
  {
    id: 'oil_anomaly',
    name: 'Possible Oil-Related Anomaly',
    description: 'Subsea acoustic signature suggesting sunken heavy oil sludge, pipeline hydrocarbon seep, or container breach.',
    category: 'hazard',
    colorHex: '#f97316',
    badgeBg: 'bg-orange-950/60 border-orange-500/50',
    badgeText: 'text-orange-400',
    defaultSeverity: 'CRITICAL',
    baseRiskWeight: 90,
    isMarineDebris: true,
  },
  {
    id: 'rock_boulder',
    name: 'Rock / Boulder',
    description: 'Natural seabed geomorphic high-backscatter geological formation or glacial erratic.',
    category: 'geological',
    colorHex: '#06b6d4',
    badgeBg: 'bg-cyan-950/60 border-cyan-500/50',
    badgeText: 'text-cyan-400',
    defaultSeverity: 'LOW',
    baseRiskWeight: 25,
    isMarineDebris: false,
  },
  {
    id: 'seabed_depression',
    name: 'Seabed Depression',
    description: 'Bathymetric low-backscatter feature including pockmarks, dredge hollows, or scour scars.',
    category: 'geological',
    colorHex: '#8b5cf6',
    badgeBg: 'bg-purple-950/60 border-purple-500/50',
    badgeText: 'text-purple-400',
    defaultSeverity: 'LOW',
    baseRiskWeight: 30,
    isMarineDebris: false,
  },
  {
    id: 'underwater_structure',
    name: 'Man-Made Underwater Structure',
    description: 'Submerged infrastructure such as telecommunication cables, unexploded ordnance zones, pipeline segments, or foundations.',
    category: 'infrastructure',
    colorHex: '#eab308',
    badgeBg: 'bg-amber-950/60 border-amber-500/50',
    badgeText: 'text-amber-400',
    defaultSeverity: 'MEDIUM',
    baseRiskWeight: 65,
    isMarineDebris: false,
  },
  {
    id: 'shipwreck',
    name: 'Shipwreck / Wreck-Like Object',
    description: 'Submerged maritime vessel hull, structural debris field, or archaeological artifact.',
    category: 'cultural',
    colorHex: '#3b82f6',
    badgeBg: 'bg-blue-950/60 border-blue-500/50',
    badgeText: 'text-blue-400',
    defaultSeverity: 'MEDIUM',
    baseRiskWeight: 60,
    isMarineDebris: false,
  },
  {
    id: 'unknown_anomaly',
    name: 'Unknown Anomaly',
    description: 'Unclassified acoustic backscatter highlight and shadow pair requiring physical ROV or diver ground-truthing.',
    category: 'unknown',
    colorHex: '#94a3b8',
    badgeBg: 'bg-slate-900 border-slate-500/50',
    badgeText: 'text-slate-300',
    defaultSeverity: 'LOW',
    baseRiskWeight: 45,
    isMarineDebris: false,
  },
];

export function getTargetClassMeta(nameOrId: string): TargetClassDefinition {
  const found = TARGET_CLASSES.find(
    (t) => t.id === nameOrId || t.name.toLowerCase() === nameOrId.toLowerCase()
  );
  if (found) return found;
  return {
    id: nameOrId,
    name: nameOrId,
    description: 'Unregistered target class',
    category: 'unknown',
    colorHex: '#94a3b8',
    badgeBg: 'bg-slate-900 border-slate-700',
    badgeText: 'text-slate-400',
    defaultSeverity: 'LOW',
    baseRiskWeight: 40,
    isMarineDebris: false,
  };
}

export const INITIAL_OPERATOR: Operator = {
  uid: 'op-sih-2026-lead',
  email: 'operator@aquasonar.navy.mil',
  displayName: 'Lt. Cdr. S. Gokul',
  role: 'Lead Hydrographer',
  organization: 'Naval Hydrographic Survey Command / SIH 2026',
  isFirebaseAuthenticated: false,
};

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mission-goa-survey-2026',
    userId: 'op-sih-2026-lead',
    missionName: 'Goa Coastal Debris & Hazard Survey 2026',
    missionCode: 'IN-GOA-SURV-26',
    surveyArea: 'Mormugao Bay Outer Anchorage & Estuary',
    startTime: '2026-02-20T08:30:00Z',
    endTime: '2026-02-20T16:45:00Z',
    vehicleId: 'AUV-MAYUR-03',
    vehicleType: 'AUV',
    operator: 'Lt. Cdr. S. Gokul',
    notes: 'Acoustic survey targeted at locating ghost fishing nets, sunken cargo debris, and bathymetric scour along navigation channels.',
    status: 'COMPLETED',
    createdAt: '2026-02-20T07:00:00Z',
    totalScans: 3,
    totalDetections: 5,
  },
  {
    id: 'mission-kandla-port-2026',
    userId: 'op-sih-2026-lead',
    missionName: 'Gulf of Kutch Pipeline & Seabed Audit',
    missionCode: 'IN-KUTCH-ENG-04',
    surveyArea: 'Kandla Approach Channel KM 14-22',
    startTime: '2026-02-28T06:00:00Z',
    vehicleId: 'TOWFISH-EDGE-4200',
    vehicleType: 'TOWFISH',
    operator: 'Lead Hydrographer Anand R.',
    notes: 'Submerged gas pipeline inspection and seabed scouring verification following heavy monsoon sediment shift.',
    status: 'ACTIVE',
    createdAt: '2026-02-28T05:30:00Z',
    totalScans: 2,
    totalDetections: 3,
  },
];

export const INITIAL_SESSIONS: SurveySession[] = [
  {
    id: 'session-demo-01',
    missionId: 'mission-goa-survey-2026',
    sessionCode: 'SES-GOA-01-SWATH-A',
    startTime: '2026-02-20T09:00:00Z',
    endTime: '2026-02-20T12:30:00Z',
    pingCount: 14200,
    swathWidthMeters: 100,
    frequencyKhz: 450,
    soundSpeedMps: 1512,
    status: 'COMPLETED',
    scansCount: 2,
    detectionsCount: 3,
  },
  {
    id: 'session-demo-02',
    missionId: 'mission-kandla-port-2026',
    sessionCode: 'SES-KUTCH-02-TRANSECT',
    startTime: '2026-02-28T07:00:00Z',
    pingCount: 8950,
    swathWidthMeters: 150,
    frequencyKhz: 900,
    soundSpeedMps: 1505,
    status: 'ACTIVE',
    scansCount: 1,
    detectionsCount: 1,
  },
];

export const INITIAL_SCANS: SonarScan[] = [
  {
    id: 'scan-demo-debris-01',
    userId: 'op-sih-2026-lead',
    missionId: 'mission-goa-survey-2026',
    filename: 'mormugao_swath_ch1_ch2_042.png',
    storagePath: 'sonar/sample/mormugao_swath_042.png',
    fileType: 'image/png',
    fileSize: 1428500,
    uploadedAt: '2026-02-20T09:15:00Z',
    latitude: 15.41285,
    longitude: 73.78421,
    depth: 18.5,
    heading: 274,
    vehicleId: 'AUV-MAYUR-03',
    processingStatus: 'COMPLETED',
    analysisId: 'analysis-demo-01',
    hasCoordinates: true,
    coordinateDisplay: '15.4129° N, 73.7842° E',
    originalImageUrl: '',
    preprocessedImageUrl: '',
    isDemoData: true,
    swathWidthMeters: 100,
    altitudeMeters: 12,
    frequencyKhz: 450,
  },
  {
    id: 'scan-demo-wreck-02',
    userId: 'op-sih-2026-lead',
    missionId: 'mission-goa-survey-2026',
    filename: 'barge_wreckage_waterfall_019.png',
    storagePath: 'sonar/sample/barge_wreckage_019.png',
    fileType: 'image/png',
    fileSize: 1845000,
    uploadedAt: '2026-02-20T11:40:00Z',
    latitude: 15.4215,
    longitude: 73.7698,
    depth: 24.2,
    heading: 182.5,
    vehicleId: 'AUV-MAYUR-03',
    processingStatus: 'COMPLETED',
    analysisId: 'analysis-demo-02',
    hasCoordinates: true,
    coordinateDisplay: '15.4215° N, 73.7698° E',
    originalImageUrl: '',
    preprocessedImageUrl: '',
    isDemoData: true,
    swathWidthMeters: 120,
    altitudeMeters: 15,
    frequencyKhz: 450,
  },
  {
    id: 'scan-demo-nocoord-03',
    userId: 'op-sih-2026-lead',
    missionId: 'mission-kandla-port-2026',
    filename: 'kutch_trawl_debris_uncalibrated.png',
    storagePath: 'sonar/sample/kutch_trawl_debris.png',
    fileType: 'image/png',
    fileSize: 980200,
    uploadedAt: '2026-02-28T07:22:00Z',
    latitude: null,
    longitude: null,
    depth: 12,
    heading: 90,
    vehicleId: 'TOWFISH-EDGE-4200',
    processingStatus: 'COMPLETED',
    analysisId: 'analysis-demo-03',
    hasCoordinates: false,
    coordinateDisplay: 'Ungeoreferenced (Towfish Telemetry Missing)',
    originalImageUrl: '',
    preprocessedImageUrl: '',
    isDemoData: true,
    swathWidthMeters: 80,
    altitudeMeters: 8,
    frequencyKhz: 900,
  },
];

export const INITIAL_DETECTIONS: Detection[] = [
  {
    id: 'det-demo-01-1',
    analysisId: 'analysis-demo-01',
    scanId: 'scan-demo-debris-01',
    sonarFrameId: 'scan-demo-debris-01',
    surveySessionId: 'session-demo-01',
    userId: 'op-sih-2026-lead',
    className: 'Marine Debris',
    standardCategory: 'Marine Debris',
    priority: 'HIGH',
    confidence: null,
    confidenceDisplay: 'Confidence unavailable (Rule-based CV baseline)',
    boundingBox: {
      x: 520,
      y: 165,
      width: 48,
      height: 35,
      normX: 0.65,
      normY: 0.33,
      normWidth: 0.06,
      normHeight: 0.07,
    },
    segmentation: null,
    severity: 'HIGH',
    riskScore: 78,
    riskFactors: [
      'Class Weight (Marine Debris): +36 pts [Anthropogenic waste threat]',
      'Medium Acoustic Signature (1680 px²): +15 pts [Rigid obstacle]',
      'Shallow Navigational Water Depth (18.5 m): +15 pts [Trawl snag danger]',
      'Isolated Acoustic Target: +4 pts',
    ],
    latitude: 15.41292,
    longitude: 73.78435,
    depth: 18.5,
    modelName: 'Acoustic Backscatter & Shadow Baseline Extractor (CV-v1.0)',
    modelVersion: '1.0.0-experimental',
    inferenceTimestamp: '2026-02-20T09:16:12Z',
    acousticBackscatterRatio: 2.8,
    positioningStatus: 'AVAILABLE',
    processingDurationMs: 38,
    aiExplanation: {
      isAvailable: true,
      acousticIntensity: 'Acoustic specular backscatter is 2.80x higher than surrounding sediment ambient reverberation (112 DN).',
      shapeCharacteristics: 'Angular, rectangular highlight boundary (48px × 35px) incompatible with typical biogenic bedforms.',
      contrastRatio: '2.80:1 highlight-to-ambient backscatter ratio.',
      shadowCharacteristics: 'Clear downstream acoustic shadow length of 42px indicating rigid elevation of ~1.8m above seabed plane.',
      texturePattern: 'Dense, hard-scattering core surrounded by attenuated shadow boundary.',
      objectBackgroundDifference: 'Backscatter amplitude exceeds ambient seabed variance by +3.4σ.',
      summaryReasoning: 'Classified as Marine Debris due to hard acoustic boundary, high backscatter ratio, and distinct downstream acoustic occlusion.',
    },
    isDemoData: true,
  },
  {
    id: 'det-demo-01-2',
    analysisId: 'analysis-demo-01',
    scanId: 'scan-demo-debris-01',
    sonarFrameId: 'scan-demo-debris-01',
    surveySessionId: 'session-demo-01',
    userId: 'op-sih-2026-lead',
    className: 'Rock / Boulder',
    standardCategory: 'Natural Seabed Feature',
    priority: 'LOW',
    confidence: null,
    confidenceDisplay: 'Confidence unavailable (Rule-based CV baseline)',
    boundingBox: {
      x: 220,
      y: 295,
      width: 52,
      height: 40,
      normX: 0.275,
      normY: 0.59,
      normWidth: 0.065,
      normHeight: 0.08,
    },
    segmentation: null,
    severity: 'LOW',
    riskScore: 32,
    riskFactors: [
      'Class Weight (Rock / Boulder): +11 pts [Natural geological feature]',
      'Medium Acoustic Signature (2080 px²): +15 pts',
      'Bathymetric Depth (18.5 m): +6 pts',
    ],
    latitude: 15.41278,
    longitude: 73.78402,
    depth: 18.5,
    modelName: 'Acoustic Backscatter & Shadow Baseline Extractor (CV-v1.0)',
    modelVersion: '1.0.0-experimental',
    inferenceTimestamp: '2026-02-20T09:16:12Z',
    acousticBackscatterRatio: 1.9,
    positioningStatus: 'AVAILABLE',
    processingDurationMs: 31,
    aiExplanation: {
      isAvailable: true,
      acousticIntensity: 'Backscatter peak is 1.90x background level, consistent with natural rounded lithic substrate.',
      shapeCharacteristics: 'Irregular rounded geometry (52px × 40px) with gradual specular roll-off.',
      contrastRatio: '1.90:1 contrast ratio.',
      shadowCharacteristics: 'Short tapered shadow zone (18px) conforming to natural low-profile boulder mound (~0.7m high).',
      texturePattern: 'Rough textural surface gradient blending smoothly with ripple ridges.',
      objectBackgroundDifference: 'Contrast profile matches known rocky outcrop seabed features in region.',
      summaryReasoning: 'Classified as Natural Seabed Feature (Rock / Boulder) based on organic morphology and soft acoustic shadow transition.',
    },
    isDemoData: true,
  },
  {
    id: 'det-demo-02-1',
    analysisId: 'analysis-demo-02',
    scanId: 'scan-demo-wreck-02',
    sonarFrameId: 'scan-demo-wreck-02',
    surveySessionId: 'session-demo-02',
    userId: 'op-sih-2026-lead',
    className: 'Shipwreck / Wreck-Like Object',
    standardCategory: 'Seabed Anomaly',
    priority: 'HIGH',
    confidence: null,
    confidenceDisplay: 'Confidence unavailable (Rule-based CV baseline)',
    boundingBox: {
      x: 510,
      y: 195,
      width: 130,
      height: 75,
      normX: 0.637,
      normY: 0.39,
      normWidth: 0.162,
      normHeight: 0.15,
    },
    segmentation: null,
    severity: 'HIGH',
    riskScore: 74,
    riskFactors: [
      'Class Weight (Shipwreck): +27 pts [Major benthic obstruction]',
      'Large Acoustic Signature (9750 px²): +25 pts [Vessel hull profile]',
      'Intermediate Water Depth (24.2 m): +10 pts [Submersible navigational hazard]',
      'Isolated Acoustic Target: +4 pts',
    ],
    latitude: 15.42168,
    longitude: 73.77012,
    depth: 24.2,
    modelName: 'Acoustic Backscatter & Shadow Baseline Extractor (CV-v1.0)',
    modelVersion: '1.0.0-experimental',
    inferenceTimestamp: '2026-02-20T11:41:05Z',
    acousticBackscatterRatio: 3.4,
    positioningStatus: 'AVAILABLE',
    processingDurationMs: 44,
    aiExplanation: {
      isAvailable: true,
      acousticIntensity: 'Very intense specular highlight (3.40x ambient seafloor backscatter) indicating metallic or dense timber structure.',
      shapeCharacteristics: 'Large elongated hull-like contour (130px × 75px) with clearly defined bow-stern orientation.',
      contrastRatio: '3.40:1 contrast ratio.',
      shadowCharacteristics: 'Extensive acoustic shadow spanning >85px down-swath, confirming substantial vertical profile (~3.8m) above seabed.',
      texturePattern: 'Segmented internal compartmental reflections characteristic of sunken vessel ribs/decking.',
      objectBackgroundDifference: 'Dramatic +4.8σ amplitude spike across both port and starboard margins.',
      summaryReasoning: 'Classified as Seabed Anomaly (Shipwreck / Wreck-Like Object) due to extensive linear acoustic relief and elongated shadow profile.',
    },
    isDemoData: true,
  },
  {
    id: 'det-demo-03-1',
    analysisId: 'analysis-demo-03',
    scanId: 'scan-demo-nocoord-03',
    sonarFrameId: 'scan-demo-nocoord-03',
    surveySessionId: 'session-demo-03',
    userId: 'op-sih-2026-lead',
    className: 'Marine Debris',
    standardCategory: 'Marine Debris',
    priority: 'MEDIUM',
    confidence: null,
    confidenceDisplay: 'Confidence unavailable (Rule-based CV baseline)',
    boundingBox: {
      x: 440,
      y: 210,
      width: 60,
      height: 45,
      normX: 0.55,
      normY: 0.42,
      normWidth: 0.075,
      normHeight: 0.09,
    },
    segmentation: null,
    severity: 'MEDIUM',
    riskScore: 58,
    riskFactors: [
      'Class Weight (Marine Debris): +36 pts',
      'Medium Acoustic Signature (2700 px²): +15 pts',
      'Shallow Depth (12.0 m): +15 pts',
      'Uncalibrated Non-Georeferenced Telemetry',
    ],
    latitude: null,
    longitude: null,
    depth: 12,
    modelName: 'Acoustic Backscatter & Shadow Baseline Extractor (CV-v1.0)',
    modelVersion: '1.0.0-experimental',
    inferenceTimestamp: '2026-02-28T07:23:00Z',
    acousticBackscatterRatio: 2.3,
    positioningStatus: 'GEOLOCATION_UNAVAILABLE',
    processingDurationMs: 29,
    aiExplanation: {
      isAvailable: true,
      acousticIntensity: '2.30x backscatter contrast over ambient muddy benthic baseline.',
      shapeCharacteristics: 'Compact irregular polygon (60px × 45px) with jagged outer contour.',
      contrastRatio: '2.30:1 contrast ratio.',
      shadowCharacteristics: 'Localized acoustic shadow (22px) indicating low-lying physical obstruction (~1.1m high).',
      texturePattern: 'Dense cluster with tangled perimeter typical of abandoned gillnets/trawl debris.',
      objectBackgroundDifference: '+2.6σ over smooth muddy sediment backscatter.',
      summaryReasoning: 'Classified as Marine Debris (likely discarded net bundle or plastic drum) requiring visual ground truthing.',
    },
    isDemoData: true,
  },
];

/**
 * Procedurally generates a hydroacoustic side-scan sonar swath waterfall image.
 * Features:
 * - Left channel: Port Swath [CH-1]
 * - Center strip: Nadir blind zone / water column return
 * - Right channel: Starboard Swath [CH-2]
 * - Ambient reverberation texture & sediment ripple noise
 * - Specular acoustic highlights and downstream acoustic shadows
 */
export function generateSyntheticSonarSwath(
  width = 800,
  height = 500,
  sceneType: 'debris_field' | 'wreck' | 'pipeline' = 'debris_field'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;
  const center = Math.floor(width / 2);
  const nadirWidth = Math.floor(width * 0.08);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const distFromCenter = Math.abs(x - center);
      let lum = 0;

      if (distFromCenter < nadirWidth) {
        // Nadir / water column zone: low backscatter acoustic darkness
        lum = 15 + Math.random() * 8;
      } else {
        // TVG-like seabed backscatter with sediment ripples
        const base = 110 - (distFromCenter / (width / 2)) * 35;
        const ripple = Math.sin(x * 0.04 + y * 0.08) * 8;
        const noise = (Math.random() - 0.5) * 22;
        lum = Math.max(20, Math.min(210, Math.round(base + ripple + noise)));
      }

      // Amber phosphor acoustic hue default
      data[idx] = lum;
      data[idx + 1] = Math.round(lum * 0.85);
      data[idx + 2] = Math.round(lum * 0.65);
      data[idx + 3] = 255;
    }
  }

  // Paint acoustic highlights and shadows depending on scene
  if (sceneType === 'debris_field') {
    // Starboard: discarded container or metal box
    stampHighlightShadow(data, width, height, center + 140, 180, 28, 20, 245, 12, 'right');
    // Port: abandoned fishing net cluster
    stampHighlightShadow(data, width, height, center - 160, 310, 35, 24, 230, 14, 'left');
    // Starboard: small tire or drum
    stampHighlightShadow(data, width, height, center + 210, 380, 16, 14, 250, 8, 'right');
  } else if (sceneType === 'wreck') {
    // Sunken barge wreckage
    stampHighlightShadow(data, width, height, center + 130, 220, 85, 45, 255, 6, 'right');
    stampHighlightShadow(data, width, height, center + 150, 290, 40, 25, 240, 10, 'right');
  } else if (sceneType === 'pipeline') {
    // Subsea exposed pipeline segment
    for (let py = 60; py < height - 60; py += 4) {
      const px = center - 120 + Math.round(Math.sin(py * 0.02) * 6);
      stampHighlightShadow(data, width, height, px, py, 12, 6, 240, 10, 'left');
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Hydrographic annotations
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '10px monospace';
  ctx.fillText('PORT SWATH [CH-1]', 20, 22);
  ctx.fillText('STARBOARD SWATH [CH-2]', width - 175, 22);
  ctx.fillText('NADIR', center - 15, height - 16);

  // Range scale ticks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center, 0);
  ctx.lineTo(center, height);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

function stampHighlightShadow(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  highlightVal: number,
  shadowVal: number,
  shadowDir: 'left' | 'right'
) {
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);
  const shadowLen = Math.floor(w * 1.6);

  // Specular highlight
  for (let y = cy - halfH; y < cy + halfH; y++) {
    for (let x = cx - halfW; x < cx + halfW; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        data[idx] = highlightVal;
        data[idx + 1] = Math.round(highlightVal * 0.9);
        data[idx + 2] = Math.round(highlightVal * 0.7);
      }
    }
  }

  // Downstream acoustic shadow
  const shadowStart = shadowDir === 'right' ? cx + halfW : cx - halfW - shadowLen;
  const shadowEnd = shadowDir === 'right' ? cx + halfW + shadowLen : cx - halfW;

  for (let y = cy - halfH; y < cy + halfH; y++) {
    for (let x = shadowStart; x < shadowEnd; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        data[idx] = shadowVal;
        data[idx + 1] = Math.round(shadowVal * 0.85);
        data[idx + 2] = Math.round(shadowVal * 0.65);
      }
    }
  }
}
