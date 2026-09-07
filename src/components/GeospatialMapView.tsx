import React, { useState } from 'react';
import {
  Map as MapIcon,
  Compass,
  MapPin,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { Detection, SonarScan } from '../types';
import { getTargetClassMeta } from '../data/mockData';

interface GeospatialMapViewProps {
  detections: Detection[];
  scans: SonarScan[];
  onSelectScan: (scanId: string) => void;
  onNavigate: (tab: string) => void;
}

export const GeospatialMapView: React.FC<GeospatialMapViewProps> = ({
  detections,
  scans,
  onSelectScan,
  onNavigate,
}) => {
  const georeferencedDets = detections.filter(
    (d) => d.latitude !== null && d.longitude !== null
  );
  const ungeoreferencedDets = detections.filter(
    (d) => d.latitude === null || d.longitude === null
  );

  const [activeWaypoint, setActiveWaypoint] = useState<Detection | null>(
    georeferencedDets[0] || null
  );

  // Map view controls
  const [zoom, setZoom] = useState(1);
  const [centerArea, setCenterArea] = useState<'GOA' | 'KUTCH'>('GOA');

  // Center points
  const baseLat = centerArea === 'GOA' ? 15.415 : 22.85;
  const baseLng = centerArea === 'GOA' ? 73.78 : 69.85;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                BATHYMETRIC GIS
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Hydrographic Geospatial & Hazard Positioning Map
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Georeferenced acoustic anomaly coordinates, navigational bathymetry contours, and survey tracklines.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCenterArea('GOA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                centerArea === 'GOA'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              GOA SURVEY REGION
            </button>
            <button
              onClick={() => setCenterArea('KUTCH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
                centerArea === 'KUTCH'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              GULF OF KUTCH
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Map canvas + Waypoint detail card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Map Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Header Map Toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-semibold">
                HYDROGRAPHIC SEABED CHART • {centerArea === 'GOA' ? 'MORMUGAO SECTOR' : 'KANDLA SECTOR'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))}
                className="p-1 hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2, z + 0.2))}
                className="p-1 hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoom(1)} className="p-1 hover:text-white">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Chart Area */}
          <div className="relative flex-1 min-h-[460px] bg-slate-950 overflow-hidden flex items-center justify-center p-4">
            {/* Nautical Grid Lines & Bathymetric Contours */}
            <div
              className="relative w-full h-[460px] bg-[#071322] rounded-lg border border-slate-800/80 overflow-hidden select-none transition-transform"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* Bathymetric depth contour curves */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="rgba(6, 182, 212, 0.08)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* 10m isobath */}
                <path
                  d="M 20 180 Q 200 120 400 240 T 800 200"
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x="50" y="165" fill="#0891b2" fontSize="9" fontFamily="monospace">
                  10m ISOBATH
                </text>

                {/* 20m isobath */}
                <path
                  d="M 20 280 Q 240 220 480 340 T 800 300"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />
                <text x="50" y="270" fill="#0284c7" fontSize="9" fontFamily="monospace">
                  20m ISOBATH
                </text>

                {/* 30m isobath */}
                <path
                  d="M 20 380 Q 280 320 540 420 T 800 390"
                  fill="none"
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
                <text x="50" y="370" fill="#1d4ed8" fontSize="9" fontFamily="monospace">
                  30m ISOBATH
                </text>

                {/* AUV Survey Track Line */}
                <path
                  d="M 120 320 L 360 210 L 620 160"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                />
              </svg>

              {/* Waypoint Markers */}
              {georeferencedDets.map((d, idx) => {
                const meta = getTargetClassMeta(d.className);
                const isSelected = activeWaypoint?.id === d.id;

                // Position projection simulation
                const latDiff = (d.latitude! - baseLat) * 8000;
                const lngDiff = (d.longitude! - baseLng) * 8000;
                const posX = Math.max(50, Math.min(680, 360 + lngDiff));
                const posY = Math.max(50, Math.min(400, 230 - latDiff));

                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveWaypoint(d)}
                    style={{ left: `${posX}px`, top: `${posY}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-4 ring-yellow-400/60 scale-125 shadow-lg'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: meta.colorHex }}
                    >
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700 z-30">
                      {d.className} ({d.riskScore} pts)
                    </div>
                  </div>
                );
              })}

              {/* Vessel Platform Marker */}
              <div
                style={{ left: '360px', top: '210px' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-950 font-mono">
                  ▲
                </div>
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 whitespace-nowrap">
                  AUV-MAYUR-03 (3.5 kn)
                </span>
              </div>
            </div>
          </div>

          {/* Footer Legend */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-400">
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Marine Debris</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Shipwreck / Anomaly</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>Rock / Boulder</span>
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400">
              {georeferencedDets.length} georeferenced anomaly waypoints
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Selected Waypoint Inspector & Ungeoreferenced List */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Waypoint Card */}
          {activeWaypoint ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
                    style={{
                      backgroundColor: `${getTargetClassMeta(activeWaypoint.className).colorHex}25`,
                      color: getTargetClassMeta(activeWaypoint.className).colorHex,
                    }}
                  >
                    {activeWaypoint.className}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    Anomaly Waypoint Fix
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400">
                    ID: {activeWaypoint.id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-orange-400">
                    {activeWaypoint.riskScore}
                  </div>
                  <div className="text-[10px] text-slate-500">Risk Score</div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="text-white font-semibold">
                    {activeWaypoint.latitude?.toFixed(5)}°N, {activeWaypoint.longitude?.toFixed(5)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Water Depth:</span>
                  <span className="text-cyan-400">{activeWaypoint.depth} meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Swath Ref:</span>
                  <span className="text-slate-300 truncate max-w-[140px]">
                    {activeWaypoint.scanId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Backscatter Ratio:</span>
                  <span className="text-emerald-400">
                    {activeWaypoint.acousticBackscatterRatio}x
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {activeWaypoint.aiExplanation?.summaryReasoning}
              </p>

              <button
                onClick={() => {
                  onSelectScan(activeWaypoint.scanId);
                  onNavigate('workspace');
                }}
                className="w-full bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-200 border border-slate-700 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Jump to Swath in Workspace</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
              Click any anomaly marker on the bathymetric chart to inspect coordinates.
            </div>
          )}

          {/* Ungeoreferenced Anomaly Drawer */}
          {ungeoreferencedDets.length > 0 && (
            <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Ungeoreferenced Anomalies ({ungeoreferencedDets.length})</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The following detections lack USBL/GPS coordinate telemetry and cannot be projected onto the nautical chart:
              </p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {ungeoreferencedDets.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-slate-300 text-[11px] truncate max-w-[160px]">
                      {u.className}
                    </span>
                    <button
                      onClick={() => {
                        onSelectScan(u.scanId);
                        onNavigate('workspace');
                      }}
                      className="text-[10px] font-mono text-cyan-400 hover:underline"
                    >
                      Calibrate &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
