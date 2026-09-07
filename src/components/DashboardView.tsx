import React from 'react';
import {
  Waves,
  CheckCircle2,
  AlertTriangle,
  Radio,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
  Compass,
  Crosshair,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SonarScan, Detection, Mission } from '../types';
import { TARGET_CLASSES, getTargetClassMeta } from '../data/mockData';

interface DashboardViewProps {
  scans: SonarScan[];
  detections: Detection[];
  missions: Mission[];
  onNavigate: (tab: string) => void;
  onSelectScan: (scanId: string) => void;
  onLoadSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  scans,
  detections,
  missions,
  onNavigate,
  onSelectScan,
  onLoadSampleData,
}) => {
  const totalScans = scans.length;
  const processedCount = scans.filter((s) => s.processingStatus === 'COMPLETED').length;
  const failedCount = scans.filter((s) => s.processingStatus === 'FAILED').length;
  const totalAnomalies = detections.length;

  const debrisCount = detections.filter(
    (d) => getTargetClassMeta(d.className).isMarineDebris || d.className.toLowerCase().includes('debris')
  ).length;

  const highRiskCount = detections.filter(
    (d) => (d.riskScore ?? 0) >= 60 || d.severity === 'HIGH' || d.severity === 'CRITICAL'
  ).length;

  const activeMissionsCount = missions.filter((m) => m.status === 'ACTIVE').length;

  // Class counts
  const classCounts: Record<string, number> = {};
  TARGET_CLASSES.forEach((c) => {
    classCounts[c.name] = 0;
  });
  detections.forEach((d) => {
    classCounts[d.className] = (classCounts[d.className] || 0) + 1;
  });

  // Severity counts
  const severityCounts = {
    CRITICAL: detections.filter((d) => d.severity === 'CRITICAL').length,
    HIGH: detections.filter((d) => d.severity === 'HIGH').length,
    MEDIUM: detections.filter((d) => d.severity === 'MEDIUM').length,
    LOW: detections.filter((d) => d.severity === 'LOW').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                SYSTEM VERIFIED
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Hydroacoustic Anomaly & Marine Debris Inspection Center
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous Side-Scan Sonar waterfall pipeline: Preprocessing, acoustic backscatter analysis, geolocation mapping, and risk evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="live-sonar-quick-btn"
              onClick={() => onNavigate('live')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1.5 shadow-lg shadow-indigo-950"
            >
              <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>Live Sonar Detection</span>
            </button>
            <button
              id="upload-sonar-quick-btn"
              onClick={() => onNavigate('upload')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 shadow-lg shadow-cyan-950"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Sonar Swath</span>
            </button>
            <button
              onClick={() => onNavigate('workspace')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <span>Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Scans</span>
            <Waves className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{totalScans}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Uploaded Swaths</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Processed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{processedCount}</div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Pipeline Complete</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Anomalies</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{totalAnomalies}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Acoustic Features</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Marine Debris</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400 font-mono">{debrisCount}</div>
            <div className="text-[10px] text-red-400/80 mt-0.5">Anthropogenic Waste</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">High Risk</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400 font-mono">{highRiskCount}</div>
            <div className="text-[10px] text-orange-400/80 mt-0.5">Score ≥60</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Missions</span>
            <Compass className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{activeMissionsCount}</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">Surveys in Progress</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Failures</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-300 font-mono">{failedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Pipeline Rejections</div>
          </div>
        </div>
      </div>

      {/* Empty State Banner if no scans */}
      {totalScans === 0 ? (
        <div className="bg-slate-900/80 border border-dashed border-slate-800 rounded-xl p-8 text-center max-w-3xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 mb-4">
            <Waves className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No analysis data available yet.</h2>
          <div className="inline-block bg-amber-950/60 border border-amber-600/40 px-3 py-1 rounded text-xs text-amber-300 font-mono mb-4">
            Deterministic CV baseline is ready for side-scan swath ingestion.
          </div>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
            The AquaSonar pipeline requires Side-Scan Sonar imagery (.jpg, .png, .tiff, GeoTIFF) to begin preprocessing, deterministic acoustic shadow extraction, and geospatial risk mapping.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Start 10-Step Sonar Upload Wizard</span>
            </button>
            <button
              onClick={onLoadSampleData}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Load Demonstration Sonar Swath</span>
            </button>
            <button
              onClick={() => onNavigate('models')}
              className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Model Integration Docs</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Dashboard Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recent Swaths & Detections by Class */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Scans Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center space-x-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Recent Sonar Survey Swaths</span>
                </h3>
                <button
                  onClick={() => onNavigate('history')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View All Scans &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Swath Image</th>
                      <th className="py-2.5 px-3 font-medium">Telemetry Coordinates</th>
                      <th className="py-2.5 px-3 font-medium">Depth</th>
                      <th className="py-2.5 px-3 font-medium">Platform</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {scans.slice(0, 5).map((scan) => {
                      const isComplete = scan.processingStatus === 'COMPLETED';
                      return (
                        <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2.5">
                              {scan.preprocessedImageUrl || scan.originalImageUrl ? (
                                <img
                                  src={scan.preprocessedImageUrl || scan.originalImageUrl}
                                  alt={scan.filename}
                                  className="w-10 h-6 object-cover rounded border border-slate-700 bg-black"
                                />
                              ) : (
                                <div className="w-10 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] text-slate-500 font-mono">
                                  RAW
                                </div>
                              )}
                              <span className="font-mono text-white text-xs truncate max-w-[150px]">
                                {scan.filename}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {scan.hasCoordinates && scan.latitude !== null && scan.longitude !== null ? (
                              <span>
                                {scan.latitude.toFixed(4)}°N, {scan.longitude.toFixed(4)}°E
                              </span>
                            ) : (
                              <span className="text-amber-400/80">Ungeoreferenced</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-cyan-400">
                            {scan.depth !== null ? `${scan.depth.toFixed(1)} m` : '--'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {scan.vehicleId}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                isComplete
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {scan.processingStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                onSelectScan(scan.id);
                                onNavigate('workspace');
                              }}
                              className="text-xs bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 px-2.5 py-1 rounded transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detections by Acoustic Class */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center space-x-2">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <span>Detections by Acoustic Class</span>
                </h3>
                <button
                  onClick={() => onNavigate('results')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View All Targets &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TARGET_CLASSES.map((cls) => {
                  const count = classCounts[cls.name] || 0;
                  return (
                    <div
                      key={cls.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cls.colorHex }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{cls.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Base risk weight: {cls.baseRiskWeight}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white font-mono">{count}</span>
                        <div className="text-[10px] text-slate-500">targets</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Severity & Readiness Breakdown */}
          <div className="space-y-6">
            {/* Severity Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-4 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <span>Anomaly Severity Breakdown</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400 font-semibold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>CRITICAL</span>
                    </span>
                    <span className="font-mono text-slate-300">{severityCounts.CRITICAL}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{
                        width: `${
                          totalAnomalies > 0 ? (severityCounts.CRITICAL / totalAnomalies) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-orange-400 font-semibold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>HIGH</span>
                    </span>
                    <span className="font-mono text-slate-300">{severityCounts.HIGH}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all"
                      style={{
                        width: `${
                          totalAnomalies > 0 ? (severityCounts.HIGH / totalAnomalies) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-semibold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>MEDIUM</span>
                    </span>
                    <span className="font-mono text-slate-300">{severityCounts.MEDIUM}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{
                        width: `${
                          totalAnomalies > 0 ? (severityCounts.MEDIUM / totalAnomalies) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-cyan-400 font-semibold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>LOW</span>
                    </span>
                    <span className="font-mono text-slate-300">{severityCounts.LOW}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full transition-all"
                      style={{
                        width: `${
                          totalAnomalies > 0 ? (severityCounts.LOW / totalAnomalies) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Platform & Hydrographic Missions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase mb-3 flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Active Hydrographic Missions</span>
              </h3>

              <div className="space-y-2.5">
                {missions.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">{m.missionName}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">{m.surveyArea}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span>Vehicle: {m.vehicleId} ({m.vehicleType})</span>
                      <span>Scans: {m.totalScans}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onNavigate('missions')}
                className="w-full mt-3 text-xs text-center py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium"
              >
                Manage All Missions &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
