import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  FileDown,
  Sparkles,
  Layers,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { SonarScan } from '../types';
import { OperatorProfile } from '../App';
import { exportFormattedPdfReport, AnomalyReportItem } from '../services/pdfReportGenerator';

interface ReportsTabProps {
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  scans?: SonarScan[];
  operator?: OperatorProfile;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  onShowToast,
  scans = [],
  operator,
}) => {
  // Report Configuration Toggles
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeAnomalies, setIncludeAnomalies] = useState(true);
  const [includeAnnotated, setIncludeAnnotated] = useState(true);
  const [includeMap, setIncludeMap] = useState(true);
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);

  // Selected Scan Filter
  const [selectedScanId, setSelectedScanId] = useState<string>('scan-0248');
  const [format, setFormat] = useState<'PDF' | 'CSV' | 'JSON'>('PDF');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Anomalies list for report
  const anomaliesData: AnomalyReportItem[] = [
    {
      id: 'ANM-01',
      className: 'Sunken Cargo Shipping Container',
      category: 'Marine Debris',
      confidence: 94.2,
      depth: 28.4,
      riskLevel: 'CRITICAL',
      lat: 13.0841,
      lon: 80.2782,
      backscatterRatio: 3.8,
      shadowLengthM: 4.8,
      reliefHeightM: 2.5,
      dimensions: '6.1m x 2.4m x 2.6m',
      status: 'CONFIRMED',
    },
    {
      id: 'ANM-02',
      className: 'Entangled Ghost Fishing Net',
      category: 'Ghost Gear',
      confidence: 88.5,
      depth: 31.2,
      riskLevel: 'HIGH',
      lat: 13.0849,
      lon: 80.2791,
      backscatterRatio: 2.7,
      shadowLengthM: 2.6,
      reliefHeightM: 1.2,
      dimensions: '4.5m x 3.2m',
      status: 'CONFIRMED',
    },
    {
      id: 'ANM-03',
      className: 'Granite Boulder / Coral Outcrop',
      category: 'Natural Feature',
      confidence: 72.1,
      depth: 29.8,
      riskLevel: 'LOW',
      lat: 13.0835,
      lon: 80.2774,
      backscatterRatio: 1.8,
      shadowLengthM: 1.5,
      reliefHeightM: 0.8,
      dimensions: '1.9m x 1.6m',
      status: 'REVIEWED',
    },
  ];

  const aiVerdictText =
    'Gemini 3.8 Flash hydroacoustic synthesis: Target ANM-01 exhibits a pronounced specular backscatter ratio (+3.8x) followed by a 4.8m acoustic shadow occlusion, confirming an elevated rigid metallic container structure elevated +2.5m above benthic sediment. Target ANM-02 displays chaotic, low-reflectivity fibrous impedance consistent with an entangled polyethylene trawl net (ghost gear) posing severe entangling hazard to marine fauna and subsea ROVs.';

  const recommendationsList = [
    'Log Target ANM-01 (Cargo Container) into Tactical Hydrographic Hazard Database and notify national coast guard authority.',
    'Deploy tethered work-class ROV with HD stereoscopic cameras to verify structural integrity and hazmat potential.',
    'Schedule environmental retrieval mission for Target ANM-02 (Ghost Net) to prevent benthic ecological smothering.',
    'Maintain active acoustic monitoring buffer of 250m around identified submerged navigational hazards.',
  ];

  // Handler for direct jsPDF export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportFormattedPdfReport({
        scanId: selectedScanId === 'all' ? 'EXPEDITION_ALL' : selectedScanId,
        missionName: 'Shelf Survey Alpha (Bay of Bengal Transect)',
        vesselName: 'RV Sagar Nidhi / AUV-MAYUR-03',
        operatorName: operator?.name || 'Ocean Explorer (Hydrography Lead)',
        organization: operator?.organization || 'National Institute of Ocean Technology (NIOT)',
        surveyDate: '03 May 2026',
        frequencyKhz: 450,
        swathWidthM: 120,
        meanDepthM: 29.8,
        coordinates: { lat: 13.0841, lon: 80.2782 },
        includeSummary,
        includeAnomalies,
        includeAnnotated,
        includeMap,
        includeAiSummary,
        includeRecommendations,
        anomalies: anomaliesData,
        aiVerdict: aiVerdictText,
        recommendations: recommendationsList,
      });

      if (onShowToast) {
        onShowToast('Formatted PDF report compiled and downloaded successfully via jsPDF.', 'success');
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      if (onShowToast) {
        onShowToast('Failed to compile PDF report. Please try again.', 'warn');
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleGenerate = () => {
    if (format === 'PDF') {
      handleExportPdf();
    } else if (format === 'CSV') {
      handleExportCSV();
    } else {
      handleExportJSON();
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Anomaly_ID,Scan_ID,Classification,Category,Confidence,Depth_m,Backscatter_Ratio,Latitude,Longitude,Status\n' +
      'ANM-01,Scan_0248,Sunken Cargo Shipping Container,Marine Debris,94.2%,28.4,3.8x,13.0841,80.2782,Confirmed\n' +
      'ANM-02,Scan_0248,Entangled Ghost Fishing Net,Ghost Gear,88.5%,31.2,2.7x,13.0849,80.2791,Confirmed\n' +
      'ANM-03,Scan_0248,Granite Boulder / Coral Outcrop,Natural Feature,72.1%,29.8,1.8x,13.0835,80.2774,Reviewed\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AquaNex_Survey_Report_${selectedScanId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('CSV telemetry exported successfully.');
  };

  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(
      {
        survey_metadata: {
          report_id: `ANX-SRV-${selectedScanId.toUpperCase()}`,
          mission: 'Shelf Survey Alpha',
          vessel: 'RV Sagar Nidhi / AUV-MAYUR-03',
          operator: operator?.name || 'Ocean Explorer',
          organization: operator?.organization || 'National Institute of Ocean Technology',
          survey_date: '2026-05-03',
          carrier_frequency_khz: 450,
          swath_width_m: 120,
          mean_depth_m: 29.8,
          total_pings: 1842,
          anomalies_detected: anomaliesData.length,
        },
        anomalies: anomaliesData,
        gemini_ai_evaluation: aiVerdictText,
        recommendations: recommendationsList,
      },
      null,
      2
    );
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AquaNex_GeoReport_${selectedScanId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('JSON Geo-Report downloaded.');
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Top Banner: Survey Dossier Header */}
      <div className="bg-[#0b1624] border border-[#16293d] rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Hydroacoustic Survey Report Generator
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                jsPDF Engine
              </span>
            </div>
            <p className="text-xs text-[#7d93a8] mt-0.5">
              Export survey dossiers, acoustic anomaly tables, and Gemini AI insights as formatted PDF reports
            </p>
          </div>
        </div>

        {/* Instant Export PDF Button */}
        <button
          id="btn-export-pdf-top"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          className="bg-gradient-to-r from-[#00a3c4] to-teal-500 hover:from-[#0092b0] hover:to-teal-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 active:scale-[0.99] whitespace-nowrap"
        >
          <FileDown className="w-4 h-4" />
          <span>{isExportingPdf ? 'Compiling PDF...' : 'Export PDF Report'}</span>
        </button>
      </div>

      {/* Main Form Configuration Card */}
      <div className="bg-[#0d1b2a] border border-[#16293d] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Survey Scan Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Select Survey Scan</span>
            <span className="text-[10px] font-mono text-[#6c8299]">
              Datum: WGS 84 • Carrier: 450 kHz
            </span>
          </label>
          <select
            value={selectedScanId}
            onChange={(e) => setSelectedScanId(e.target.value)}
            className="w-full bg-[#08121e] border border-[#182d43] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
          >
            <option value="scan-0248">Scan_0248 • Bay of Bengal Transect Alpha (3 Detections)</option>
            <option value="scan-0249">Scan_0249 • Continental Shelf Swath Beta (2 Detections)</option>
            <option value="scan-0250">Scan_0250 • Deep Harbor Approach (1 Detection)</option>
            <option value="all">Full Expedition Dossier (All Logged Scans)</option>
          </select>
        </div>

        {/* Section Checklist Toggles */}
        <div className="space-y-3 pt-1 border-t border-[#162b40]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Include in Formatted PDF</span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {[
                includeSummary,
                includeAnomalies,
                includeAnnotated,
                includeMap,
                includeAiSummary,
                includeRecommendations,
              ].filter(Boolean).length}{' '}
              of 6 sections selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Scan summary */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">1. Mission & Sonar Parameters</span>
                <span className="text-[10px] text-[#6c8299]">Vessel, carrier freq, bathymetry depth</span>
              </div>
            </label>

            {/* Annotated images */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeAnnotated}
                onChange={(e) => setIncludeAnnotated(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">2. Acoustic Sonar Waterfall</span>
                <span className="text-[10px] text-[#6c8299]">Swath visual with target bounding boxes</span>
              </div>
            </label>

            {/* Detected anomalies */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeAnomalies}
                onChange={(e) => setIncludeAnomalies(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">3. Detected Benthic Anomalies</span>
                <span className="text-[10px] text-[#6c8299]">Structured autoTable with backscatter & risk</span>
              </div>
            </label>

            {/* AI analysis summary */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeAiSummary}
                onChange={(e) => setIncludeAiSummary(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">4. Gemini AI Acoustic Reasoning</span>
                <span className="text-[10px] text-[#6c8299]">Deep reasoning on impedance & relief</span>
              </div>
            </label>

            {/* Map & locations */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeMap}
                onChange={(e) => setIncludeMap(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">5. Geospatial Waypoints</span>
                <span className="text-[10px] text-[#6c8299]">WGS84 DGPS coordinates for navigation</span>
              </div>
            </label>

            {/* Recommendations */}
            <label className="flex items-center space-x-2.5 cursor-pointer text-[#8da2b5] hover:text-white bg-[#081320] p-2.5 rounded-xl border border-[#152a40] transition-colors">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="w-4 h-4 rounded border-[#203c5a] text-[#00a3c4] focus:ring-0 bg-[#08121e] cursor-pointer"
              />
              <div>
                <span className="text-white font-medium block">6. Tactical Mitigation Actions</span>
                <span className="text-[10px] text-[#6c8299]">ROV ground-truthing & salvage orders</span>
              </div>
            </label>
          </div>
        </div>

        {/* Report Format selector & Action Buttons */}
        <div className="pt-2 border-t border-[#162b40] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">Target Format</div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFormat('PDF')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    format === 'PDF'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50'
                      : 'bg-[#08121e] text-[#6c8299] border border-[#182d43] hover:text-white'
                  }`}
                >
                  PDF Dossier (jsPDF)
                </button>
                <button
                  onClick={() => setFormat('CSV')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    format === 'CSV'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50'
                      : 'bg-[#08121e] text-[#6c8299] border border-[#182d43] hover:text-white'
                  }`}
                >
                  CSV Data Export
                </button>
                <button
                  onClick={() => setFormat('JSON')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    format === 'JSON'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50'
                      : 'bg-[#08121e] text-[#6c8299] border border-[#182d43] hover:text-white'
                  }`}
                >
                  JSON Geo-Report
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-preview-report-modal"
                onClick={() => setShowPreviewModal(true)}
                className="bg-[#122336] hover:bg-[#183049] text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-[#1d3856] transition-all flex items-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Preview Document</span>
              </button>

              <button
                id="btn-primary-generate"
                onClick={handleGenerate}
                disabled={isExportingPdf}
                className="bg-[#00a3c4] hover:bg-[#0092b0] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2 active:scale-[0.99]"
              >
                {format === 'PDF' ? (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>{isExportingPdf ? 'Exporting PDF...' : 'Export PDF Report'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Export {format}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive In-App Report Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1624] border border-[#1d3550] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#1b3149] flex items-center justify-between bg-[#08121d]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    AquaNex_Survey_Report_{selectedScanId}.pdf
                  </h3>
                  <div className="text-[11px] text-[#6c8299]">
                    Official Hydroacoustic Survey Dossier • jsPDF Formatted Export
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-[#6c8299] hover:text-white p-1.5 rounded-lg hover:bg-[#122336] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Preview Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#9bb0c4] leading-relaxed bg-[#060e18]">
              {/* Document Header Representation */}
              <div className="bg-[#0b192c] border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    AquaNex Hydroacoustic Intelligence
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    Automated Underwater Sonar Survey Dossier
                  </h4>
                  <div className="text-[11px] text-[#6c8299] mt-0.5">
                    Lead: {operator?.name || 'Ocean Explorer'} • Agency: {operator?.organization || 'NIOT'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                    RESTRICTED REPORT
                  </span>
                  <div className="text-[10px] text-[#6c8299] mt-1">
                    ANX-SRV-{selectedScanId.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Section 1: Mission Summary */}
              {includeSummary && (
                <div className="bg-[#0c1a29] border border-[#18314c] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>1. Mission & Hydroacoustic Parameters</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Section Included</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px] font-mono">
                    <div className="bg-[#08121d] p-2 rounded-lg border border-[#14283d]">
                      <div className="text-[#6c8299]">Carrier Freq:</div>
                      <div className="text-cyan-400 font-bold">450 kHz Dual-Band</div>
                    </div>
                    <div className="bg-[#08121d] p-2 rounded-lg border border-[#14283d]">
                      <div className="text-[#6c8299]">Swath Width:</div>
                      <div className="text-white font-bold">120 m (60m/ch)</div>
                    </div>
                    <div className="bg-[#08121d] p-2 rounded-lg border border-[#14283d]">
                      <div className="text-[#6c8299]">Mean Depth:</div>
                      <div className="text-white font-bold">29.8 m Bathymetry</div>
                    </div>
                    <div className="bg-[#08121d] p-2 rounded-lg border border-[#14283d]">
                      <div className="text-[#6c8299]">Geodetic Datum:</div>
                      <div className="text-white font-bold">WGS 84 (UTM 44N)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Sonar Waterfall Imagery */}
              {includeAnnotated && (
                <div className="bg-[#0c1a29] border border-[#18314c] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>2. Acoustic Side-Scan Waterfall (Annotated Targets)</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Section Included</span>
                  </div>
                  <div className="bg-[#050b13] border border-cyan-500/20 rounded-lg p-3 text-center space-y-1 font-mono text-[11px]">
                    <div className="text-cyan-400 font-semibold">
                      [ Synthetic Dual-Channel Hydroacoustic Waterfall Embedded via jsPDF ]
                    </div>
                    <p className="text-[10px] text-[#6c8299]">
                      Includes Nadir Gap, Port Swath (-60m), Starboard Swath (+60m), and annotated target bounding boxes with specular acoustic highlight and shadow projection.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 3: Anomalies Table */}
              {includeAnomalies && (
                <div className="bg-[#0c1a29] border border-[#18314c] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>3. Detected Benthic Relief Targets (autoTable)</span>
                    <span className="text-[10px] text-cyan-400 font-normal">3 Records</span>
                  </div>
                  <div className="border border-[#182d43] rounded-xl overflow-hidden">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#08121d] text-[#6c8299] font-mono border-b border-[#182d43]">
                        <tr>
                          <th className="py-2 px-3">Target ID</th>
                          <th className="py-2 px-3">Classification</th>
                          <th className="py-2 px-3">Confidence</th>
                          <th className="py-2 px-3">Backscatter</th>
                          <th className="py-2 px-3">Relief</th>
                          <th className="py-2 px-3">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#15273b] font-mono">
                        {anomaliesData.map((anm) => (
                          <tr key={anm.id} className="hover:bg-[#102338]">
                            <td className="py-2 px-3 text-white font-bold">{anm.id}</td>
                            <td className="py-2 px-3 text-[#d2e0ee]">{anm.className}</td>
                            <td className="py-2 px-3 text-cyan-400">{anm.confidence.toFixed(1)}%</td>
                            <td className="py-2 px-3 text-[#8fa4b8]">+{anm.backscatterRatio}x</td>
                            <td className="py-2 px-3 text-[#8fa4b8]">+{anm.reliefHeightM}m</td>
                            <td className="py-2 px-3">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  anm.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-950 text-rose-400 border-rose-500/40'
                                    : anm.riskLevel === 'HIGH'
                                    ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                                    : 'bg-cyan-950 text-cyan-400 border-cyan-500/40'
                                }`}
                              >
                                {anm.riskLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 4: AI Analysis */}
              {includeAiSummary && (
                <div className="space-y-1.5 bg-[#08121d] p-3.5 rounded-xl border border-cyan-500/30">
                  <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>4. Gemini 3.8 Flash Hydroacoustic Reasoning Verdict</span>
                  </div>
                  <p className="text-[11px] text-[#8ea4b8] leading-relaxed">
                    {aiVerdictText}
                  </p>
                </div>
              )}

              {/* Section 5: Recommendations */}
              {includeRecommendations && (
                <div className="bg-[#0c1a29] border border-[#18314c] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    5. Tactical Mitigation & Action Recommendations
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#9bb0c4] list-disc list-inside">
                    {recommendationsList.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-[#1b3149] bg-[#08121d] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl border border-[#1e3854] text-[#8ea4b8] hover:text-white hover:border-cyan-500 transition-colors flex items-center space-x-1.5 font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl border border-[#1e3854] text-[#8ea4b8] hover:text-white hover:border-cyan-500 transition-colors flex items-center space-x-1.5 font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-[#1e3854] text-[#8ea4b8] hover:text-white hover:border-cyan-500 transition-colors flex items-center space-x-1.5 font-mono"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              {/* Primary Download Formatted PDF */}
              <button
                id="btn-modal-export-pdf"
                onClick={async () => {
                  await handleExportPdf();
                  setShowPreviewModal(false);
                }}
                disabled={isExportingPdf}
                className="bg-gradient-to-r from-[#00a3c4] to-teal-500 hover:from-[#0092b0] hover:to-teal-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2 active:scale-[0.99]"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
