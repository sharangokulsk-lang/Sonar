import React, { useState } from 'react';
import {
  FileText,
  Cpu,
  Settings,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  Database,
} from 'lucide-react';
import { Operator, SonarScan, Detection, Mission } from '../types';
import { storageService } from '../services/storageService';

interface ReportsModelsSettingsViewProps {
  viewMode: 'reports' | 'models' | 'settings';
  operator: Operator;
  scans: SonarScan[];
  detections: Detection[];
  missions: Mission[];
  onUpdateOperator: (op: Partial<Operator>) => void;
  onClearData: () => void;
  onLoadSampleData: () => void;
}

export const ReportsModelsSettingsView: React.FC<ReportsModelsSettingsViewProps> = ({
  viewMode,
  operator,
  scans,
  detections,
  missions,
  onUpdateOperator,
  onClearData,
  onLoadSampleData,
}) => {
  const [opName, setOpName] = useState(operator.displayName);
  const [opRole, setOpRole] = useState(operator.role);
  const [opOrg, setOpOrg] = useState(operator.organization);

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOperator({
      displayName: opName,
      role: opRole,
      organization: opOrg,
    });
    alert('Operator profile updated successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
            {viewMode.toUpperCase()}
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {viewMode === 'reports' && 'Hydrographic Executive Audit & Hazard Report'}
            {viewMode === 'models' && 'Sonar Processing Engine & AI Model Architecture'}
            {viewMode === 'settings' && 'System Configuration & Hydrographic Preferences'}
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {viewMode === 'reports' &&
            'Official maritime survey document ready for hydrographic command review, environmental authorities, and port clearance.'}
          {viewMode === 'models' &&
            'Specifications of the Deterministic Computer Vision Baseline, Multimodal Gemini model integration, and Deep Learning training roadmap.'}
          {viewMode === 'settings' &&
            'Operator credentials, sensor telemetry defaults, and local hydrographic cache maintenance.'}
        </p>
      </div>

      {/* Reports View */}
      {viewMode === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handlePrint}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm space-y-6 text-slate-200">
            {/* Header Document */}
            <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                  NAVAL HYDROGRAPHIC SURVEY COMMAND / SIH 2026
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Benthic Debris & Seabed Obstruction Audit
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  Document Ref: AQS-REP-{new Date().getFullYear()}-0089 • Security: OFFICIAL
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Lead Hydrographer: {operator.displayName}</div>
                <div>Org: {operator.organization}</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                1. Executive Summary & Survey Parameters
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                During the autonomous hydroacoustic survey of coastal waters, side-scan sonar arrays recorded {scans.length} waterfall swath swaths across active navigation corridors. The pipeline cataloged a total of{' '}
                <strong className="text-orange-400 font-mono">{detections.length} acoustic anomaly targets</strong>, of which{' '}
                <strong className="text-red-400 font-mono">
                  {detections.filter((d) => d.className.toLowerCase().includes('debris')).length}{' '}
                  represent anthropogenic marine debris
                </strong>{' '}
                (discarded fishing gear, containers, and metallic obstructions).
              </p>
            </div>

            {/* Critical Hazards Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-red-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>2. High-Priority Navigational & Environmental Hazards</span>
              </h3>

              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Target Class</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Risk Score</th>
                      <th className="py-2.5 px-3">Coordinates</th>
                      <th className="py-2.5 px-3">Water Depth</th>
                      <th className="py-2.5 px-3">Backscatter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {detections
                      .filter((d) => (d.riskScore || 0) >= 60)
                      .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-white">{d.className}</td>
                          <td className="py-2.5 px-3 text-red-400 font-bold">{d.severity}</td>
                          <td className="py-2.5 px-3 font-bold text-orange-400">{d.riskScore}/100</td>
                          <td className="py-2.5 px-3">
                            {d.latitude !== null && d.longitude !== null
                              ? `${d.latitude.toFixed(4)}°N, ${d.longitude.toFixed(4)}°E`
                              : 'Ungeoreferenced'}
                          </td>
                          <td className="py-2.5 px-3 text-cyan-400">{d.depth} m</td>
                          <td className="py-2.5 px-3">{d.acousticBackscatterRatio}x</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                3. Hydrographic Recommendations
              </h3>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5">
                <li>Deploy tactical ROV with micro-optical camera to inspect identified ghost fishing nets and clear snag hazard.</li>
                <li>Transmit Notice to Mariners (NOTAM) warning shallow draft traffic away from unclassified wreck profile.</li>
                <li>Synchronize georeferenced anomaly coordinates with Regional Hydrographic Database.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Models View */}
      {viewMode === 'models' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Layer 1: Deterministic Computer Vision Baseline (CV-v1.0)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              AquaSonar AI uses a deterministic hydroacoustic signal processing pipeline modeled on side-scan sonar physical acoustics:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-2 font-mono">
                <span className="text-cyan-400 font-bold block">ACOUSTIC PREPROCESSING</span>
                <p className="text-slate-400 text-[11px]">
                  • ITU-R BT.601 acoustic luminance mapping<br />
                  • 3x3 Spatial median speckle noise filter<br />
                  • Contrast-Limited Adaptive Histogram Equalization (CLAHE)<br />
                  • Time-Varied-Gain (TVG) radial transmission loss equalization
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg space-y-2 font-mono">
                <span className="text-amber-400 font-bold block">SHADOW & HIGHLIGHT EXTRACTOR</span>
                <p className="text-slate-400 text-[11px]">
                  • Specular backscatter peak detection (+1.85σ above ambient)<br />
                  • Downstream acoustic occlusion shadow matching<br />
                  • Obstacle relief calculation: H = (Shadow_Length * Altitude) / Slant_Range<br />
                  • Rule-based benthic feature categorization
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Layer 2: Gemini Multimodal Hydroacoustic Intelligence</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              For complex ambiguous targets, the server-side proxy invokes Gemini 2.5 Flash with multimodal imagery prompts to evaluate high-backscatter anomalies against anthropogenic debris morphological patterns, evaluating risk, environmental impact, and salvage remediation.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Deep Learning Training Roadmap (SIH 2026 Target)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              The project is engineered for drop-in replacement with fine-tuned YOLOv8-Underwater or Mask-RCNN once the hydrographic training dataset (labeled side-scan GeoTIFF swaths from naval missions) is published.
            </p>
          </div>
        </div>
      )}

      {/* Settings View */}
      {viewMode === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Operator Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Operator Profile & Credentials</span>
            </h3>

            <form onSubmit={handleSaveOperator} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operator Name
                </label>
                <input
                  type="text"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operational Role
                </label>
                <input
                  type="text"
                  value={opRole}
                  onChange={(e) => setOpRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization / Naval Unit
                </label>
                <input
                  type="text"
                  value={opOrg}
                  onChange={(e) => setOpOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Cache Maintenance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Hydrographic Survey Cache Maintenance</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage locally stored side-scan swaths, synthetic demonstration waterfalls, and extracted anomaly coordinates.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLoadSampleData}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Reload Synthetic Demonstration Swaths
              </button>
              <button
                onClick={onClearData}
                className="bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear All Local Survey Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
