import React from 'react';
import { UserCheck, Radio, Sparkles, Trash2 } from 'lucide-react';
import { Operator } from '../types';

interface OperatorBarProps {
  operator: Operator;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onLoadSampleData: () => void;
  onClearData: () => void;
  totalScans: number;
}

export const OperatorBar: React.FC<OperatorBarProps> = ({
  operator,
  isDemoMode,
  onToggleDemoMode,
  onLoadSampleData,
  onClearData,
  totalScans,
}) => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs px-4 py-2 text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Operator profile & Engine info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">{operator.displayName}</span>
            <span className="text-slate-500 font-mono text-[11px]">
              ({operator.role.toUpperCase()})
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="text-slate-500">Inference:</span>
            <span className="text-amber-300 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
              Deterministic CV Baseline (Acoustic Highlight-Shadow)
            </span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden md:block" />

          <div className="items-center space-x-1.5 text-slate-400 hidden lg:flex">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400">
              Live sonar integration — hydroacoustic telemetry stream
            </span>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center space-x-2.5 ml-auto">
          {totalScans === 0 && (
            <button
              id="load-sample-btn"
              onClick={onLoadSampleData}
              className="bg-cyan-900/70 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/50 px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Demonstration Swath</span>
            </button>
          )}

          <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-[11px] text-slate-400">Workflow Demo:</span>
            <button
              id="demo-mode-toggle"
              onClick={onToggleDemoMode}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                isDemoMode
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isDemoMode ? 'DEMO ON' : 'REAL ONLY'}
            </button>
          </div>

          {totalScans > 0 && (
            <button
              onClick={onClearData}
              title="Clear all local survey scans and detection caches"
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
