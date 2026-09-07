import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ShieldAlert,
  Compass,
  Waves,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Detection } from '../types';
import { getTargetClassMeta } from '../data/mockData';

interface LiveSonarViewProps {
  onSaveLiveDetection?: (det: Detection) => void;
}

export const LiveSonarView: React.FC<LiveSonarViewProps> = () => {
  const [isRunning, setIsRunning] = useState(true);
  const [pingCount, setPingCount] = useState(1450);
  const [vesselSpeedKnots, setVesselSpeedKnots] = useState(3.5);
  const [pingRateHz, setPingRateHz] = useState(15);
  const [autoDetect, setAutoDetect] = useState(true);

  // Live telemetry
  const [currentDepth, setCurrentDepth] = useState(18.4);
  const [currentAltitude, setCurrentAltitude] = useState(11.8);
  const [currentHeading, setCurrentHeading] = useState(274);
  const [recentDetections, setRecentDetections] = useState<
    Array<{
      id: string;
      time: string;
      className: string;
      channel: 'PORT' | 'STARBOARD';
      rangeM: number;
      riskScore: number;
    }>
  >([
    {
      id: 'live-ev-1',
      time: '12:04:12',
      className: 'Marine Debris',
      channel: 'STARBOARD',
      rangeM: 32.4,
      riskScore: 78,
    },
    {
      id: 'live-ev-2',
      time: '12:04:45',
      className: 'Rock / Boulder',
      channel: 'PORT',
      rangeM: 18.2,
      riskScore: 34,
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Waterfall rolling simulation
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setPingCount((p) => p + 1);
      setCurrentDepth((d) => Number((d + (Math.random() - 0.5) * 0.08).toFixed(1)));
      setCurrentAltitude((a) => Number((a + (Math.random() - 0.5) * 0.05).toFixed(1)));
      setCurrentHeading((h) => Math.round(h + (Math.random() - 0.5) * 0.4));

      // Draw scrolling waterfall on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;

          // Shift image down by 2 pixels
          ctx.drawImage(canvas, 0, 0, w, h - 2, 0, 2, w, h - 2);

          // Draw new top 2 scanlines
          const imgData = ctx.createImageData(w, 2);
          const data = imgData.data;
          const center = Math.floor(w / 2);
          const nadir = Math.floor(w * 0.07);

          // Random chance of anomaly highlight
          const hasAnomaly = Math.random() < 0.035;
          const anomalyChannel = Math.random() > 0.5 ? 'STARBOARD' : 'PORT';
          const anomalyOffset =
            anomalyChannel === 'STARBOARD'
              ? center + 100 + Math.floor(Math.random() * 80)
              : center - 100 - Math.floor(Math.random() * 80);

          for (let y = 0; y < 2; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              const dist = Math.abs(x - center);
              let lum = 0;

              if (dist < nadir) {
                lum = 12 + Math.random() * 6;
              } else {
                const base = 115 - (dist / (w / 2)) * 40;
                const ripple = Math.sin(x * 0.05 + pingCount * 0.1) * 7;
                lum = Math.max(15, Math.min(230, Math.round(base + ripple + (Math.random() - 0.5) * 20)));

                // Anomaly specular return
                if (hasAnomaly && Math.abs(x - anomalyOffset) < 8) {
                  lum = 250;
                }
              }

              // Amber phosphor
              data[idx] = lum;
              data[idx + 1] = Math.round(lum * 0.85);
              data[idx + 2] = Math.round(lum * 0.55);
              data[idx + 3] = 255;
            }
          }

          ctx.putImageData(imgData, 0, 0);

          if (hasAnomaly && autoDetect) {
            const rangeM = Number((Math.abs(anomalyOffset - center) * 0.2).toFixed(1));
            const isDebris = Math.random() > 0.4;
            const newEv = {
              id: `live-ev-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              className: isDebris ? 'Marine Debris' : 'Rock / Boulder',
              channel: anomalyChannel as 'PORT' | 'STARBOARD',
              rangeM,
              riskScore: isDebris ? 74 + Math.floor(Math.random() * 16) : 30 + Math.floor(Math.random() * 15),
            };
            setRecentDetections((prev) => [newEv, ...prev.slice(0, 7)]);
          }
        }
      }
    }, 1000 / pingRateHz);

    return () => clearInterval(interval);
  }, [isRunning, pingRateHz, autoDetect]);

  // Initial canvas fill
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                HYDROACOUSTIC STREAM
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Live Sonar Detection & Hydrophone Waterfall Stream
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous continuous ping acquisition from AUV-MAYUR-03 with real-time acoustic threshold feature extraction.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>PAUSE STREAM</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>RESUME STREAM</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setPingCount(0);
                setRecentDetections([]);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-mono border border-slate-700 flex items-center space-x-1"
              title="Reset ping counter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Waterfall Canvas + Telemetry & Live Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Waterfall Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Header ruler */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono select-none">
            <span className="text-cyan-400">◄ PORT [CH-1] (50m)</span>
            <span className="text-slate-500">NADIR</span>
            <span className="text-cyan-400">(50m) STARBOARD [CH-2] ►</span>
          </div>

          <div className="relative bg-black flex items-center justify-center p-2 flex-1 min-h-[460px]">
            <canvas
              ref={canvasRef}
              width={720}
              height={460}
              className="w-full h-auto max-h-[500px] object-cover rounded border border-slate-800"
            />

            {/* Sweep line indicator */}
            <div className="absolute top-2 left-2 right-2 h-0.5 bg-cyan-400/80 pointer-events-none animate-pulse shadow-sm shadow-cyan-400" />
          </div>

          {/* Telemetry Footer */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
            <div className="flex items-center space-x-4">
              <span>
                PING: <strong className="text-white">#{pingCount}</strong>
              </span>
              <span>
                SPEED: <strong className="text-cyan-400">{vesselSpeedKnots} kn</strong>
              </span>
              <span>
                DEPTH: <strong className="text-cyan-400">{currentDepth} m</strong>
              </span>
              <span>
                ALT: <strong className="text-cyan-400">{currentAltitude} m</strong>
              </span>
              <span>
                HEADING: <strong className="text-white">{currentHeading}°</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-semibold">HYDROPHONE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Live Telemetry Controls & Anomaly Event Log */}
        <div className="lg:col-span-4 space-y-4">
          {/* Controls Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Telemetry & Acquisition Controls</span>
            </h3>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>Ping Rate (Hz):</span>
                <span className="text-cyan-400">{pingRateHz} pings/sec</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={pingRateHz}
                onChange={(e) => setPingRateHz(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                <span>AUV Speed (knots):</span>
                <span className="text-cyan-400">{vesselSpeedKnots} kn</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={vesselSpeedKnots}
                onChange={(e) => setVesselSpeedKnots(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <label className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors">
              <span className="text-xs font-medium text-slate-300">
                Real-Time Auto-Feature Extraction
              </span>
              <input
                type="checkbox"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          </div>

          {/* Live Anomaly Detection Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                <span>Live Anomaly Intercepts</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {recentDetections.length} INTERCEPTS
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentDetections.map((det) => {
                const meta = getTargetClassMeta(det.className);
                return (
                  <div
                    key={det.id}
                    className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: meta.colorHex }}
                        />
                        <span className="font-semibold text-white">{det.className}</span>
                      </div>
                      <span className="font-mono text-orange-400 font-bold">
                        Score: {det.riskScore}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>
                        {det.channel} SWATH • Range {det.rangeM}m
                      </span>
                      <span className="text-slate-500">{det.time}</span>
                    </div>
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
