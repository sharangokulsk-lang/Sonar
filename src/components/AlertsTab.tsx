import React, { useState } from 'react';
import { ChevronDown, Check, Eye, Bell, CheckCircle2 } from 'lucide-react';
import { AlertItem } from '../App';

interface AlertsTabProps {
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
  onNavigate: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts, onAcknowledge, onNavigate }) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'info'>('all');

  const filtered =
    severityFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === severityFilter);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Title & Severity Filter Dropdown matching PDF Page 3 Bottom */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Alerts</h1>
          <p className="text-xs text-[#71879c] mt-0.5">
            {alerts.filter((a) => a.status === 'PENDING').length} unacknowledged operational notifications
          </p>
        </div>

        <div className="relative">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-[#0d1b2a] border border-[#182d43] rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="all">All severities</option>
            <option value="high">High severity</option>
            <option value="medium">Medium severity</option>
            <option value="info">System info</option>
          </select>
        </div>
      </div>

      {/* Alerts List matching PDF Page 3 Bottom */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          return (
            <div
              key={alert.id}
              className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden transition-all hover:bg-[#0f2136]"
              style={{ borderLeftWidth: '4px', borderLeftColor: alert.accentColor }}
            >
              <div>
                <div className="text-xs font-semibold text-white flex items-center space-x-2">
                  <span>{alert.title}</span>
                  {alert.status === 'PENDING' && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <div className="text-[11px] text-[#6c8299] mt-0.5">{alert.timestamp}</div>
              </div>

              <div className="flex items-center space-x-2">
                {alert.status === 'PENDING' && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="bg-[#00a3c4] hover:bg-[#0092b0] text-white px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-cyan-950/40 flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}

                {alert.scanId && (
                  <button
                    onClick={() => onNavigate('analyze', { scanId: alert.scanId })}
                    className="border border-[#203c5a] hover:border-cyan-500 text-cyan-300 px-4 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Scan</span>
                  </button>
                )}

                {alert.status === 'DISMISSED' && (
                  <span className="text-xs text-[#586e82] font-medium pr-2">Dismissed</span>
                )}

                {alert.status === 'ACKNOWLEDGED' && (
                  <span className="text-xs text-emerald-400 font-medium pr-2 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
