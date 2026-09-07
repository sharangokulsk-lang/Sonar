import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  Compass,
  Radio,
  MapPin,
  Sliders,
  Cpu,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Mission, SonarScan, FilterSettings } from '../types';
import { generateSyntheticSonarSwath } from '../data/mockData';
import { processSonarImage, extractAcousticDetections } from '../utils/sonarDeduction';
import { storageService } from '../services/storageService';

interface UploadViewProps {
  userId: string;
  missions: Mission[];
  onComplete: (scanId: string) => void;
  onNavigate: (tab: string) => void;
  onSelectScan: (scanId: string) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  userId,
  missions,
  onComplete,
  onNavigate,
  onSelectScan,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    dataUrl: string;
  } | null>(null);

  // Form states
  const [selectedMissionId, setSelectedMissionId] = useState(
    missions[0]?.id || 'mission-goa-survey-2026'
  );
  const [vehicleId, setVehicleId] = useState('AUV-MAYUR-03');
  const [frequencyKhz, setFrequencyKhz] = useState(450);
  const [swathWidthMeters, setSwathWidthMeters] = useState(100);
  const [altitudeMeters, setAltitudeMeters] = useState(12);

  // Telemetry
  const [latitude, setLatitude] = useState<number | null>(15.4182);
  const [longitude, setLongitude] = useState<number | null>(73.7785);
  const [depth, setDepth] = useState<number | null>(20.4);
  const [heading, setHeading] = useState<number | null>(260);

  // Preprocessing options
  const [filters, setFilters] = useState<FilterSettings>({
    grayscale: true,
    normalizeIntensity: true,
    contrastEnhance: true,
    denoiseSpeckle: true,
    clahe: true,
    seabedNormalize: true,
    colorMap: 'amber',
    slantRangeCorrection: false,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    dataUrl: string;
    metrics: any;
  } | null>(null);
  const [detectedTargets, setDetectedTargets] = useState<any[]>([]);

  // Step 1: Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          size: file.size,
          dataUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate synthetic swath for instant testing
  const handleGenerateSynthetic = (type: 'debris_field' | 'wreck' | 'pipeline') => {
    const dataUrl = generateSyntheticSonarSwath(800, 500, type);
    setSelectedFile({
      name: `synth_sidescan_${type}_${Date.now().toString().slice(-4)}.png`,
      size: 1024 * 750,
      dataUrl,
    });
  };

  // Run Preprocessing pipeline (Step 6)
  const runPreprocessing = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const res = await processSonarImage(selectedFile.dataUrl, filters);
      setProcessedResult({
        dataUrl: res.processedDataUrl,
        metrics: res.metrics,
      });
      setCurrentStep(6);
    } catch (err) {
      alert('Preprocessing failed: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Run Feature Extractor (Step 7)
  const runDetection = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const imgToScan = processedResult ? processedResult.dataUrl : selectedFile.dataUrl;
      const scanId = `scan-${Date.now()}`;
      const dets = await extractAcousticDetections(imgToScan, scanId, {
        latitude,
        longitude,
        depth,
        vehicleId,
        altitudeMeters,
        swathWidthMeters,
      });
      setDetectedTargets(dets);
      setCurrentStep(8);
    } catch (err) {
      alert('Detection failed: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit and finalize
  const handleFinalize = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const scanId = `scan-${Date.now()}`;
      const newScan: SonarScan = {
        id: scanId,
        userId,
        missionId: selectedMissionId,
        filename: selectedFile.name,
        storagePath: `sonar/uploads/${selectedFile.name}`,
        fileType: 'image/png',
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        latitude,
        longitude,
        depth,
        heading,
        vehicleId,
        processingStatus: 'COMPLETED',
        analysisId: `analysis-${scanId}`,
        hasCoordinates: latitude !== null && longitude !== null,
        coordinateDisplay:
          latitude !== null && longitude !== null
            ? `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
            : 'Ungeoreferenced',
        originalImageUrl: selectedFile.dataUrl,
        preprocessedImageUrl: processedResult?.dataUrl || selectedFile.dataUrl,
        swathWidthMeters,
        altitudeMeters,
        frequencyKhz,
        metrics: processedResult?.metrics,
      };

      await storageService.saveSonarScan(newScan);
      if (detectedTargets.length > 0) {
        const detsWithScanId = detectedTargets.map((d) => ({
          ...d,
          scanId,
          analysisId: `analysis-${scanId}`,
        }));
        await storageService.saveDetections(detsWithScanId);
      }

      onComplete(scanId);
      onSelectScan(scanId);
      onNavigate('workspace');
    } catch (err) {
      alert('Failed to save survey swath: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Swath File', icon: UploadCloud },
    { num: 2, title: 'Mission', icon: Compass },
    { num: 3, title: 'Sensor / AUV', icon: Radio },
    { num: 4, title: 'Telemetry', icon: MapPin },
    { num: 5, title: 'DSP Filters', icon: Sliders },
    { num: 6, title: 'Preprocess Preview', icon: FileCheck },
    { num: 7, title: 'CV Extractor', icon: Cpu },
    { num: 8, title: 'Target Class', icon: ShieldAlert },
    { num: 9, title: 'Anomaly Review', icon: Sparkles },
    { num: 10, title: 'Commit', icon: Check },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                SWATH INGESTION
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                10-Step Sonar Upload & Hydroacoustic Pipeline Wizard
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic calibration, slant-range TVG correction, specular highlight extraction, and anomaly cataloging.
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1.5 rounded border border-cyan-500/40 shrink-0">
            Step {currentStep} of 10
          </div>
        </div>

        {/* Wizard Steps Bar */}
        <div className="mt-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center space-x-2 min-w-[720px]">
            {stepsList.map((st) => {
              const isDone = currentStep > st.num;
              const isCurrent = currentStep === st.num;
              return (
                <div
                  key={st.num}
                  onClick={() => {
                    if (isDone || (currentStep >= 5 && st.num <= currentStep)) {
                      setCurrentStep(st.num);
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50'
                      : isDone
                      ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                      : 'bg-slate-950/60 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-mono">
                    {isDone ? '✓' : st.num}
                  </span>
                  <span className="whitespace-nowrap">{st.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm min-h-[420px] flex flex-col justify-between">
        {/* Step 1: File Selection & Synthetic Swath */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>Step 1: Select Raw Side-Scan Sonar Waterfall Swath</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload an hydroacoustic swath image (.png, .jpg, .tiff, GeoTIFF) or load a procedural synthetic demonstration swath with calibrated acoustic specular highlights and acoustic shadows.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Drag & Drop File Upload */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-colors bg-slate-950/50">
                <UploadCloud className="w-10 h-10 text-cyan-400 mb-3" />
                <span className="text-sm font-semibold text-white mb-1">
                  Drag & drop sonar image file
                </span>
                <span className="text-xs text-slate-400 mb-4">Supports PNG, JPEG, TIFF</span>
                <label className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow">
                  Browse Files
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Synthetic Procedural Swaths */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generate Procedural Demonstration Swath</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesize an hydroacoustic seabed swath modeled with ITU-R BT.601 backscatter noise, nadir altitude gap, and paired acoustic shadow relief:
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleGenerateSynthetic('debris_field')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Marine Debris & Ghost Net Field
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Submerged plastic containers, discarded nets, trawl snag hazards
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono">Load &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleGenerateSynthetic('wreck')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Barge Wreckage & Hull Anomaly
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Large elongated high-backscatter metallic frame with extensive shadow
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono">Load &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleGenerateSynthetic('pipeline')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Exposed Subsea Pipeline Segment
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Linear infrastructure highlight with bathymetric sediment scour
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 font-mono">Load &rarr;</span>
                  </button>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 bg-cyan-950/50 border border-cyan-500/40 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedFile.dataUrl}
                    alt="Swath preview"
                    className="w-16 h-10 object-cover rounded border border-cyan-500/50 bg-black"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">{selectedFile.name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Image Loaded Ready for Pipeline
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">Ready</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Mission Association */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Step 2: Assign to Hydrographic Survey Mission</span>
            </h2>
            <p className="text-xs text-slate-400">
              Link this sonar swath to an active hydrographic survey campaign for grouped risk tracking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMissionId(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedMissionId === m.id
                      ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{m.missionName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {m.missionCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{m.surveyArea}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3">
                    <span>Operator: {m.operator}</span>
                    <span>Platform: {m.vehicleId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Sensor & Vehicle Configuration */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              <span>Step 3: Vehicle & Sensor Geometry Parameters</span>
            </h2>
            <p className="text-xs text-slate-400">
              Specify acoustic frequency and towfish altitude above seabed for slant-range geometry and obstacle height calculation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vehicle Identifier
                </label>
                <input
                  type="text"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Acoustic Carrier Frequency (kHz)
                </label>
                <select
                  value={frequencyKhz}
                  onChange={(e) => setFrequencyKhz(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={450}>450 kHz (High-Resolution Seabed Search)</option>
                  <option value={900}>900 kHz (Ultra-High Resolution Debris Inspection)</option>
                  <option value={100}>100 kHz (Deep Continental Shelf Penetration)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Swath Width (meters per channel)
                </label>
                <input
                  type="number"
                  value={swathWidthMeters}
                  onChange={(e) => setSwathWidthMeters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Towfish Altitude Above Seabed (meters)
                </label>
                <input
                  type="number"
                  value={altitudeMeters}
                  onChange={(e) => setAltitudeMeters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Georeferencing Telemetry */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Step 4: Georeferencing & Navigation Telemetry</span>
            </h2>
            <p className="text-xs text-slate-400">
              Provide GPS / USBL coordinate fixes and bathymetric sounding for spatial mapping.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Center Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude ?? ''}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Center Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude ?? ''}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bathymetric Water Depth (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={depth ?? ''}
                  onChange={(e) => setDepth(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vessel Track Heading (degrees)
                </label>
                <input
                  type="number"
                  step="1"
                  value={heading ?? ''}
                  onChange={(e) => setHeading(e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: DSP Filter Options */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Step 5: Preprocessing DSP Filter Pipeline Configuration</span>
            </h2>
            <p className="text-xs text-slate-400">
              Configure hydroacoustic digital signal processing stages applied before feature extraction:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                {
                  key: 'grayscale',
                  title: 'Acoustic Grayscale Mapping',
                  desc: 'ITU-R BT.601 standard luminance matrix',
                },
                {
                  key: 'normalizeIntensity',
                  title: 'Min-Max Dynamic Range Normalization',
                  desc: 'Full 8-bit dynamic expansion [0 - 255]',
                },
                {
                  key: 'contrastEnhance',
                  title: 'Histogram Percentile Stretch',
                  desc: 'Clips top/bottom 1% acoustic backscatter extremes',
                },
                {
                  key: 'denoiseSpeckle',
                  title: 'Acoustic Speckle Noise Suppression',
                  desc: '3x3 spatial median matrix filter',
                },
                {
                  key: 'clahe',
                  title: 'CLAHE Slant-Range Equalization',
                  desc: '4x4 localized grid with clip limit 2.5',
                },
                {
                  key: 'seabedNormalize',
                  title: 'Seabed TVG Attenuation Equalization',
                  desc: 'Corrects radial transmission loss from nadir outward',
                },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start space-x-3 cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(filters as any)[opt.key]}
                    onChange={(e) =>
                      setFilters({ ...filters, [opt.key]: e.target.checked })
                    }
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">{opt.title}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hydroacoustic False-Color Palette
              </label>
              <select
                value={filters.colorMap}
                onChange={(e) =>
                  setFilters({ ...filters, colorMap: e.target.value as any })
                }
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              >
                <option value="amber">Amber Phosphor Bronze (Classic Sonar)</option>
                <option value="grayscale">Pure Acoustic Grayscale</option>
                <option value="cyan">Oceanic Cyan Bathymetry</option>
                <option value="viridis">Perceptually Uniform Viridis</option>
                <option value="deepsea">Deep Sea Oceanic Blue</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 6: Preprocessing Execution Preview */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>Step 6: Preprocessed Sonar Waterfall Swath</span>
            </h2>

            {processedResult ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-black max-h-[300px] flex items-center justify-center">
                  <img
                    src={processedResult.dataUrl}
                    alt="Processed Swath"
                    className="max-h-[300px] w-full object-contain"
                  />
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">EXECUTION TIME</span>
                    <span className="text-cyan-400 font-bold">
                      {processedResult.metrics.durationMs} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ORIGINAL BRIGHTNESS</span>
                    <span className="text-white">
                      {processedResult.metrics.originalMeanBrightness} DN
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROCESSED BRIGHTNESS</span>
                    <span className="text-white">
                      {processedResult.metrics.processedMeanBrightness} DN
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CONTRAST RATIO</span>
                    <span className="text-emerald-400 font-bold">
                      {processedResult.metrics.contrastRatio}:1
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Stages Executed:</span>{' '}
                  {processedResult.metrics.operationsApplied.join(' • ')}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <button
                  onClick={runPreprocessing}
                  disabled={isProcessing}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-md"
                >
                  {isProcessing ? 'Executing DSP Pipeline...' : 'Run Preprocessing Pipeline'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 7: Computer Vision Feature Extractor */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Step 7: Deterministic Highlight-Shadow CV Extractor</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The baseline computer vision engine analyzes acoustic impedance gradients, identifies high-backscatter specular highlights, and matches paired downstream acoustic shadows.
            </p>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300 font-mono">
              <div className="flex justify-between">
                <span>Model Engine:</span>
                <span className="text-cyan-400">CV-v1.0 (Acoustic Backscatter & Shadow Extractor)</span>
              </div>
              <div className="flex justify-between">
                <span>Shadow Height Formula:</span>
                <span className="text-amber-400">H = (Shadow_Length * Altitude) / Slant_Range</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Altitude:</span>
                <span className="text-white">{altitudeMeters} m</span>
              </div>
              <div className="flex justify-between">
                <span>Swath Coverage:</span>
                <span className="text-white">{swathWidthMeters * 2} m total footprint</span>
              </div>
            </div>

            <div className="text-center py-4">
              <button
                onClick={runDetection}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-950"
              >
                {isProcessing ? 'Analyzing Acoustic Backscatter...' : 'Extract Acoustic Features & Shadows'}
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Classification & Risk Scoring */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>Step 8: Acoustic Class & Risk Factor Scoring</span>
            </h2>

            <div className="text-xs text-slate-300 font-mono">
              Detected <span className="text-cyan-400 font-bold">{detectedTargets.length}</span> acoustic anomaly targets in swath.
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {detectedTargets.map((d, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{d.className}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          d.severity === 'HIGH' || d.severity === 'CRITICAL'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {d.severity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Specular Backscatter: {d.acousticBackscatterRatio}x • Dimensions: {d.boundingBox.width}x{d.boundingBox.height}px
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-orange-400 font-mono">
                      {d.riskScore} / 100
                    </div>
                    <div className="text-[9px] text-slate-500">Risk Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Anomaly Bounding Box Review */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Step 9: Review Acoustic Bounding Boxes & Shadow Profiles</span>
            </h2>

            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black max-h-[280px] flex items-center justify-center">
              <img
                src={processedResult?.dataUrl || selectedFile?.dataUrl}
                alt="Sonar swath with boxes"
                className="max-h-[280px] w-full object-contain"
              />
              {/* Overlay Bounding Boxes */}
              {detectedTargets.map((d, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${d.boundingBox.normX * 100}%`,
                    top: `${d.boundingBox.normY * 100}%`,
                    width: `${d.boundingBox.normWidth * 100}%`,
                    height: `${d.boundingBox.normHeight * 100}%`,
                  }}
                  className="border-2 border-red-500 bg-red-500/10 pointer-events-none"
                >
                  <span className="absolute -top-4 left-0 bg-red-600 text-white text-[9px] font-mono px-1 rounded whitespace-nowrap">
                    {d.className} ({d.riskScore})
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              All targets are georeferenced and indexed. In Step 10, the swath will be permanently committed to the survey database.
            </p>
          </div>
        )}

        {/* Step 10: Commit to Survey Session */}
        {currentStep === 10 && (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Pipeline Verification Complete</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Swath <span className="font-mono text-cyan-400">{selectedFile?.name}</span> is prepared with {detectedTargets.length} extracted acoustic hazards. Click finalize to commit this swath to the survey session and enter the interactive Analysis Workspace.
            </p>

            <div className="pt-4">
              <button
                onClick={handleFinalize}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-950 flex items-center space-x-2 mx-auto"
              >
                <span>Commit Swath & Launch Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Wizard Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {currentStep === 1 && selectedFile && (
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Next: Mission Association</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep >= 2 && currentStep <= 4 && (
              <button
                onClick={() => setCurrentStep((p) => p + 1)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 5 && (
              <button
                onClick={runPreprocessing}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Execute Preprocessing</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 6 && (
              <button
                onClick={() => setCurrentStep(7)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Proceed to Extractor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 7 && (
              <button
                onClick={runDetection}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Run Feature Extraction</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep >= 8 && currentStep < 10 && (
              <button
                onClick={() => setCurrentStep((p) => p + 1)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
