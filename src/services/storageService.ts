import { SonarScan, Detection, Mission, SurveySession, Operator } from '../types';
import {
  INITIAL_MISSIONS,
  INITIAL_SCANS,
  INITIAL_DETECTIONS,
  INITIAL_SESSIONS,
  INITIAL_OPERATOR,
  generateSyntheticSonarSwath,
} from '../data/mockData';

const SCANS_KEY = 'aquasonar_scans';
const DETECTIONS_KEY = 'aquasonar_detections';
const MISSIONS_KEY = 'aquasonar_missions';
const SESSIONS_KEY = 'aquasonar_sessions';
const OPERATOR_KEY = 'aquasonar_operator';
const DEMO_KEY = 'aquasonar_demo_mode';

class StorageService {
  private scansListeners: Array<(scans: SonarScan[]) => void> = [];
  private detectionsListeners: Array<(dets: Detection[]) => void> = [];

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      if (!localStorage.getItem(SCANS_KEY)) {
        // Initialize with high quality demo swaths
        this.loadSampleDataSync();
      }
    } catch {
      // Ignore if localStorage unavailable
    }
  }

  public isDemoMode(): boolean {
    try {
      return localStorage.getItem(DEMO_KEY) === 'true';
    } catch {
      return true;
    }
  }

  public setDemoMode(val: boolean) {
    try {
      localStorage.setItem(DEMO_KEY, String(val));
    } catch {}
  }

  public getOperator(): Operator {
    try {
      const val = localStorage.getItem(OPERATOR_KEY);
      if (val) return JSON.parse(val);
    } catch {}
    return INITIAL_OPERATOR;
  }

  public updateOperator(op: Partial<Operator>): Operator {
    const current = this.getOperator();
    const updated = { ...current, ...op };
    try {
      localStorage.setItem(OPERATOR_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  public async getMissions(): Promise<Mission[]> {
    try {
      const val = localStorage.getItem(MISSIONS_KEY);
      if (val) return JSON.parse(val);
    } catch {}
    return INITIAL_MISSIONS;
  }

  public async createMission(m: Mission): Promise<void> {
    const list = await this.getMissions();
    const idx = list.findIndex((item) => item.id === m.id);
    if (idx >= 0) list[idx] = m;
    else list.unshift(m);
    try {
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(list));
    } catch {}
  }

  public async getSessions(): Promise<SurveySession[]> {
    try {
      const val = localStorage.getItem(SESSIONS_KEY);
      if (val) return JSON.parse(val);
    } catch {}
    return INITIAL_SESSIONS;
  }

  public async createSession(s: SurveySession): Promise<void> {
    const list = await this.getSessions();
    list.unshift(s);
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
    } catch {}
  }

  public async getAllSonarScans(): Promise<SonarScan[]> {
    try {
      const val = localStorage.getItem(SCANS_KEY);
      if (val) return JSON.parse(val);
    } catch {}
    return [];
  }

  public async saveSonarScan(scan: SonarScan): Promise<void> {
    const list = await this.getAllSonarScans();
    const idx = list.findIndex((s) => s.id === scan.id);
    if (idx >= 0) list[idx] = scan;
    else list.unshift(scan);

    try {
      localStorage.setItem(SCANS_KEY, JSON.stringify(list));
    } catch {}
    this.notifyScans(list);
  }

  public async deleteSonarScan(scanId: string): Promise<void> {
    const list = await this.getAllSonarScans();
    const filtered = list.filter((s) => s.id !== scanId);
    try {
      localStorage.setItem(SCANS_KEY, JSON.stringify(filtered));
    } catch {}
    this.notifyScans(filtered);

    // Also remove associated detections
    const dets = await this.getDetections();
    const filteredDets = dets.filter((d) => d.scanId !== scanId);
    try {
      localStorage.setItem(DETECTIONS_KEY, JSON.stringify(filteredDets));
    } catch {}
    this.notifyDetections(filteredDets);
  }

  public async getDetections(): Promise<Detection[]> {
    try {
      const val = localStorage.getItem(DETECTIONS_KEY);
      if (val) return JSON.parse(val);
    } catch {}
    return [];
  }

  public async saveDetections(dets: Detection[]): Promise<void> {
    const current = await this.getDetections();
    const currentMap = new Map(current.map((d) => [d.id, d]));
    dets.forEach((d) => currentMap.set(d.id, d));
    const updated = Array.from(currentMap.values());

    try {
      localStorage.setItem(DETECTIONS_KEY, JSON.stringify(updated));
    } catch {}
    this.notifyDetections(updated);
  }

  public async updateDetection(det: Detection): Promise<void> {
    const current = await this.getDetections();
    const idx = current.findIndex((d) => d.id === det.id);
    if (idx >= 0) current[idx] = det;
    else current.push(det);

    try {
      localStorage.setItem(DETECTIONS_KEY, JSON.stringify(current));
    } catch {}
    this.notifyDetections(current);
  }

  public subscribeSonarScans(fn: (scans: SonarScan[]) => void): () => void {
    this.scansListeners.push(fn);
    this.getAllSonarScans().then(fn);
    return () => {
      this.scansListeners = this.scansListeners.filter((l) => l !== fn);
    };
  }

  public subscribeDetections(fn: (dets: Detection[]) => void): () => void {
    this.detectionsListeners.push(fn);
    this.getDetections().then(fn);
    return () => {
      this.detectionsListeners = this.detectionsListeners.filter((l) => l !== fn);
    };
  }

  private notifyScans(scans: SonarScan[]) {
    this.scansListeners.forEach((l) => l(scans));
  }

  private notifyDetections(dets: Detection[]) {
    this.detectionsListeners.forEach((l) => l(dets));
  }

  public loadSampleDataSync() {
    const imgDebris = generateSyntheticSonarSwath(800, 500, 'debris_field');
    const imgWreck = generateSyntheticSonarSwath(800, 500, 'wreck');
    const imgPipeline = generateSyntheticSonarSwath(800, 500, 'pipeline');

    const scans: SonarScan[] = [
      {
        ...INITIAL_SCANS[0],
        originalImageUrl: imgDebris,
        preprocessedImageUrl: imgDebris,
      },
      {
        ...INITIAL_SCANS[1],
        originalImageUrl: imgWreck,
        preprocessedImageUrl: imgWreck,
      },
      {
        ...INITIAL_SCANS[2],
        originalImageUrl: imgPipeline,
        preprocessedImageUrl: imgPipeline,
      },
    ];

    try {
      localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
      localStorage.setItem(DETECTIONS_KEY, JSON.stringify(INITIAL_DETECTIONS));
      localStorage.setItem(MISSIONS_KEY, JSON.stringify(INITIAL_MISSIONS));
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_SESSIONS));
      localStorage.setItem(DEMO_KEY, 'true');
    } catch {}

    this.notifyScans(scans);
    this.notifyDetections(INITIAL_DETECTIONS);
  }

  public clearAllData() {
    try {
      localStorage.removeItem(SCANS_KEY);
      localStorage.removeItem(DETECTIONS_KEY);
      localStorage.removeItem(MISSIONS_KEY);
      localStorage.removeItem(SESSIONS_KEY);
    } catch {}
    this.notifyScans([]);
    this.notifyDetections([]);
  }
}

export const storageService = new StorageService();
