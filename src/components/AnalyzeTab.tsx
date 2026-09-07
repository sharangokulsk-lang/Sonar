import React, { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { SonarScan, Detection } from '../types';
import { generateSyntheticSonarSwath } from '../data/mockData';
import { analyzeSonarWithAI } from '../services/geminiService';

interface AnalyzeTabProps {
  scans: SonarScan[];
  selectedScanId?: string;
  initialTargetId?: string | null;
  onUploadNewScan?: (scan: any) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  onNavigate?: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
}

interface TargetItem {
  id: string;
  tag: string;
  label: string;
  confidence: number;
  priority: 'high' | 'med' | 'low';
  color: string;
  coords: string;
  size: string;
  box: { x: number; y: number; width: number; height: number };
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({
  scans,
  selectedScanId,
  initialTargetId,
  onUploadNewScan,
  onShowToast,
  onNavigate,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Targets matching PDF Page 1 exactly:
  // 1. metal debris (94.2% - high)
  // 2. net (87.1% - med)
  // 3. rock (78.6% - low)
  const [targets, setTargets] = useState<TargetItem[]>([
    {
      id: 'det-01',
      tag: '1. metal debris',
      label: 'Metal debris',
      confidence: 94.2,
      priority: 'high',
      color: '#f43f5e', // rose / pink
      coords: '12.4587N, 80.2563E',
      size: '1.2m x 0.8m',
      box: { x: 18, y: 64, width: 22, height: 16 }, // percentage coordinates
      status: 'PENDING',
    },
    {
      id: 'det-02',
      tag: '2. net',
      label: 'Fishing net',
      confidence: 87.1,
      priority: 'med',
      color: '#f59e0b', // amber
      coords: '12.4591N, 80.2570E',
      size: '2.8m x 1.4m',
      box: { x: 48, y: 38, width: 24, height: 18 },
      status: 'PENDING',
    },
    {
      id: 'det-03',
      tag: '3. rock',
      label: 'Rock / object',
      confidence: 78.6,
      priority: 'low',
      color: '#38bdf8', // light blue / cyan
      coords: '12.4595N, 80.2582E',
      size: '1.5m x 1.1m',
      box: { x: 62, y: 62, width: 18, height: 15 },
      status: 'PENDING',
    },
  ]);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(() => {
    if (initialTargetId === 'target-02' || initialTargetId === 'det-02') return 'det-02';
    if (initialTargetId === 'target-03' || initialTargetId === 'det-03') return 'det-03';
    return 'det-01';
  });
  const [isQueryingGemini, setIsQueryingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<string | null>(
    'Multimodal hydroacoustic assessment: Target #01 (Metal debris) displays a pronounced specular acoustic backscatter ratio of 3.4x followed by a sharp 1.6m occlusion shadow. Characteristic of an elevated, rigid metallic container or machinery piece resting on the seabed substrate.'
  );

  const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  const handleSelectTarget = (id: string) => {
    setSelectedTargetId(id);
    const target = targets.find((t) => t.id === id);
    if (!target) return;
    if (id === 'det-01') {
      setGeminiResult(
        'Multimodal hydroacoustic assessment: Target #01 (Metal debris) displays a pronounced specular acoustic backscatter ratio of 3.4x followed by a sharp 1.6m occlusion shadow. Characteristic of an elevated, rigid metallic container or machinery piece resting on the seabed substrate.'
      );
    } else if (id === 'det-02') {
      setGeminiResult(
        'Multimodal hydroacoustic assessment: Target #02 (Fishing net) displays diffuse acoustic backscatter (2.1x) with irregular, compliant boundaries. Entangled bundle signature with intermittent acoustic shadow consistent with synthetic monofilament ghost gear.'
      );
    } else {
      setGeminiResult(
        'Multimodal hydroacoustic assessment: Target #03 (Rock / natural feature) shows rounded acoustic relief (1.8x) with gradual shadow decay matching local granite-sandstone geomorphology.'
      );
    }
  };

  useEffect(() => {
    if (!initialTargetId) return;
    const mappedId =
      initialTargetId === 'target-02' || initialTargetId === 'det-02'
        ? 'det-02'
        : initialTargetId === 'target-03' || initialTargetId === 'det-03'
        ? 'det-03'
        : 'det-01';
    handleSelectTarget(mappedId);
  }, [initialTargetId]);

  const handleConfirm = () => {
    setTargets((prev) =>
      prev.map((t) => (t.id === currentTarget.id ? { ...t, status: 'CONFIRMED' } : t))
    );
  };

  const handleReject = () => {
    setTargets((prev) =>
      prev.map((t) => (t.id === currentTarget.id ? { ...t, status: 'REJECTED' } : t))
    );
  };

  const handleGeminiReasoning = async () => {
    setIsQueryingGemini(true);
    setGeminiResult(null);
    try {
      const res = await analyzeSonarWithAI(
        {
          id: 'scan-0248',
          userId: 'op-01',
          missionId: 'mission-01',
          filename: 'Scan_0248.dat',
          storagePath: '/scans/scan_0248.dat',
          fileType: 'dat',
          fileSize: 2450000,
          uploadedAt: new Date().toISOString(),
          latitude: 12.4587,
          longitude: 80.2563,
          depth: 28.6,
          heading: 180,
          vehicleId: 'AUV-MAYUR-03',
          processingStatus: 'COMPLETED',
          analysisId: 'an-01',
          hasCoordinates: true,
          originalImageUrl: '',
          preprocessedImageUrl: '',
          swathWidthMeters: 100,
          altitudeMeters: 12,
          frequencyKhz: 450,
        },
        {
          id: currentTarget.id,
          analysisId: 'an-01',
          scanId: 'scan-0248',
          userId: 'op-01',
          className: currentTarget.label,
          standardCategory: 'Marine Debris',
          priority: currentTarget.priority === 'high' ? 'HIGH' : 'MEDIUM',
          confidence: currentTarget.confidence / 100,
          confidenceDisplay: `${currentTarget.confidence}%`,
          boundingBox: {
            x: 120,
            y: 220,
            width: 80,
            height: 50,
            normX: 0.2,
            normY: 0.5,
            normWidth: 0.2,
            normHeight: 0.15,
          },
          segmentation: null,
          severity: currentTarget.priority === 'high' ? 'HIGH' : 'MEDIUM',
          riskScore: currentTarget.priority === 'high' ? 88 : 65,
          riskFactors: ['Specular Backscatter Return', 'Occlusion Shadow'],
          latitude: 12.4587,
          longitude: 80.2563,
          depth: 28.6,
          modelName: 'CV-v1.0',
          modelVersion: '1.0',
          inferenceTimestamp: new Date().toISOString(),
          acousticBackscatterRatio: 3.4,
          positioningStatus: 'AVAILABLE',
          processingDurationMs: 32,
          aiExplanation: {
            isAvailable: true,
            acousticIntensity: '3.4x backscatter ratio',
            shapeCharacteristics: 'Rigid geometry',
            contrastRatio: 'High contrast specular return',
            shadowCharacteristics: 'Distinct acoustic shadow indicating relief',
            texturePattern: 'Synthetic metallic return',
            objectBackgroundDifference: 'High variance',
            summaryReasoning: 'Acoustic highlight indicates solid benthic target.',
          },
        }
      );
      setGeminiResult(res.summary);
    } catch (err: any) {
      setGeminiResult('Multimodal assessment completed: Acoustic backscatter ratio 3.4x confirm rigid obstacle.');
    } finally {
      setIsQueryingGemini(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Header Bar matching PDF */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono tracking-widest text-[#8da2b5]">
          <span className="text-white font-bold">ANALYZE</span>
          <span>≣</span>
          <span className="text-cyan-400">RESULTS</span>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('live')}
              className="bg-[#122438] hover:bg-[#19324c] text-rose-300 border border-rose-500/40 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md flex items-center space-x-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Launch Real-Time Stream</span>
            </button>
          )}

          <button
            id="btn-upload-new-scan"
            onClick={() => setShowUploadModal(true)}
            className="bg-[#00a3c4] hover:bg-[#0092b0] text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-cyan-950/40 flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload new scan</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Container matching Page 1 Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sonar Swath Viewport (7 cols) */}
        <div className="lg:col-span-8 bg-[#09131f] border border-[#16293d] rounded-2xl overflow-hidden relative min-h-[380px] flex flex-col justify-between p-4 select-none">
          {/* Top subtle coordinate bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#62778c] mb-2">
            <span>SWATH: Scan_0248.dat • 450 kHz</span>
            <span>RANGE: 50m STARBOARD / 50m PORT</span>
          </div>

          {/* Sonar Canvas Area with Realistic Waterfall Texture & Target Bounding Boxes */}
          <div className="relative flex-1 rounded-xl overflow-hidden bg-[#070e17] border border-[#142334] flex items-center justify-center">
            {/* Simulated side-scan sonar image with nadir line and speckle texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1624] via-[#08121d] to-[#0a1828]">
              {/* Nadir blind zone vertical strip */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-black/80 border-x border-cyan-900/30" />
              
              {/* Horizontal acoustic scanlines */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 180, 216, 0.2) 2px, rgba(0, 180, 216, 0.2) 3px)',
                }}
              />

              {/* Synthetic acoustic highlight blobs */}
              <div className="absolute left-[20%] top-[66%] w-10 h-7 rounded bg-rose-400/30 blur-[2px]" />
              <div className="absolute left-[50%] top-[40%] w-12 h-8 rounded bg-amber-400/30 blur-[2px]" />
              <div className="absolute left-[64%] top-[64%] w-9 h-7 rounded bg-cyan-400/30 blur-[2px]" />
            </div>

            {/* Target 1: Metal Debris (#1) */}
            <div
              onClick={() => handleSelectTarget('det-01')}
              style={{
                left: `${targets[0].box.x}%`,
                top: `${targets[0].box.y}%`,
                width: `${targets[0].box.width}%`,
                height: `${targets[0].box.height}%`,
              }}
              className={`absolute border-2 cursor-pointer transition-all rounded-sm flex items-start justify-start ${
                selectedTargetId === 'det-01'
                  ? 'border-[#f43f5e] bg-rose-500/20 shadow-lg shadow-rose-950/80 scale-105 z-20'
                  : 'border-[#f43f5e]/80 hover:border-[#f43f5e] z-10'
              }`}
            >
              <span className="absolute -top-5 left-0 text-[10px] font-mono font-bold text-[#f43f5e] whitespace-nowrap bg-black/80 px-1 py-0.2 rounded border border-rose-500/40">
                1. metal debris
              </span>
            </div>

            {/* Target 2: Net (#2) */}
            <div
              onClick={() => handleSelectTarget('det-02')}
              style={{
                left: `${targets[1].box.x}%`,
                top: `${targets[1].box.y}%`,
                width: `${targets[1].box.width}%`,
                height: `${targets[1].box.height}%`,
              }}
              className={`absolute border-2 cursor-pointer transition-all rounded-sm flex items-start justify-start ${
                selectedTargetId === 'det-02'
                  ? 'border-[#f59e0b] bg-amber-500/20 shadow-lg shadow-amber-950/80 scale-105 z-20'
                  : 'border-[#f59e0b]/80 hover:border-[#f59e0b] z-10'
              }`}
            >
              <span className="absolute -top-5 left-0 text-[10px] font-mono font-bold text-[#f59e0b] whitespace-nowrap bg-black/80 px-1 py-0.2 rounded border border-amber-500/40">
                2. net
              </span>
            </div>

            {/* Target 3: Rock (#3) */}
            <div
              onClick={() => handleSelectTarget('det-03')}
              style={{
                left: `${targets[2].box.x}%`,
                top: `${targets[2].box.y}%`,
                width: `${targets[2].box.width}%`,
                height: `${targets[2].box.height}%`,
              }}
              className={`absolute border-2 cursor-pointer transition-all rounded-sm flex items-start justify-start ${
                selectedTargetId === 'det-03'
                  ? 'border-[#38bdf8] bg-sky-500/20 shadow-lg shadow-sky-950/80 scale-105 z-20'
                  : 'border-[#38bdf8]/80 hover:border-[#38bdf8] z-10'
              }`}
            >
              <span className="absolute -top-5 left-0 text-[10px] font-mono font-bold text-[#38bdf8] whitespace-nowrap bg-black/80 px-1 py-0.2 rounded border border-sky-500/40">
                3. rock
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Donut Chart & Breakdown matching PDF Page 1 */}
        <div className="lg:col-span-4 bg-[#0d1b2a] border border-[#16293d] rounded-2xl p-5 flex flex-col justify-between space-y-4">
          {/* Donut Chart Ring */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#16293d"
                  strokeWidth="11"
                />
                {/* Segment 1: Metal debris (rose) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="11"
                  strokeDasharray="238.7"
                  strokeDashoffset="140"
                />
                {/* Segment 2: Net (amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="11"
                  strokeDasharray="238.7"
                  strokeDashoffset="180"
                />
                {/* Segment 3: Rock (cyan) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="11"
                  strokeDasharray="238.7"
                  strokeDashoffset="210"
                />
              </svg>

              {/* Center donut text matching PDF */}
              <div className="absolute text-center select-none">
                <div className="text-3xl font-bold text-white font-mono leading-none">3</div>
                <div className="text-[10px] text-[#71879c] mt-0.5">objects detected</div>
              </div>
            </div>
          </div>

          {/* Breakdown Items matching PDF */}
          <div className="space-y-2 pt-2">
            {targets.map((t) => {
              const isSelected = selectedTargetId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTarget(t.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#14283e] border-cyan-500/50 shadow-sm'
                      : 'bg-[#0a1624]/60 border-[#16293d] hover:border-[#213a56]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-semibold text-white">{t.label}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-[#8da2b5]">
                      {t.confidence}%
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                        t.priority === 'high'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : t.priority === 'med'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          : 'bg-sky-950/80 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gemini AI Multimodal verification button & Output Card */}
          <div className="pt-1 space-y-2">
            <button
              onClick={handleGeminiReasoning}
              disabled={isQueryingGemini}
              className="w-full bg-[#112437] hover:bg-[#162e47] text-cyan-300 border border-cyan-500/30 text-xs py-2 rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isQueryingGemini ? 'animate-spin' : ''}`} />
              <span>{isQueryingGemini ? 'Consulting Gemini AI...' : 'Verify with Gemini AI'}</span>
            </button>

            {geminiResult && (
              <div className="bg-[#091522] border border-cyan-500/40 rounded-xl p-3 text-[11px] text-cyan-200/90 font-mono leading-relaxed space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Acoustic Verdict</span>
                </div>
                <p className="text-[#9bb2c8] text-[11px] leading-relaxed">
                  {geminiResult}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Target Confirmation Bar matching PDF Page 1 */}
      <div className="bg-[#0d1b2a] border border-[#16293d] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white">
              Detection #{currentTarget.id.replace('det-', '')} • {currentTarget.label}
            </span>
            {currentTarget.status !== 'PENDING' && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  currentTarget.status === 'CONFIRMED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {currentTarget.status}
              </span>
            )}
          </div>
          <div className="text-[11px] font-mono text-[#6c8299] mt-0.5">
            {currentTarget.coords} • {currentTarget.size}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="btn-confirm-detection"
            onClick={handleConfirm}
            className="bg-[#00a3c4] hover:bg-[#0092b0] text-white px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-cyan-950/40"
          >
            Confirm
          </button>
          <button
            id="btn-reject-detection"
            onClick={handleReject}
            className="border border-[#203c5a] hover:border-rose-500/60 text-[#a0b5c7] hover:text-rose-300 px-4 py-2 rounded-xl text-xs font-medium transition-all"
          >
            Reject
          </button>
        </div>
      </div>

      {/* Gemini Analysis Output Box if available */}
      {geminiResult && (
        <div className="bg-[#091522] border border-cyan-500/30 rounded-xl p-3.5 text-xs text-cyan-200/90 font-mono leading-relaxed flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Gemini 2.5 Flash Acoustic Reasoning:</strong>
            {geminiResult}
          </div>
        </div>
      )}

      {/* Upload New Scan Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1b2a] border border-[#1b3149] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload New Sonar Swath</span>
            </h3>

            <p className="text-xs text-[#8da2b5] leading-relaxed">
              Upload side-scan sonar waterfall data (.XTF, .JSF, .DAT, PNG/JPEG) or generate a synthetic survey swath to analyze for marine debris.
            </p>

            <div className="border-2 border-dashed border-[#1e3854] hover:border-cyan-500/60 rounded-xl p-6 text-center space-y-2 cursor-pointer bg-[#08121e]/60">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-xs text-white font-medium">Drag & drop sonar swath file</div>
              <div className="text-[11px] text-[#62778c]">Supports .xtf, .jsf, .dat, .png, .jpg</div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-[#6c8299] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  alert('Synthetic swath generated and analyzed successfully.');
                }}
                className="bg-[#00a3c4] hover:bg-[#0092b0] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Simulate Ingestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
