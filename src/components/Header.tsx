import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Radio,
  Layers,
  Crosshair,
  CheckCircle2,
  Map as MapIcon,
  Compass,
  History,
  BarChart3,
  FileText,
  Cpu,
  Settings,
  Waves,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDemoMode: boolean;
  totalScans: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isDemoMode,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Sonar Upload', icon: UploadCloud },
    { id: 'live', label: 'Live Sonar Detection', icon: Radio },
    { id: 'sessions', label: 'Survey Sessions', icon: Layers },
    { id: 'workspace', label: 'Analysis Workspace', icon: Crosshair },
    { id: 'results', label: 'Detection Results', icon: CheckCircle2 },
    { id: 'map', label: 'Geospatial Map', icon: MapIcon },
    { id: 'missions', label: 'Missions', icon: Compass },
    { id: 'history', label: 'Survey History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'models', label: 'Model Info', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-slate-950 border-b border-slate-800 text-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => onTabChange('dashboard')}
          >
            <div className="h-10 w-10 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/50">
              <Waves className="w-6 h-6 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  AQUASONAR <span className="text-cyan-400 font-mono">AI</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated Side-Scan Sonar Marine Debris & Anomaly System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-inner'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-2">
            {isDemoMode && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/50 font-semibold animate-pulse">
                DEMO / SYNTHETIC DATA
              </span>
            )}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>CV-v1.0 + GEMINI</span>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Horizontal Scroll Navigation */}
        <div className="xl:hidden flex space-x-1 overflow-x-auto pb-2.5 pt-1 scrollbar-none border-t border-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
