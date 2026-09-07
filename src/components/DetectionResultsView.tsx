import React, { useState } from 'react';
import {
  CheckCircle2,
  Filter,
  Search,
  Download,
  Crosshair,
  MapPin,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Detection, SonarScan } from '../types';
import { TARGET_CLASSES, getTargetClassMeta } from '../data/mockData';

interface DetectionResultsViewProps {
  detections: Detection[];
  scans: SonarScan[];
  onSelectScan: (scanId: string) => void;
  onNavigate: (tab: string) => void;
}

export const DetectionResultsView: React.FC<DetectionResultsViewProps> = ({
  detections,
  scans,
  onSelectScan,
  onNavigate,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDetections = detections.filter((d) => {
    if (selectedClassFilter !== 'ALL' && d.className !== selectedClassFilter) {
      return false;
    }
    if (selectedSeverityFilter !== 'ALL' && d.severity !== selectedSeverityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.id.toLowerCase().includes(q);
      const matchClass = d.className.toLowerCase().includes(q);
      const matchScan = d.scanId.toLowerCase().includes(q);
      if (!matchId && !matchClass && !matchScan) return false;
    }
    return true;
  });

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(detections, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `aquasonar_detections_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportCsv = () => {
    const headers = ['ID', 'ScanID', 'Class', 'Severity', 'RiskScore', 'Latitude', 'Longitude', 'Depth', 'BackscatterRatio'];
    const rows = detections.map((d) => [
      d.id,
      d.scanId,
      `"${d.className}"`,
      d.severity,
      d.riskScore,
      d.latitude ?? '',
      d.longitude ?? '',
      d.depth ?? '',
      d.acousticBackscatterRatio ?? '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const a = document.createElement('a');
    a.setAttribute('href', encodeURI(csvContent));
    a.setAttribute('download', `aquasonar_detections_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                ANOMALY REPOSITORY
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Hydroacoustic Detection Results & Catalog
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic computer vision extraction with risk factor scores, backscatter contrast, and spatial fixes.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportCsv}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={exportJson}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT JSON</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 text-xs font-mono text-slate-400 mr-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>FILTERS:</span>
            </div>

            {/* Class filter */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Acoustic Classes</option>
              {TARGET_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Severity filter */}
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, class, scan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Results Count Indicator */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredDetections.length}</strong> of{' '}
          {detections.length} total cataloged anomalies
        </span>
        <span className="text-amber-400/90">
          * Model inference: CV-v1.0 Baseline (Acoustic Highlight & Shadow Extraction)
        </span>
      </div>

      {/* Anomaly Cards Grid */}
      {filteredDetections.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
          No detection results matching your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDetections.map((det) => {
            const meta = getTargetClassMeta(det.className);
            const parentScan = scans.find((s) => s.id === det.scanId);

            return (
              <div
                key={det.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                      <span className="font-bold text-sm text-white">{det.className}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          det.severity === 'HIGH' || det.severity === 'CRITICAL'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {det.severity}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      ID: {det.id} • Swath: {parentScan?.filename || det.scanId}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold font-mono text-orange-400">
                      {det.riskScore} <span className="text-xs text-slate-500">/100</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Risk Score</div>
                  </div>
                </div>

                {/* Acoustic Reasoning Summary */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                  {det.aiExplanation?.summaryReasoning ||
                    `Acoustic specular backscatter ratio: ${det.acousticBackscatterRatio}x. Shadow profile confirms physical relief above seabed.`}
                </p>

                {/* Telemetry & Metrics row */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 bg-slate-950/40 p-2 rounded">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300 truncate">
                      {det.latitude !== null && det.longitude !== null
                        ? `${det.latitude.toFixed(4)}°N, ${det.longitude.toFixed(4)}°E`
                        : 'Ungeoreferenced'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span>Backscatter: </span>
                    <strong className="text-cyan-400">{det.acousticBackscatterRatio}x</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500">
                    Box: {det.boundingBox.width}x{det.boundingBox.height}px
                  </span>

                  <button
                    onClick={() => {
                      onSelectScan(det.scanId);
                      onNavigate('workspace');
                    }}
                    className="bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                  >
                    <span>Inspect in Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
