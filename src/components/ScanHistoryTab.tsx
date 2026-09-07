import React, { useState } from 'react';
import { Search, ChevronRight, ExternalLink, Filter } from 'lucide-react';
import { SonarScan } from '../types';

interface ScanHistoryTabProps {
  onNavigate: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
  onSelectScan?: (scanId: string) => void;
}

interface ScanHistoryItem {
  id: string;
  name: string;
  timestamp: string;
  anomalyCount: number;
  statusText: string;
  severity: 'high' | 'medium' | 'normal';
}

export const ScanHistoryTab: React.FC<ScanHistoryTabProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'normal'>('all');
  const [visibleCount, setVisibleCount] = useState(6);

  const historyItems: ScanHistoryItem[] = [
    {
      id: 'scan-0248',
      name: 'Scan_0248',
      timestamp: '03 May 2026, 11:42 AM',
      anomalyCount: 3,
      statusText: '3 anomalies • high',
      severity: 'high',
    },
    {
      id: 'scan-0247',
      name: 'Scan_0247',
      timestamp: '03 May 2026, 10:36 AM',
      anomalyCount: 0,
      statusText: '0 anomalies • normal',
      severity: 'normal',
    },
    {
      id: 'scan-0246',
      name: 'Scan_0246',
      timestamp: '03 May 2026, 09:29 AM',
      anomalyCount: 4,
      statusText: '4 anomalies • high',
      severity: 'high',
    },
    {
      id: 'scan-0245',
      name: 'Scan_0245',
      timestamp: '03 May 2026, 08:15 AM',
      anomalyCount: 1,
      statusText: '1 anomaly • medium',
      severity: 'medium',
    },
    {
      id: 'scan-0244',
      name: 'Scan_0244',
      timestamp: '03 May 2026, 07:48 AM',
      anomalyCount: 0,
      statusText: '0 anomalies • normal',
      severity: 'normal',
    },
    {
      id: 'scan-0243',
      name: 'Scan_0243',
      timestamp: '02 May 2026, 16:30 PM',
      anomalyCount: 2,
      statusText: '2 anomalies • medium',
      severity: 'medium',
    },
  ];

  const filtered = historyItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.statusText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      severityFilter === 'all' || item.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header & Search Bar matching PDF Page 3 Top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Scan history</h1>
          <p className="text-xs text-[#71879c] mt-0.5">Archived acoustic survey hydrophone runs</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Filters */}
          <div className="flex items-center bg-[#0d1b2a] border border-[#182d43] rounded-xl p-1 text-xs">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                severityFilter === 'all' ? 'bg-[#00a3c4] text-white' : 'text-[#71879c] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('high')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                severityFilter === 'high' ? 'bg-[#ff6b6b] text-white' : 'text-[#71879c] hover:text-white'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSeverityFilter('normal')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                severityFilter === 'normal' ? 'bg-[#2dd4bf] text-black font-semibold' : 'text-[#71879c] hover:text-white'
              }`}
            >
              Normal
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#586e82] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0d1b2a] border border-[#182d43] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-[#586e82] focus:outline-none focus:border-cyan-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Scans List matching PDF */}
      <div className="space-y-2.5">
        {filtered.slice(0, visibleCount).map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => onNavigate('analyze', { scanId: item.id })}
              className="bg-[#0d1b2a] hover:bg-[#112338] border border-[#182d43] rounded-xl px-5 py-3.5 flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div>
                <div className="text-xs font-semibold text-white font-mono flex items-center space-x-2">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    • Load in Viewport
                  </span>
                </div>
                <div className="text-[11px] text-[#6c8299] mt-0.5">{item.timestamp}</div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs font-mono font-medium px-2.5 py-1 rounded-md border ${
                    item.severity === 'high'
                      ? 'bg-[#2b171c] text-[#ff6b6b] border-[#4f2029]'
                      : item.severity === 'medium'
                      ? 'bg-[#2a1e12] text-[#f59e0b] border-[#4b3518]'
                      : 'bg-[#0e2722] text-[#2dd4bf] border-[#18453b]'
                  }`}
                >
                  {item.statusText}
                </span>
                <ChevronRight className="w-4 h-4 text-[#475e75] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button matching PDF */}
      {visibleCount < filtered.length && (
        <div className="pt-2 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + 3)}
            className="text-xs text-[#8da2b5] hover:text-white font-medium px-4 py-2 rounded-xl bg-[#0d1b2a] border border-[#182d43] transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};
