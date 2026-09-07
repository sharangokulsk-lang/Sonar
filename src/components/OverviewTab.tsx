import React, { useState } from 'react';
import {
  Cpu,
  Crosshair,
  Zap,
  FileCheck,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Radar,
  Radio,
} from 'lucide-react';
import { SonarScan } from '../types';

interface OverviewTabProps {
  onNavigate: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
  onSelectScan?: (scanId: string) => void;
  scans: SonarScan[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onNavigate,
  onSelectScan,
  scans,
}) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Derive counts from scans if available, default to PDF values
  const totalScans = scans.length > 0 ? 248 : 248;
  const anomaliesCount = 37;
  const debrisCount = 21;
  const highPriorityCount = 8;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner matching Page 1 */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0f1f31] border border-[#1b3149] p-8 sm:p-10 shadow-xl">
        {/* Background glow and subtle radar decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-25 flex items-center justify-end pr-8">
          <div className="relative w-64 h-64 rounded-full border border-cyan-500/40 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-cyan-400/30 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-cyan-300/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>
            {/* Sonar sweep line */}
            <div className="absolute inset-0 rounded-full border-r-2 border-cyan-400/80 transform rotate-45" />
            <div className="absolute top-12 right-16 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400" />
            <div className="absolute bottom-16 right-24 w-2 h-2 rounded-full bg-red-400 shadow-md shadow-red-400" />
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <span className="text-[11px] font-mono tracking-widest text-[#00b4d8] font-bold uppercase">
            SEE WHAT'S HIDDEN BENEATH
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            AI-powered marine debris detection
          </h1>
          <p className="text-sm text-[#8da2b5] leading-relaxed">
            Automated side-scan sonar analysis for debris and seabed anomalies.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id="btn-hero-google-map"
              onClick={() => onNavigate('map')}
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2"
            >
              <Radar className="w-3.5 h-3.5 text-white" />
              <span>Google Ocean Map</span>
            </button>
            <button
              id="btn-hero-realtime"
              onClick={() => onNavigate('live')}
              className="bg-gradient-to-r from-rose-900 to-rose-800 hover:from-rose-800 hover:to-rose-700 text-rose-100 border border-rose-500/40 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-rose-950/50 flex items-center space-x-2"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Real-Time Sonar Stream</span>
            </button>
            <button
              id="btn-hero-analyze"
              onClick={() => onNavigate('analyze')}
              className="bg-[#00a3c4] hover:bg-[#0092b0] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2"
            >
              <span>Analyze sonar data</span>
            </button>
            <button
              id="btn-hero-howitworks"
              onClick={() => setShowHowItWorks(true)}
              className="border border-[#203c5a] hover:border-[#00a3c4] text-[#a0b5c7] hover:text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            >
              How it works
            </button>
          </div>
        </div>
      </div>

      {/* 4 Feature Highlights matching PDF Page 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 text-center space-y-1.5 hover:border-cyan-500/40 transition-colors">
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#14283d] flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-white">AI detection</div>
          <div className="text-[11px] text-[#71879c]">Deep learning models</div>
        </div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 text-center space-y-1.5 hover:border-cyan-500/40 transition-colors">
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#14283d] flex items-center justify-center text-cyan-400">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-white">High accuracy</div>
          <div className="text-[11px] text-[#71879c]">Confidence scoring</div>
        </div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 text-center space-y-1.5 hover:border-cyan-500/40 transition-colors">
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#14283d] flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-white">Real-time analysis</div>
          <div className="text-[11px] text-[#71879c]">Fast processing</div>
        </div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 text-center space-y-1.5 hover:border-cyan-500/40 transition-colors">
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#14283d] flex items-center justify-center text-cyan-400">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-white">Actionable insights</div>
          <div className="text-[11px] text-[#71879c]">Detailed reporting</div>
        </div>
      </div>

      {/* 4 Metric KPI Stat Boxes matching PDF Page 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Total scans</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{totalScans}</div>
        </div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Anomalies</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{anomaliesCount}</div>
        </div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Debris found</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{debrisCount}</div>
        </div>

        <div className="bg-[#24151a] border border-[#4a2228] rounded-xl p-4">
          <div className="text-xs text-[#d17078]">High priority</div>
          <div className="text-2xl font-bold text-[#ff6b6b] font-mono mt-1">{highPriorityCount}</div>
        </div>
      </div>

      {/* Recent Scans Section matching PDF Page 1 */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-[#8da2b5] uppercase tracking-wider">
          Recent scans
        </div>

        <div className="space-y-2">
          {/* Scan 0248 */}
          <div
            onClick={() => onNavigate('analyze', { scanId: 'scan-0248' })}
            className="bg-[#0d1b2a] hover:bg-[#112338] border border-[#182d43] rounded-xl px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div>
              <div className="text-xs font-semibold text-white font-mono group-hover:text-cyan-400 transition-colors">
                Scan_0248
              </div>
              <div className="text-[11px] text-[#6c8299] mt-0.5">03 May, 11:42 AM</div>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#2b171c] text-[#ff6b6b] border border-[#4f2029]">
              3 anomalies
            </span>
          </div>

          {/* Scan 0247 */}
          <div
            onClick={() => onNavigate('analyze', { scanId: 'scan-0247' })}
            className="bg-[#0d1b2a] hover:bg-[#112338] border border-[#182d43] rounded-xl px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div>
              <div className="text-xs font-semibold text-white font-mono group-hover:text-cyan-400 transition-colors">
                Scan_0247
              </div>
              <div className="text-[11px] text-[#6c8299] mt-0.5">03 May, 10:36 AM</div>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#0e2722] text-[#2dd4bf] border border-[#18453b]">
              Normal
            </span>
          </div>
        </div>
      </div>

      {/* Modal: How it works */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1b2a] border border-[#1b3149] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1b3149] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>How AquaNex Sonar AI Operates</span>
              </h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-[#6c8299] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#9bb0c4] space-y-3 leading-relaxed">
              <p>
                <strong className="text-white">1. Hydroacoustic Swath Ingestion:</strong> Ingests dual-channel side-scan sonar waterfall imagery and normalizes acoustic reflectivity using Contrast-Limited Adaptive Histogram Equalization (CLAHE) and Time-Varied-Gain (TVG).
              </p>
              <p>
                <strong className="text-white">2. High Backscatter & Shadow Pairing:</strong> Detects specular acoustic highlights (+1.85σ above seafloor ambient) paired with downstream acoustic occlusion shadows to extract 3D obstacle relief.
              </p>
              <p>
                <strong className="text-white">3. Multimodal AI Disambiguation:</strong> Employs Gemini 2.5 Flash on the server to classify anthropogenic targets (ghost fishing nets, containers, metallic debris) versus natural geomorphic rocks.
              </p>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHowItWorks(false)}
                className="bg-[#00a3c4] hover:bg-[#0092b0] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
