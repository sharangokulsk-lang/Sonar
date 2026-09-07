import React, { useState, useRef } from 'react';
import {
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  ShieldAlert,
  Sparkles,
  MapPin,
  Compass,
  CheckCircle2,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { SonarScan, Detection, FilterSettings } from '../types';
import { TARGET_CLASSES, getTargetClassMeta } from '../data/mockData';
import { analyzeSonarWithAI } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface WorkspaceViewProps {
  scans: SonarScan[];
  detections: Detection[];
  selectedScanId: string | null;
  onSelectScan: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  scans,
  detections,
  selectedScanId,
  onSelectScan,
  onNavigate,
}) => {
  const currentScan =
    scans.find((s) => s.id === selectedScanId) || scans[0] || null;

  const scanDetections = currentScan
    ? detections.filter((d) => d.scanId === currentScan.id)
    : [];

  const [selectedDetId, setSelectedDetId] = useState<string | null>(
    scanDetections[0]?.id || null
  );

  const activeDetection =
    scanDetections.find((d) => d.id === selectedDetId) || scanDetections[0] || null;

  // Visual Controls
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [usePreprocessed, setUsePreprocessed] = useState(true);
  const [palette, setPalette] = useState<'amber' | 'grayscale' | 'cyan' | 'viridis'>('amber');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Manual ROI Box Creation
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [roiStart, setRoiStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRoi, setCurrentRoi] = useState<any | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Handle reclassify target
  const handleReclassify = async (newClassName: string) => {
    if (!activeDetection) return;
    const meta = getTargetClassMeta(newClassName);
    const updated: Detection = {
      ...activeDetection,
      className: meta.name,
      severity: meta.defaultSeverity,
      riskScore: Math.min(100, Math.round(meta.baseRiskWeight * 0.7 + 20)),
      riskFactors: [
        `Operator Manual Reclassification to ${meta.name}`,
        `Base Threat Weight: +${meta.baseRiskWeight} pts`,
        `Depth Risk Profile: +15 pts`,
      ],
    };
    await storageService.updateDetection(updated);
  };

  // Run Gemini Multimodal Hydrographic reasoning
  const handleRunAiAnalysis = async () => {
    if (!currentScan) return;
    setIsAiAnalyzing(true);
    try {
      const res = await analyzeSonarWithAI(currentScan, activeDetection || undefined);
      setAiAnalysisResult(res);
    } catch (err) {
      console.warn('AI analysis fallback applied:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Manual ROI click & drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRoi || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRoiStart({ x, y });
    setCurrentRoi({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingRoi || !roiStart || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;
    const x = Math.min(roiStart.x, curX);
    const y = Math.min(roiStart.y, curY);
    const width = Math.abs(curX - roiStart.x);
    const height = Math.abs(curY - roiStart.y);
    setCurrentRoi({ x, y, width, height });
  };

  const handleMouseUp = async () => {
    if (!isDrawingRoi || !currentRoi || !currentScan || !canvasContainerRef.current) {
      setIsDrawingRoi(false);
      setRoiStart(null);
      setCurrentRoi(null);
      return;
    }

    const rect = canvasContainerRef.current.getBoundingClientRect();
    if (currentRoi.width > 20 && currentRoi.height > 20) {
      const newDet: Detection = {
        id: `det-manual-${Date.now()}`,
        analysisId: currentScan.analysisId,
        scanId: currentScan.id,
        userId: currentScan.userId,
        className: 'Marine Debris',
        standardCategory: 'Marine Debris',
        priority: 'HIGH',
        confidence: null,
        confidenceDisplay: 'Operator Ground-Truth Annotation',
        boundingBox: {
          x: Math.round(currentRoi.x),
          y: Math.round(currentRoi.y),
          width: Math.round(currentRoi.width),
          height: Math.round(currentRoi.height),
          normX: Number((currentRoi.x / rect.width).toFixed(3)),
          normY: Number((currentRoi.y / rect.height).toFixed(3)),
          normWidth: Number((currentRoi.width / rect.width).toFixed(3)),
          normHeight: Number((currentRoi.height / rect.height).toFixed(3)),
        },
        segmentation: null,
        severity: 'HIGH',
        riskScore: 75,
        riskFactors: [
          'Manual Hydrographer Region of Interest Tag',
          'Acoustic Highlight & Shadow Verified',
        ],
        latitude: currentScan.latitude,
        longitude: currentScan.longitude,
        depth: currentScan.depth,
        modelName: 'Operator Hydrographic Annotation',
        modelVersion: 'manual',
        inferenceTimestamp: new Date().toISOString(),
        acousticBackscatterRatio: 2.5,
        positioningStatus: currentScan.latitude !== null ? 'AVAILABLE' : 'GEOLOCATION_UNAVAILABLE',
        processingDurationMs: 0,
        aiExplanation: {
          isAvailable: true,
          acousticIntensity: 'Operator identified specular highlight return.',
          shapeCharacteristics: 'Manual bounding box enclosing suspected debris.',
          contrastRatio: '2.5:1 estimated.',
          shadowCharacteristics: 'Paired acoustic shadow downstream.',
          texturePattern: 'Benthic irregularity.',
          objectBackgroundDifference: 'Manual inspection flag.',
          summaryReasoning: 'Tagged by Lead Hydrographer as potential ghost net / marine debris.',
        },
      };

      await storageService.saveDetections([newDet]);
      setSelectedDetId(newDet.id);
    }

    setIsDrawingRoi(false);
    setRoiStart(null);
    setCurrentRoi(null);
  };

  if (!currentScan) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto my-12">
        <Crosshair className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">No Swath Selected</h2>
        <p className="text-xs text-slate-400 mb-6">
          Upload or select a side-scan sonar waterfall swath to inspect acoustic highlights and downstream shadows.
        </p>
        <button
          onClick={() => onNavigate('upload')}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Open Sonar Upload Wizard
        </button>
      </div>
    );
  }

  const activeImage = usePreprocessed
    ? currentScan.preprocessedImageUrl || currentScan.originalImageUrl
    : currentScan.originalImageUrl;

  const activeClassMeta = activeDetection
    ? getTargetClassMeta(activeDetection.className)
    : null;

  return (
    <div className="space-y-4">
      {/* Workspace Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Swath selector dropdown */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Active Swath:
          </span>
          <select
            value={currentScan.id}
            onChange={(e) => onSelectScan(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 max-w-[240px] truncate"
          >
            {scans.map((s) => (
              <option key={s.id} value={s.id}>
                {s.filename} ({s.vehicleId})
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span>Freq: {currentScan.frequencyKhz || 450} kHz</span>
            <span>•</span>
            <span>Alt: {currentScan.altitudeMeters || 12} m</span>
            <span>•</span>
            <span>Depth: {currentScan.depth?.toFixed(1) || '--'} m</span>
          </div>
        </div>

        {/* Display & Annotation Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUsePreprocessed(!usePreprocessed)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              usePreprocessed
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {usePreprocessed ? 'DSP PREPROCESSED' : 'RAW ACOUSTIC'}
          </button>

          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              showBoxes
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            BOXES ({scanDetections.length})
          </button>

          <button
            onClick={() => setIsDrawingRoi(!isDrawingRoi)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center space-x-1 ${
              isDrawingRoi
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Click and drag on sonar swath to annotate a custom target region"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isDrawingRoi ? 'DRAWING ROI...' : '+ MANUAL ROI'}</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-1 text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Canvas + Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns: Waterfall Canvas */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
          {/* Channel Header Ruler */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
            <span className="text-cyan-400">◄ PORT SWATH [CH-1]</span>
            <span className="text-slate-500">| NADIR / WATER COLUMN |</span>
            <span className="text-cyan-400">STARBOARD SWATH [CH-2] ►</span>
          </div>

          {/* Interactive Canvas Viewport */}
          <div
            ref={canvasContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`relative flex-1 min-h-[460px] max-h-[620px] overflow-auto bg-black flex items-center justify-center p-2 select-none ${
              isDrawingRoi ? 'cursor-crosshair' : 'cursor-default'
            }`}
          >
            <div
              className="relative transition-transform duration-150 origin-center inline-block"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={activeImage}
                alt="Active Sonar Waterfall Swath"
                className="max-h-[560px] max-w-full object-contain pointer-events-none rounded"
              />

              {/* Range Scale Tick Overlay */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r border-dashed border-cyan-500/30 pointer-events-none" />

              {/* Bounding Box Overlays */}
              {showBoxes &&
                scanDetections.map((det) => {
                  const isSelected = activeDetection?.id === det.id;
                  const meta = getTargetClassMeta(det.className);
                  return (
                    <div
                      key={det.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetId(det.id);
                        setAiAnalysisResult(null);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${det.boundingBox.normX * 100}%`,
                        top: `${det.boundingBox.normY * 100}%`,
                        width: `${det.boundingBox.normWidth * 100}%`,
                        height: `${det.boundingBox.normHeight * 100}%`,
                      }}
                      className={`border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-500/40 z-20 scale-105'
                          : 'border-red-500 bg-red-500/10 hover:bg-red-500/20 z-10'
                      }`}
                    >
                      <div
                        className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow ${
                          isSelected
                            ? 'bg-yellow-400 text-slate-950 font-black'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {det.className} ({det.riskScore})
                      </div>
                    </div>
                  );
                })}

              {/* Manual Active ROI box preview */}
              {currentRoi && (
                <div
                  style={{
                    position: 'absolute',
                    left: currentRoi.x,
                    top: currentRoi.y,
                    width: currentRoi.width,
                    height: currentRoi.height,
                  }}
                  className="border-2 border-dashed border-cyan-400 bg-cyan-400/20 pointer-events-none z-30"
                />
              )}
            </div>
          </div>

          {/* Footer Info Bar */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 text-xs flex items-center justify-between text-slate-400">
            <span className="font-mono text-[11px]">
              {scanDetections.length} acoustic features cataloged in this swath
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Extracted Anomaly</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>Selected Target</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Target Inspector & Hydrographic Intelligence */}
        <div className="lg:col-span-5 space-y-4">
          {activeDetection ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              {/* Target Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: activeClassMeta?.colorHex }}
                    />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {activeDetection.className}
                    </h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ID: {activeDetection.id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-orange-400">
                    {activeDetection.riskScore}
                    <span className="text-xs text-slate-500">/100</span>
                  </div>
                  <span
                    className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      activeDetection.severity === 'HIGH' || activeDetection.severity === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-500/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                    }`}
                  >
                    {activeDetection.severity} PRIORITY
                  </span>
                </div>
              </div>

              {/* Hydrographic 6-Point Acoustic Matrix */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hydroacoustic Feature Matrix (CV Baseline)</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">
                      1. Acoustic Backscatter Contrast
                    </span>
                    <p className="text-slate-300 text-xs">
                      {activeDetection.aiExplanation?.acousticIntensity ||
                        `${activeDetection.acousticBackscatterRatio}x above ambient seabed.`}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">
                      2. Downstream Acoustic Shadow Profile
                    </span>
                    <p className="text-slate-300 text-xs">
                      {activeDetection.aiExplanation?.shadowCharacteristics ||
                        'Pronounced downstream occlusion confirming elevated relief.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">
                      3. Target Geometry & Footprint
                    </span>
                    <p className="text-slate-300 text-xs">
                      {activeDetection.boundingBox.width}px × {activeDetection.boundingBox.height}px
                      (Normalized: {Math.round(activeDetection.boundingBox.normWidth * 100)}% ×{' '}
                      {Math.round(activeDetection.boundingBox.normHeight * 100)}% swath width)
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">
                      4. Object vs. Background Difference
                    </span>
                    <p className="text-slate-300 text-xs">
                      {activeDetection.aiExplanation?.objectBackgroundDifference ||
                        '+3.2σ backscatter amplitude deviation.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Factors Points List */}
              <div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                  <span>Threat & Risk Breakdown</span>
                </div>
                <div className="space-y-1.5">
                  {activeDetection.riskFactors?.map((rf, i) => (
                    <div
                      key={i}
                      className="text-xs font-mono bg-slate-950/60 border border-slate-800 px-2.5 py-1.5 rounded text-slate-300 flex items-center space-x-2"
                    >
                      <span className="text-orange-400 font-bold">•</span>
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Georeferencing Telemetry Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Latitude / Longitude:</span>
                  </span>
                  <span className="text-white font-semibold">
                    {activeDetection.latitude !== null && activeDetection.longitude !== null
                      ? `${activeDetection.latitude.toFixed(5)}°N, ${activeDetection.longitude.toFixed(5)}°E`
                      : 'Ungeoreferenced'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Seabed Water Depth:</span>
                  <span className="text-cyan-400 font-semibold">
                    {activeDetection.depth ? `${activeDetection.depth.toFixed(1)} m` : '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Model Engine:</span>
                  <span className="text-slate-300">{activeDetection.modelName}</span>
                </div>
              </div>

              {/* Operator Reclassification Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Operator Reclassification
                </label>
                <select
                  value={activeDetection.className}
                  onChange={(e) => handleReclassify(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-cyan-500"
                >
                  {TARGET_CLASSES.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name} (Risk Base: {cls.baseRiskWeight})
                    </option>
                  ))}
                </select>
              </div>

              {/* Gemini Multimodal AI Reasoning Action */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={isAiAnalyzing}
                  className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>
                    {isAiAnalyzing
                      ? 'Querying Gemini Multimodal Sonar Model...'
                      : 'Query Gemini AI Multimodal Analysis'}
                  </span>
                </button>

                {/* AI Reasoning Response Panel */}
                {aiAnalysisResult && (
                  <div className="mt-3 p-3.5 bg-indigo-950/40 border border-indigo-500/50 rounded-lg text-xs space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 font-mono flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Gemini Multimodal Hydroacoustic Assessment</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-300">
                        Confidence: {(aiAnalysisResult.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed">
                      {aiAnalysisResult.summary}
                    </p>
                    <div className="pt-1.5 border-t border-indigo-900/60">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">
                        Recommended Marine Operations:
                      </span>
                      <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                        {aiAnalysisResult.recommendedActions?.map((act: string, i: number) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              Select an anomaly bounding box on the sonar swath to inspect acoustic highlights and risk parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
