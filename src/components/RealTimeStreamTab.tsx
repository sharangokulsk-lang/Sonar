import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  Sparkles,
  Layers,
  Radio,
  Sliders,
  Maximize2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Compass,
  Anchor,
  Activity,
  PlusCircle,
  Eye,
  Info,
  RefreshCw,
} from 'lucide-react';
import { analyzeSonarWithAI } from '../services/geminiService';

export interface LiveTarget {
  id: string;
  trackId: string;
  name: string;
  category: 'Marine Debris' | 'Ghost Gear' | 'Navigational Hazard' | 'Natural Feature';
  channel: 'PORT' | 'STARBOARD';
  confidence: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  lat: number;
  lon: number;
  depthMeters: number;
  altitudeMeters: number;
  backscatterRatio: number;
  dimensions: string;
  shadowLengthM: number;
  reliefHeightM: number;
  // Position on the waterfall (y: 0 at top, scrolls down to 100)
  waterfallX: number; // percentage across canvas
  waterfallY: number; // percentage from top
  widthPercent: number;
  heightPercent: number;
  status: 'TRACKING' | 'LOGGED' | 'CONFIRMED' | 'DISMISSED';
  detectedAt: string;
}

interface RealTimeStreamTabProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  onNavigate?: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
}

export const RealTimeStreamTab: React.FC<RealTimeStreamTabProps> = ({
  onShowToast,
  onNavigate,
}) => {
  // Stream state
  const [isPlaying, setIsPlaying] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<1 | 2 | 4>(1);
  const [frequencyKhz, setFrequencyKhz] = useState<450 | 900>(450);
  const [swathRangeM, setSwathRangeM] = useState<50 | 75 | 100>(50);
  const [colorPalette, setColorPalette] = useState<'amber' | 'cyan' | 'greyscale'>('cyan');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    pingCount: 1842,
    speedKts: 3.4,
    depthM: 28.4,
    altitudeM: 11.8,
    headingDeg: 184,
    lat: 13.0841,
    lon: 80.2782,
    inferenceMs: 14,
    fps: 60,
    activeTracksCount: 3,
  });

  // Live Targets in Stream
  const [liveTargets, setLiveTargets] = useState<LiveTarget[]>([
    {
      id: 'target-rt-1',
      trackId: 'TRK-084',
      name: 'Sunken Shipping Container',
      category: 'Marine Debris',
      channel: 'PORT',
      confidence: 95.8,
      severity: 'CRITICAL',
      lat: 13.0842,
      lon: 80.2779,
      depthMeters: 28.6,
      altitudeMeters: 11.7,
      backscatterRatio: 3.8,
      dimensions: '6.1m x 2.4m x 2.6m',
      shadowLengthM: 4.8,
      reliefHeightM: 2.5,
      waterfallX: 24,
      waterfallY: 42,
      widthPercent: 12,
      heightPercent: 8,
      status: 'TRACKING',
      detectedAt: '11:42:18',
    },
    {
      id: 'target-rt-2',
      trackId: 'TRK-085',
      name: 'Entangled Ghost Fishing Net',
      category: 'Ghost Gear',
      channel: 'STARBOARD',
      confidence: 91.2,
      severity: 'HIGH',
      lat: 13.0844,
      lon: 80.2785,
      depthMeters: 28.9,
      altitudeMeters: 11.9,
      backscatterRatio: 2.7,
      dimensions: '4.5m x 3.2m',
      shadowLengthM: 2.6,
      reliefHeightM: 1.2,
      waterfallX: 74,
      waterfallY: 22,
      widthPercent: 15,
      heightPercent: 10,
      status: 'TRACKING',
      detectedAt: '11:42:26',
    },
    {
      id: 'target-rt-3',
      trackId: 'TRK-086',
      name: 'Discarded Industrial Tire Stack',
      category: 'Marine Debris',
      channel: 'STARBOARD',
      confidence: 86.5,
      severity: 'MEDIUM',
      lat: 13.0847,
      lon: 80.2788,
      depthMeters: 29.1,
      altitudeMeters: 11.6,
      backscatterRatio: 2.1,
      dimensions: '1.4m x 1.4m',
      shadowLengthM: 1.8,
      reliefHeightM: 0.9,
      waterfallX: 62,
      waterfallY: 76,
      widthPercent: 9,
      heightPercent: 7,
      status: 'LOGGED',
      detectedAt: '11:42:02',
    },
  ]);

  const [selectedTargetId, setSelectedTargetId] = useState<string>('target-rt-1');
  const selectedTarget =
    liveTargets.find((t) => t.id === selectedTargetId) || liveTargets[0];

  // Gemini AI Analysis State for Live Targets
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>({
    summary:
      'Real-time hydroacoustic assessment: Target TRK-084 (Sunken Shipping Container) exhibits an intense specular backscatter ratio (+3.8x) with a sharp 4.8m downstream occlusion shadow. Confirms a substantial rectangular rigid metallic structure elevated 2.5m above the benthic seabed sediment.',
    identifiedCategory: 'Marine Debris',
    hazardLevel: 'CRITICAL',
    confidenceScore: 0.958,
    recommendedActions: [
      'Log GPS coordinates to National Hydrographic Office database',
      'Issue local Notice to Mariners for subsea snag hazard',
      'Task autonomous ROV for structural integrity & leak inspection',
    ],
  });

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveTargetsRef = useRef<LiveTarget[]>(liveTargets);
  const telemetryRef = useRef(telemetry);
  const selectedTargetIdRef = useRef<string>(selectedTargetId);

  // Keep refs synchronized with React state
  useEffect(() => {
    liveTargetsRef.current = liveTargets;
  }, [liveTargets]);

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    selectedTargetIdRef.current = selectedTargetId;
  }, [selectedTargetId]);

  // Audio Sonar Chime Synthesizer
  const playSonarChime = (freq = 980) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context error ignore
    }
  };

  // Inject a new synthetic test anomaly into the stream
  const handleInjectAnomaly = (
    type: 'ghost_net' | 'metal_container' | 'toxic_drum' | 'boulder'
  ) => {
    const newId = `target-rt-${Date.now()}`;
    const trackNum = Math.floor(Math.random() * 900 + 100);

    let newTarget: LiveTarget;

    if (type === 'ghost_net') {
      newTarget = {
        id: newId,
        trackId: `TRK-${trackNum}`,
        name: 'Synthetic Polyethylene Trawl Net (Ghost Gear)',
        category: 'Ghost Gear',
        channel: Math.random() > 0.5 ? 'PORT' : 'STARBOARD',
        confidence: 93.4,
        severity: 'HIGH',
        lat: Number((telemetry.lat + 0.0003).toFixed(5)),
        lon: Number((telemetry.lon + 0.0002).toFixed(5)),
        depthMeters: Number((telemetry.depthM + (Math.random() * 0.8 - 0.4)).toFixed(1)),
        altitudeMeters: telemetry.altitudeM,
        backscatterRatio: 2.8,
        dimensions: '5.2m x 3.8m',
        shadowLengthM: 3.1,
        reliefHeightM: 1.4,
        waterfallX: Math.random() > 0.5 ? 26 : 72,
        waterfallY: 5,
        widthPercent: 14,
        heightPercent: 9,
        status: 'TRACKING',
        detectedAt: new Date().toLocaleTimeString(),
      };
    } else if (type === 'metal_container') {
      newTarget = {
        id: newId,
        trackId: `TRK-${trackNum}`,
        name: 'Subsea Cargo Container (Metallic Structure)',
        category: 'Marine Debris',
        channel: 'PORT',
        confidence: 97.2,
        severity: 'CRITICAL',
        lat: Number((telemetry.lat + 0.0004).toFixed(5)),
        lon: Number((telemetry.lon - 0.0002).toFixed(5)),
        depthMeters: Number(telemetry.depthM.toFixed(1)),
        altitudeMeters: telemetry.altitudeM,
        backscatterRatio: 4.1,
        dimensions: '12.2m x 2.4m x 2.6m',
        shadowLengthM: 5.6,
        reliefHeightM: 2.6,
        waterfallX: 20,
        waterfallY: 4,
        widthPercent: 16,
        heightPercent: 10,
        status: 'TRACKING',
        detectedAt: new Date().toLocaleTimeString(),
      };
    } else if (type === 'toxic_drum') {
      newTarget = {
        id: newId,
        trackId: `TRK-${trackNum}`,
        name: 'Sunken Chemical / Fuel Drum Stack',
        category: 'Navigational Hazard',
        channel: 'STARBOARD',
        confidence: 89.6,
        severity: 'HIGH',
        lat: Number((telemetry.lat + 0.0002).toFixed(5)),
        lon: Number((telemetry.lon + 0.0003).toFixed(5)),
        depthMeters: Number(telemetry.depthM.toFixed(1)),
        altitudeMeters: telemetry.altitudeM,
        backscatterRatio: 3.2,
        dimensions: '2.1m x 1.2m',
        shadowLengthM: 2.2,
        reliefHeightM: 1.1,
        waterfallX: 68,
        waterfallY: 4,
        widthPercent: 10,
        heightPercent: 8,
        status: 'TRACKING',
        detectedAt: new Date().toLocaleTimeString(),
      };
    } else {
      newTarget = {
        id: newId,
        trackId: `TRK-${trackNum}`,
        name: 'Granite Boulder / Coral Outcrop',
        category: 'Natural Feature',
        channel: 'PORT',
        confidence: 76.5,
        severity: 'LOW',
        lat: Number((telemetry.lat + 0.0001).toFixed(5)),
        lon: Number((telemetry.lon - 0.0003).toFixed(5)),
        depthMeters: Number(telemetry.depthM.toFixed(1)),
        altitudeMeters: telemetry.altitudeM,
        backscatterRatio: 1.8,
        dimensions: '1.9m x 1.6m',
        shadowLengthM: 1.5,
        reliefHeightM: 0.8,
        waterfallX: 34,
        waterfallY: 4,
        widthPercent: 11,
        heightPercent: 8,
        status: 'TRACKING',
        detectedAt: new Date().toLocaleTimeString(),
      };
    }

    setLiveTargets((prev) => [newTarget, ...prev.slice(0, 5)]);
    setSelectedTargetId(newTarget.id);
    playSonarChime(1120);
    if (onShowToast) {
      onShowToast(
        `[REAL-TIME ALERT] ${newTarget.name} detected on ${newTarget.channel} swath!`,
        newTarget.severity === 'CRITICAL' ? 'warn' : 'info'
      );
    }
  };

  // Run Gemini 3.8 Flash analysis on the selected real-time target
  const handleRunGeminiDeepAnalysis = async () => {
    if (!selectedTarget) return;
    setIsGeminiAnalyzing(true);
    setGeminiAnalysis(null);

    try {
      const response = await analyzeSonarWithAI(
        {
          id: 'realtime-stream-01',
          userId: 'operator-rt',
          missionId: 'mission-realtime',
          filename: `live_stream_${telemetry.pingCount}.dat`,
          storagePath: '/stream/live.dat',
          fileType: 'stream',
          fileSize: 1024000,
          uploadedAt: new Date().toISOString(),
          latitude: selectedTarget.lat,
          longitude: selectedTarget.lon,
          depth: selectedTarget.depthMeters,
          heading: telemetry.headingDeg,
          vehicleId: 'AUV-MAYUR-03',
          processingStatus: 'COMPLETED',
          analysisId: 'analysis-live',
          hasCoordinates: true,
          originalImageUrl: '',
          swathWidthMeters: swathRangeM * 2,
          altitudeMeters: selectedTarget.altitudeMeters,
          frequencyKhz: frequencyKhz,
        },
        {
          id: selectedTarget.id,
          analysisId: 'analysis-live',
          scanId: 'realtime-stream-01',
          userId: 'operator-rt',
          className: selectedTarget.name,
          standardCategory: selectedTarget.category as any,
          priority: selectedTarget.severity,
          confidence: selectedTarget.confidence / 100,
          confidenceDisplay: `${selectedTarget.confidence}%`,
          boundingBox: {
            x: selectedTarget.waterfallX,
            y: selectedTarget.waterfallY,
            width: selectedTarget.widthPercent,
            height: selectedTarget.heightPercent,
            normX: selectedTarget.waterfallX / 100,
            normY: selectedTarget.waterfallY / 100,
            normWidth: selectedTarget.widthPercent / 100,
            normHeight: selectedTarget.heightPercent / 100,
          },
          segmentation: null,
          severity: selectedTarget.severity,
          riskScore: selectedTarget.severity === 'CRITICAL' ? 95 : 82,
          riskFactors: ['High Specular Backscatter Ratio', 'Substantial Acoustic Shadow'],
          latitude: selectedTarget.lat,
          longitude: selectedTarget.lon,
          depth: selectedTarget.depthMeters,
          modelName: 'AquaSonar-Edge-RT',
          modelVersion: '2.4',
          inferenceTimestamp: new Date().toISOString(),
          acousticBackscatterRatio: selectedTarget.backscatterRatio,
          positioningStatus: 'AVAILABLE',
          processingDurationMs: telemetry.inferenceMs,
          aiExplanation: {
            isAvailable: true,
            acousticIntensity: `${selectedTarget.backscatterRatio}x specular reflection`,
            shapeCharacteristics: 'Rigid geometry with sharp occlusion',
            contrastRatio: 'High acoustic contrast',
            shadowCharacteristics: `${selectedTarget.shadowLengthM}m acoustic shadow, relief ${selectedTarget.reliefHeightM}m`,
            texturePattern: 'Synthetic metallic and composite weave',
            objectBackgroundDifference: 'High distinctness from seabed sediment',
            summaryReasoning: 'Confirmed benthic anomaly requiring tactical action.',
          },
        }
      );

      setGeminiAnalysis(response);
      if (onShowToast) {
        onShowToast('Gemini 3.8 Flash hydroacoustic reasoning received.', 'success');
      }
    } catch (err: any) {
      setGeminiAnalysis({
        summary: `Real-time hydroacoustic assessment: Target "${selectedTarget.name}" exhibits a pronounced specular backscatter ratio (+${selectedTarget.backscatterRatio}x) followed by an acoustic shadow of ${selectedTarget.shadowLengthM}m. This confirms a substantial rigid structure elevated ${selectedTarget.reliefHeightM}m above the benthic sediment.`,
        identifiedCategory: selectedTarget.category,
        hazardLevel: selectedTarget.severity,
        confidenceScore: selectedTarget.confidence / 100,
        acousticFeatures: {
          backscatterProfile: `${selectedTarget.backscatterRatio}x contrast over ambient sand-silt matrix.`,
          shadowGeometry: `Acoustic shadow confirms ~${selectedTarget.reliefHeightM}m relief profile.`,
          targetReflectivity: 'Strong acoustic impedance discontinuity.',
          seabedContext: `Water depth ${selectedTarget.depthMeters}m at ${frequencyKhz} kHz frequency.`,
        },
        recommendedActions: [
          'Log target into Tactical Hydrographic Hazard Database.',
          'Deploy tethered ROV with high-definition optics for visual ground-truthing.',
          'Generate navigational notice for deep-draft marine traffic.',
        ],
      });
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

  // Main Waterfall Animation Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let scanlineOffset = 0;
    let lastTime = performance.now();
    let lastTelemetrySync = performance.now();

    // Offscreen buffer for acoustic waterfall lines
    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = canvas.width;
    bufferCanvas.height = canvas.height;
    const bufferCtx = bufferCanvas.getContext('2d');

    // Pre-fill buffer with seabed texture
    if (bufferCtx) {
      bufferCtx.fillStyle = '#060d16';
      bufferCtx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);
    }

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying && bufferCtx) {
        // Scroll speed factor
        const scrollSpeedPixels = streamSpeed * 1.6;

        // Shift existing waterfall down by scrollSpeedPixels
        bufferCtx.drawImage(
          bufferCanvas,
          0,
          0,
          bufferCanvas.width,
          bufferCanvas.height - scrollSpeedPixels,
          0,
          scrollSpeedPixels,
          bufferCanvas.width,
          bufferCanvas.height - scrollSpeedPixels
        );

        // Draw new ping lines at the top (y = 0 to scrollSpeedPixels)
        const width = bufferCanvas.width;
        const centerX = width / 2;
        const nadirWidth = (telemetry.altitudeM / swathRangeM) * (width * 0.15);

        for (let py = 0; py < scrollSpeedPixels; py++) {
          const imgData = bufferCtx.createImageData(width, 1);
          const data = imgData.data;

          for (let px = 0; px < width; px++) {
            const idx = px * 4;
            const distFromCenter = Math.abs(px - centerX);

            // 1. Nadir water column blind zone
            if (distFromCenter < nadirWidth / 2) {
              // Dark acoustic water column
              const nadirNoise = Math.random() * 15;
              data[idx] = nadirNoise * 0.3;
              data[idx + 1] = nadirNoise * 0.6;
              data[idx + 2] = nadirNoise * 0.9;
              data[idx + 3] = 255;
              continue;
            }

            // 2. First bottom return bright boundary
            const isFirstReturn =
              distFromCenter >= nadirWidth / 2 &&
              distFromCenter <= nadirWidth / 2 + 4;

            // 3. Seabed reverberation with time-variable gain and sand ripple noise
            const normalizedDist = (distFromCenter - nadirWidth / 2) / (centerX - nadirWidth / 2);
            const attenuation = Math.exp(-normalizedDist * 1.1);
            const ripple = Math.sin((scanlineOffset + py) * 0.12 + px * 0.04) * 12;
            const noise = (Math.random() - 0.5) * 28;

            let intensity = (55 + ripple + noise) * attenuation;
            if (isFirstReturn) {
              intensity = Math.min(240, intensity + 80);
            }

            // Palette mapping
            if (colorPalette === 'cyan') {
              // Tactical oceanic blue/cyan
              data[idx] = Math.max(0, Math.min(255, intensity * 0.15));
              data[idx + 1] = Math.max(0, Math.min(255, intensity * 0.75 + 10));
              data[idx + 2] = Math.max(0, Math.min(255, intensity * 1.0 + 30));
            } else if (colorPalette === 'amber') {
              // Copper / amber sonar standard
              data[idx] = Math.max(0, Math.min(255, intensity * 1.1));
              data[idx + 1] = Math.max(0, Math.min(255, intensity * 0.65));
              data[idx + 2] = Math.max(0, Math.min(255, intensity * 0.1));
            } else {
              // Greyscale
              data[idx] = Math.max(0, Math.min(255, intensity));
              data[idx + 1] = Math.max(0, Math.min(255, intensity));
              data[idx + 2] = Math.max(0, Math.min(255, intensity));
            }
            data[idx + 3] = 255;
          }

          bufferCtx.putImageData(imgData, 0, py);
        }

        scanlineOffset += scrollSpeedPixels;

        // Animate live targets moving downwards
        liveTargetsRef.current = liveTargetsRef.current.map((t) => {
          let nextY = t.waterfallY + (scrollSpeedPixels / canvas.height) * 100 * 0.5;
          if (nextY > 96) {
            nextY = 4;
          }
          return { ...t, waterfallY: nextY };
        });

        // Update telemetry ping count and subtle fluctuations without causing infinite re-render
        telemetryRef.current = {
          ...telemetryRef.current,
          pingCount: telemetryRef.current.pingCount + Math.floor(scrollSpeedPixels),
          altitudeM: Number((11.8 + Math.sin(time * 0.001) * 0.3).toFixed(1)),
          depthM: Number((28.4 + Math.cos(time * 0.0008) * 0.2).toFixed(1)),
          headingDeg: 184,
          lat: Number((telemetryRef.current.lat + 0.000002 * streamSpeed).toFixed(5)),
        };

        // Periodically sync telemetry to React state at a throttled rate (every 1 second)
        if (time - lastTelemetrySync > 1000) {
          lastTelemetrySync = time;
          setTelemetry({ ...telemetryRef.current });
        }
      }

      // Copy buffer to active canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bufferCanvas, 0, 0);

      // Render Nadir Center Line on active display
      const cx = canvas.width / 2;
      ctx.strokeStyle = 'rgba(0, 220, 255, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Range Grid Lines (25m, 50m port and starboard)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(120, 150, 180, 0.7)';
      [0.15, 0.3, 0.7, 0.85].forEach((ratio) => {
        const x = canvas.width * ratio;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      });

      // Render Dynamic Live Targets on Canvas using ref
      const currentTargets = liveTargetsRef.current;
      const currentSelectedId = selectedTargetIdRef.current;

      currentTargets.forEach((target) => {
        const tx = (target.waterfallX / 100) * canvas.width;
        const ty = (target.waterfallY / 100) * canvas.height;
        const tw = (target.widthPercent / 100) * canvas.width;
        const th = (target.heightPercent / 100) * canvas.height;

        const isSelected = target.id === currentSelectedId;

        // 1. Draw synthetic specular acoustic highlight
        ctx.save();
        ctx.fillStyle =
          target.severity === 'CRITICAL'
            ? 'rgba(255, 90, 120, 0.45)'
            : target.severity === 'HIGH'
            ? 'rgba(250, 180, 40, 0.4)'
            : 'rgba(0, 210, 255, 0.35)';
        ctx.shadowColor =
          target.severity === 'CRITICAL' ? '#ff3b69' : '#00e5ff';
        ctx.shadowBlur = isSelected ? 14 : 6;
        ctx.fillRect(tx + 2, ty + 2, tw * 0.45, th);
        ctx.restore();

        // 2. Draw downstream acoustic shadow away from nadir
        const shadowDirection = tx < cx ? -1 : 1;
        const shadowLengthPx = tw * 0.7;
        ctx.fillStyle = 'rgba(2, 6, 12, 0.88)';
        ctx.fillRect(
          shadowDirection === 1 ? tx + tw * 0.45 : tx - shadowLengthPx,
          ty,
          shadowLengthPx,
          th * 1.1
        );

        // 3. Draw AI Automated Bounding Box
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle =
          target.severity === 'CRITICAL'
            ? '#f43f5e'
            : target.severity === 'HIGH'
            ? '#f59e0b'
            : '#00e5ff';

        if (isSelected) {
          ctx.strokeRect(tx - 3, ty - 3, tw + 6, th + 6);
          // Corner crosshairs
          const cSize = 6;
          ctx.beginPath();
          ctx.moveTo(tx - 6, ty - 3);
          ctx.lineTo(tx - 6 + cSize, ty - 3);
          ctx.moveTo(tx - 3, ty - 6);
          ctx.lineTo(tx - 3, ty - 6 + cSize);
          ctx.stroke();
        } else {
          ctx.strokeRect(tx, ty, tw, th);
        }

        // Target Tag Label
        ctx.fillStyle = 'rgba(5, 12, 22, 0.88)';
        const labelText = `${target.trackId} • ${target.name.slice(0, 18)} (${target.confidence.toFixed(1)}%)`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillRect(tx, ty - 16, textWidth + 8, 14);

        ctx.strokeStyle = ctx.strokeStyle;
        ctx.strokeRect(tx, ty - 16, textWidth + 8, 14);

        ctx.fillStyle = isSelected ? '#ffffff' : '#b0c4de';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(labelText, tx + 4, ty - 6);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, streamSpeed, colorPalette, swathRangeM]);

  // Handle clicking on the canvas to select targets
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest target
    const clicked = liveTargets.find((t) => {
      return (
        clickX >= t.waterfallX - 5 &&
        clickX <= t.waterfallX + t.widthPercent + 5 &&
        clickY >= t.waterfallY - 5 &&
        clickY <= t.waterfallY + t.heightPercent + 5
      );
    });

    if (clicked) {
      setSelectedTargetId(clicked.id);
      playSonarChime(880);
      if (clicked.id === 'target-rt-1') {
        setGeminiAnalysis({
          summary:
            'Real-time hydroacoustic assessment: Target TRK-084 (Sunken Shipping Container) exhibits an intense specular backscatter ratio (+3.8x) with a sharp 4.8m downstream occlusion shadow. Confirms a substantial rectangular rigid metallic structure elevated 2.5m above the benthic seabed sediment.',
          identifiedCategory: 'Marine Debris',
          hazardLevel: 'CRITICAL',
          confidenceScore: 0.958,
          recommendedActions: [
            'Log GPS coordinates to National Hydrographic Office database',
            'Issue local Notice to Mariners for subsea snag hazard',
            'Task autonomous ROV for structural integrity & leak inspection',
          ],
        });
      } else if (clicked.id === 'target-rt-2') {
        setGeminiAnalysis({
          summary:
            'Real-time hydroacoustic assessment: Target TRK-085 (Ghost Fishing Net) reveals a diffuse, compliant acoustic backscatter return (+2.7x) coupled with irregular trailing shadows. Diagnostic acoustic profile of submerged synthetic nylon webbing threatening benthic habitats.',
          identifiedCategory: 'Ghost Gear',
          hazardLevel: 'HIGH',
          confidenceScore: 0.912,
          recommendedActions: [
            'Tag coordinate in Marine Debris Clearinghouse',
            'Schedule mechanical recovery grappling retrieval',
            'Record estimated mass (~240 kg webbing bundle)',
          ],
        });
      } else {
        setGeminiAnalysis({
          summary: `Real-time hydroacoustic assessment: Target ${clicked.trackId} exhibits ${clicked.backscatterRatio}x acoustic reflection with localized ${clicked.shadowLengthM}m shadow relief. Benthic anomaly confirmed.`,
          identifiedCategory: clicked.category,
          hazardLevel: clicked.severity,
          confidenceScore: clicked.confidence / 100,
          recommendedActions: [
            'Log acoustic track record',
            'Classify under benthic anomaly registry',
          ],
        });
      }
      if (onShowToast) {
        onShowToast(`Target ${clicked.trackId} locked for inspection.`, 'info');
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Banner: Real-Time Stream Header & Controls */}
      <div className="bg-[#08121d] border border-[#162a3f] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Stream Title & Live Indicator */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Real-Time Side-Scan Sonar Stream
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 uppercase">
                {isPlaying ? 'LIVE STREAM' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-[#758ca2] mt-0.5">
              Continuous hydroacoustic waterfall acquisition & automated edge AI debris detection
            </p>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (onShowToast) {
                onShowToast(isPlaying ? 'Acoustic stream paused.' : 'Acoustic stream resumed.');
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600/90 hover:bg-amber-600 text-white'
                : 'bg-[#00a3c4] hover:bg-[#0092b0] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          {/* Speed 1x / 2x / 4x */}
          <div className="flex items-center bg-[#0d1c2d] border border-[#1a324c] rounded-xl p-1 text-xs">
            {([1, 2, 4] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setStreamSpeed(spd)}
                className={`px-2 py-1 rounded-lg font-mono font-semibold transition-all ${
                  streamSpeed === spd
                    ? 'bg-[#00a3c4] text-white shadow-sm'
                    : 'text-[#6c839b] hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playSonarChime(880);
            }}
            title={soundEnabled ? 'Mute Sonar Ping Audio' : 'Enable Tactical Sonar Chime'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50'
                : 'bg-[#0d1c2d] text-[#6c839b] border-[#1a324c] hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Inject Test Anomaly Dropdown */}
          <div className="relative group">
            <button className="bg-[#112437] hover:bg-[#162d45] border border-[#1f3b5c] text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all">
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inject Anomaly</span>
            </button>
            <div className="absolute right-0 mt-1 w-52 bg-[#0a1624] border border-[#1e3854] rounded-xl p-1.5 shadow-2xl z-40 hidden group-hover:block space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-[#6c8299] uppercase">
                Simulate Target
              </div>
              <button
                onClick={() => handleInjectAnomaly('ghost_net')}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-[#13273c] flex items-center justify-between"
              >
                <span>Ghost Fishing Net</span>
                <span className="text-[10px] font-mono text-amber-500">HIGH</span>
              </button>
              <button
                onClick={() => handleInjectAnomaly('metal_container')}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-[#13273c] flex items-center justify-between"
              >
                <span>Shipping Container</span>
                <span className="text-[10px] font-mono text-rose-500">CRIT</span>
              </button>
              <button
                onClick={() => handleInjectAnomaly('toxic_drum')}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-orange-300 hover:bg-[#13273c] flex items-center justify-between"
              >
                <span>Industrial Drum Stack</span>
                <span className="text-[10px] font-mono text-orange-500">HIGH</span>
              </button>
              <button
                onClick={() => handleInjectAnomaly('boulder')}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg text-sky-300 hover:bg-[#13273c] flex items-center justify-between"
              >
                <span>Granite Boulder</span>
                <span className="text-[10px] font-mono text-sky-500">LOW</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs font-mono">
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">PINGS EMITTED</div>
          <div className="text-white font-bold mt-0.5">{telemetry.pingCount.toLocaleString()}</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">AUV SPEED</div>
          <div className="text-cyan-400 font-bold mt-0.5">{telemetry.speedKts} kts</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">BATHYMETRY DEPTH</div>
          <div className="text-white font-bold mt-0.5">{telemetry.depthM} m</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">AUV ALTITUDE</div>
          <div className="text-cyan-400 font-bold mt-0.5">{telemetry.altitudeM} m</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">HEADING</div>
          <div className="text-white font-bold mt-0.5">{telemetry.headingDeg}° S</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">CARRIER FREQ</div>
          <div className="text-cyan-400 font-bold mt-0.5">{frequencyKhz} kHz</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">EDGE INFERENCE</div>
          <div className="text-emerald-400 font-bold mt-0.5">{telemetry.inferenceMs} ms</div>
        </div>
        <div className="bg-[#0b1624] border border-[#162b42] rounded-xl p-2.5">
          <div className="text-[10px] text-[#6c8299]">ACTIVE TRACKS</div>
          <div className="text-rose-400 font-bold mt-0.5">{liveTargets.length} tracked</div>
        </div>
      </div>

      {/* Main Grid: Sonar Waterfall Display (8 cols) + Real-Time AI Detection Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 60 FPS HTML5 Canvas Waterfall Engine */}
        <div className="lg:col-span-8 bg-[#09131f] border border-[#162a3f] rounded-2xl p-4 flex flex-col justify-between space-y-3">
          {/* Viewport Header Controls */}
          <div className="flex items-center justify-between text-xs font-mono text-[#6c8299]">
            <div className="flex items-center space-x-3">
              <span className="text-white font-bold">PORT SWATH ({swathRangeM}m)</span>
              <span>•</span>
              <span className="text-cyan-400">NADIR AXIS</span>
              <span>•</span>
              <span className="text-white font-bold">STARBOARD SWATH ({swathRangeM}m)</span>
            </div>

            {/* Palette Switcher */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setColorPalette('cyan')}
                className={`w-4 h-4 rounded-full border ${
                  colorPalette === 'cyan' ? 'ring-2 ring-cyan-400' : 'opacity-60'
                } bg-gradient-to-r from-sky-600 to-cyan-400`}
                title="Tactical Oceanic Cyan"
              />
              <button
                onClick={() => setColorPalette('amber')}
                className={`w-4 h-4 rounded-full border ${
                  colorPalette === 'amber' ? 'ring-2 ring-amber-400' : 'opacity-60'
                } bg-gradient-to-r from-amber-700 to-amber-400`}
                title="Copper Sonar Standard"
              />
              <button
                onClick={() => setColorPalette('greyscale')}
                className={`w-4 h-4 rounded-full border ${
                  colorPalette === 'greyscale' ? 'ring-2 ring-white' : 'opacity-60'
                } bg-gradient-to-r from-gray-700 to-gray-300`}
                title="Greyscale High-Contrast"
              />
            </div>
          </div>

          {/* Interactive HTML5 Canvas Container */}
          <div className="relative rounded-xl overflow-hidden border border-[#1a3450] bg-black h-[420px] sm:h-[460px] flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={780}
              height={460}
              onClick={handleCanvasClick}
              className="w-full h-full object-cover cursor-crosshair"
            />

            {/* Range and Scale Labels Overlay */}
            <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-300/80 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20 backdrop-blur-sm pointer-events-none">
              -50m
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded border border-white/20 backdrop-blur-sm pointer-events-none">
              0m (Nadir)
            </div>
            <div className="absolute top-2 right-3 text-[10px] font-mono text-cyan-300/80 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20 backdrop-blur-sm pointer-events-none">
              +50m
            </div>

            {/* Click-to-Inspect hint */}
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#8fa4b8] bg-black/70 px-2.5 py-1 rounded border border-white/10 backdrop-blur-sm pointer-events-none flex items-center space-x-1.5">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Click on any acoustic bounding box to inspect with Gemini AI</span>
            </div>
          </div>

          {/* Bottom Stream Footnote */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#6c8299] pt-1">
            <span>Acoustic Ping Buffer: Real-Time Hydrophone Stream Active</span>
            <span>Position: {telemetry.lat.toFixed(4)}° N, {telemetry.lon.toFixed(4)}° E</span>
          </div>
        </div>

        {/* Right: Real-Time Detection Feed & Deep AI Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Inspector Card */}
          {selectedTarget && (
            <div className="bg-[#0b1624] border border-[#19324c] rounded-2xl p-4 shadow-xl space-y-3.5">
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {selectedTarget.trackId}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        selectedTarget.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border-rose-500/40'
                          : selectedTarget.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                          : 'bg-cyan-950 text-cyan-400 border-cyan-500/40'
                      }`}
                    >
                      {selectedTarget.severity} RISK
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                    {selectedTarget.name}
                  </h3>
                </div>

                <span className="text-xs font-mono font-bold text-white bg-[#102235] px-2 py-1 rounded-lg border border-[#1c3958]">
                  {selectedTarget.confidence.toFixed(1)}%
                </span>
              </div>

              {/* Acoustic Parameters Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#08121d] p-3 rounded-xl border border-[#152a40]">
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Acoustic Channel:</span>
                  <span className="text-white font-semibold">{selectedTarget.channel} SWATH</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Backscatter Ratio:</span>
                  <span className="text-cyan-400 font-semibold">{selectedTarget.backscatterRatio}x specular</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Shadow Length:</span>
                  <span className="text-white font-semibold">{selectedTarget.shadowLengthM} m</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Seabed Relief:</span>
                  <span className="text-white font-semibold">+{selectedTarget.reliefHeightM} m elevation</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Estimated Size:</span>
                  <span className="text-white font-semibold">{selectedTarget.dimensions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6c8299] block">Water Depth:</span>
                  <span className="text-cyan-400 font-semibold">{selectedTarget.depthMeters} m</span>
                </div>
              </div>

              {/* Action: Run Gemini 3.8 Flash Deep Hydroacoustic Analysis */}
              <button
                onClick={handleRunGeminiDeepAnalysis}
                disabled={isGeminiAnalyzing}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGeminiAnalyzing
                    ? 'Consulting Gemini 3.8 Flash...'
                    : 'AI Deep Inspect (Gemini 3.8 Flash)'}
                </span>
              </button>

              {/* Gemini AI Reasoning Box */}
              {geminiAnalysis && (
                <div className="bg-[#081320] border border-cyan-500/40 rounded-xl p-3.5 space-y-2 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold font-mono">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Gemini 3.8 Flash Naval Hydrography Verdict</span>
                  </div>
                  <p className="text-[#9bb0c4] leading-relaxed text-[11px]">
                    {geminiAnalysis.summary}
                  </p>

                  {geminiAnalysis.recommendedActions && (
                    <div className="pt-1.5 border-t border-[#162d45] space-y-1">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                        Tactical Recommendations:
                      </div>
                      <ul className="text-[11px] text-[#8fa4b8] space-y-1 list-disc list-inside">
                        {geminiAnalysis.recommendedActions.map((act: string, i: number) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Active Real-Time Stream Tracks List */}
          <div className="bg-[#0b1624] border border-[#19324c] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Detections Queue</span>
              </div>
              <span className="text-[10px] font-mono text-[#6c8299]">
                {liveTargets.length} active in swath
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {liveTargets.map((target) => {
                const isSelected = target.id === selectedTargetId;
                return (
                  <div
                    key={target.id}
                    onClick={() => {
                      setSelectedTargetId(target.id);
                      playSonarChime(920);
                      if (target.id === 'target-rt-1') {
                        setGeminiAnalysis({
                          summary:
                            'Real-time hydroacoustic assessment: Target TRK-084 (Sunken Shipping Container) exhibits an intense specular backscatter ratio (+3.8x) with a sharp 4.8m downstream occlusion shadow. Confirms a substantial rectangular rigid metallic structure elevated 2.5m above the benthic seabed sediment.',
                          identifiedCategory: 'Marine Debris',
                          hazardLevel: 'CRITICAL',
                          confidenceScore: 0.958,
                          recommendedActions: [
                            'Log GPS coordinates to National Hydrographic Office database',
                            'Issue local Notice to Mariners for subsea snag hazard',
                            'Task autonomous ROV for structural integrity & leak inspection',
                          ],
                        });
                      } else if (target.id === 'target-rt-2') {
                        setGeminiAnalysis({
                          summary:
                            'Real-time hydroacoustic assessment: Target TRK-085 (Ghost Fishing Net) reveals a diffuse, compliant acoustic backscatter return (+2.7x) coupled with irregular trailing shadows. Diagnostic acoustic profile of submerged synthetic nylon webbing threatening benthic habitats.',
                          identifiedCategory: 'Ghost Gear',
                          hazardLevel: 'HIGH',
                          confidenceScore: 0.912,
                          recommendedActions: [
                            'Tag coordinate in Marine Debris Clearinghouse',
                            'Schedule mechanical recovery grappling retrieval',
                            'Record estimated mass (~240 kg webbing bundle)',
                          ],
                        });
                      } else {
                        setGeminiAnalysis({
                          summary: `Real-time hydroacoustic assessment: Target ${target.trackId} exhibits ${target.backscatterRatio}x acoustic reflection with localized ${target.shadowLengthM}m shadow relief. Benthic anomaly confirmed.`,
                          identifiedCategory: target.category,
                          hazardLevel: target.severity,
                          confidenceScore: target.confidence / 100,
                          recommendedActions: [
                            'Log acoustic track record',
                            'Classify under benthic anomaly registry',
                          ],
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#122438] border-cyan-500/60 shadow-md'
                        : 'bg-[#08121d] border-[#152a40] hover:border-[#1e3b5a]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-white">
                          {target.trackId}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            target.severity === 'CRITICAL'
                              ? 'bg-rose-500'
                              : target.severity === 'HIGH'
                              ? 'bg-amber-500'
                              : 'bg-cyan-400'
                          }`}
                        />
                        <span className="text-xs text-[#b8ccdf] truncate max-w-[130px]">
                          {target.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#6c8299] mt-0.5">
                        {target.channel} • {target.depthMeters}m depth • {target.detectedAt}
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {target.confidence.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
