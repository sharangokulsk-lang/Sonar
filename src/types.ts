export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type PositioningStatus = 'AVAILABLE' | 'GEOLOCATION_UNAVAILABLE' | 'ESTIMATED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  normX: number;
  normY: number;
  normWidth: number;
  normHeight: number;
}

export interface AIExplanation {
  isAvailable: boolean;
  acousticIntensity: string;
  shapeCharacteristics: string;
  contrastRatio: string;
  shadowCharacteristics: string;
  texturePattern: string;
  objectBackgroundDifference: string;
  summaryReasoning: string;
  geminiAnalysis?: string;
}

export interface Detection {
  id: string;
  analysisId: string;
  scanId: string;
  sonarFrameId?: string;
  surveySessionId?: string;
  userId: string;
  className: string;
  standardCategory: 'Marine Debris' | 'Natural Seabed Feature' | 'Seabed Anomaly' | 'Unclassified Object';
  priority: SeverityLevel;
  confidence: number | null;
  confidenceDisplay: string;
  boundingBox: BoundingBox;
  segmentation: number[] | null;
  severity: SeverityLevel;
  riskScore: number;
  riskFactors: string[];
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  modelName: string;
  modelVersion: string;
  inferenceTimestamp: string;
  acousticBackscatterRatio: number;
  positioningStatus: PositioningStatus;
  processingDurationMs: number;
  aiExplanation: AIExplanation;
  userFeedback?: {
    verifiedBy: string;
    verifiedAt: string;
    isCorrect: boolean;
    notes?: string;
  };
  isDemoData?: boolean;
}

export interface SonarScan {
  id: string;
  userId: string;
  missionId: string;
  filename: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  latitude: number | null;
  longitude: number | null;
  depth: number | null;
  heading: number | null;
  vehicleId: string;
  processingStatus: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING';
  analysisId: string;
  hasCoordinates: boolean;
  coordinateDisplay?: string;
  originalImageUrl: string;
  preprocessedImageUrl?: string;
  isDemoData?: boolean;
  swathWidthMeters?: number;
  altitudeMeters?: number;
  frequencyKhz?: number;
  metrics?: {
    durationMs: number;
    originalMeanBrightness: number;
    processedMeanBrightness: number;
    contrastRatio: number;
    operationsApplied: string[];
  };
}

export interface Mission {
  id: string;
  userId: string;
  missionName: string;
  missionCode: string;
  surveyArea: string;
  startTime: string;
  endTime?: string;
  vehicleId: string;
  vehicleType: 'AUV' | 'TOWFISH' | 'ROV' | 'USV' | 'VESSEL';
  operator: string;
  notes: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  createdAt: string;
  totalScans: number;
  totalDetections: number;
}

export interface SurveySession {
  id: string;
  missionId: string;
  sessionCode: string;
  startTime: string;
  endTime?: string;
  pingCount: number;
  swathWidthMeters: number;
  frequencyKhz: number;
  soundSpeedMps: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  scansCount: number;
  detectionsCount: number;
}

export interface AnalysisRecord {
  id: string;
  scanId: string;
  timestamp: string;
  filterSettings: FilterSettings;
  durationMs: number;
  anomalyCount: number;
  debrisCount: number;
  riskIndex: number;
}

export interface FilterSettings {
  grayscale: boolean;
  normalizeIntensity: boolean;
  contrastEnhance: boolean;
  denoiseSpeckle: boolean;
  clahe: boolean;
  seabedNormalize: boolean;
  colorMap: 'amber' | 'grayscale' | 'viridis' | 'cyan' | 'deepsea';
  slantRangeCorrection: boolean;
}

export interface Operator {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  organization: string;
  isFirebaseAuthenticated: boolean;
}

export interface TargetClassDefinition {
  id: string;
  name: string;
  description: string;
  category: 'debris' | 'hazard' | 'geological' | 'infrastructure' | 'cultural' | 'unknown';
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  defaultSeverity: SeverityLevel;
  baseRiskWeight: number;
  isMarineDebris: boolean;
}
