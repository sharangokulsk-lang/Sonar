import React from 'react';
import {
  Compass,
  Crosshair,
  LayoutDashboard,
  Map as MapIcon,
  History,
  Bell,
  FileText,
  Settings,
  Radar,
  Radio,
} from 'lucide-react';

export type TabKey =
  | 'overview'
  | 'live'
  | 'analyze'
  | 'dashboard'
  | 'map'
  | 'history'
  | 'alerts'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unreadAlertsCount?: number;
  operatorName?: string;
  operatorRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unreadAlertsCount = 2,
  operatorName = 'Ocean explorer',
  operatorRole = 'Admin',
}) => {
  const menuItems: Array<{ id: TabKey; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'live', label: 'Live Stream', icon: Radio },
    { id: 'analyze', label: 'Analyze', icon: Crosshair },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Google Ocean Map', icon: MapIcon },
    { id: 'history', label: 'Scan history', icon: History },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#08121e] border-r border-[#152538] flex flex-col justify-between select-none shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="p-6 pb-5 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00b4d8] to-[#0077b6] flex items-center justify-center text-white shadow-lg shadow-cyan-950/40">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide">AquaNex</span>
            <div className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase">
              Sonar AI System
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1 mt-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#00a3c4] text-white shadow-md shadow-cyan-900/40 font-semibold'
                    : 'text-[#8da2b5] hover:text-white hover:bg-[#0f1f31]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.id === 'live' ? 'text-rose-400' : 'text-[#6c8299]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'live' && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
                {item.id === 'alerts' && unreadAlertsCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'
                    }`}
                  >
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile at Bottom of Sidebar */}
      <div className="p-4 border-t border-[#152538] m-3 mt-0 rounded-2xl bg-[#0d1b2a]/60">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-cyan-500/30">
            {operatorName
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'OE'}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-white truncate">{operatorName}</div>
            <div className="text-[10px] text-[#6c8299] font-mono">{operatorRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
