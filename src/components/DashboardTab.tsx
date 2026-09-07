import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { SonarScan } from '../types';

interface DashboardTabProps {
  onNavigate: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
  scans: SonarScan[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigate, scans }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; count: number; date: string } | null>({
    day: '3 May',
    count: 26,
    date: 'Today • 3 Anomalies Detected',
  });
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
      </div>

      {/* 4 Top Metric Cards matching PDF Page 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Total scans */}
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Total scans</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">248</div>
          <div className="text-[11px] text-cyan-400 font-medium mt-0.5">+18 this week</div>
        </div>

        {/* Card 2: Total anomalies */}
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Total anomalies</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">37</div>
          <div className="text-[11px] text-cyan-400 font-medium mt-0.5">+6 this week</div>
        </div>

        {/* Card 3: Debris detected */}
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4">
          <div className="text-xs text-[#8095a8]">Debris detected</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">21</div>
          <div className="text-[11px] text-cyan-400 font-medium mt-0.5">+4 this week</div>
        </div>

        {/* Card 4: High priority */}
        <div className="bg-[#24151a] border border-[#4a2228] rounded-xl p-4">
          <div className="text-xs text-[#d17078]">High priority</div>
          <div className="text-2xl font-bold text-[#ff6b6b] font-mono mt-1">8</div>
          <div className="text-[11px] text-[#ff8585] font-medium mt-0.5">+2 this week</div>
        </div>
      </div>

      {/* 2 Middle Charts matching PDF Page 2 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Anomalies over time curve (7 cols) */}
        <div className="md:col-span-7 bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-white">Anomalies over time</div>
            {hoveredPoint && (
              <span className="text-[11px] font-mono text-cyan-400 font-semibold bg-[#081522] px-2 py-0.5 rounded border border-[#132a42]">
                {hoveredPoint.day}: {hoveredPoint.count} anomalies
              </span>
            )}
          </div>

          {/* SVG Line / Area Chart */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="30" y1="20" x2="390" y2="20" stroke="#16293d" strokeDasharray="3 3" />
              <line x1="30" y1="55" x2="390" y2="55" stroke="#16293d" strokeDasharray="3 3" />
              <line x1="30" y1="90" x2="390" y2="90" stroke="#16293d" strokeDasharray="3 3" />
              <line x1="30" y1="125" x2="390" y2="125" stroke="#16293d" strokeDasharray="3 3" />

              {/* Y-axis labels */}
              <text x="5" y="24" fill="#586e82" fontSize="9" fontFamily="monospace">
                26
              </text>
              <text x="5" y="59" fill="#586e82" fontSize="9" fontFamily="monospace">
                22
              </text>
              <text x="5" y="94" fill="#586e82" fontSize="9" fontFamily="monospace">
                18
              </text>
              <text x="5" y="129" fill="#586e82" fontSize="9" fontFamily="monospace">
                14
              </text>

              {/* Area gradient */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Smooth curve matching PDF */}
              <path
                d="M 40 120 Q 80 135 120 125 T 200 80 T 280 110 T 360 40 L 360 145 L 40 145 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M 40 120 Q 80 135 120 125 T 200 80 T 280 110 T 360 40"
                fill="none"
                stroke="#00b4d8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Point Circles */}
              {[
                { cx: 40, cy: 120, day: '27 Apr', count: 15 },
                { cx: 93, cy: 128, day: '28 Apr', count: 14 },
                { cx: 146, cy: 115, day: '29 Apr', count: 16 },
                { cx: 200, cy: 80, day: '30 Apr', count: 20 },
                { cx: 253, cy: 105, day: '1 May', count: 17 },
                { cx: 306, cy: 75, day: '2 May', count: 21 },
                { cx: 360, cy: 40, day: '3 May', count: 26 },
              ].map((p, i) => (
                <circle
                  key={i}
                  cx={p.cx}
                  cy={p.cy}
                  r={hoveredPoint?.day === p.day ? 6 : 4}
                  fill="#00b4d8"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all hover:r-6"
                  onMouseEnter={() =>
                    setHoveredPoint({ day: p.day, count: p.count, date: `${p.day} • Survey Run` })
                  }
                />
              ))}
            </svg>

            {/* X-axis date labels */}
            <div className="flex justify-between text-[10px] font-mono text-[#586e82] px-6 mt-1">
              <span>27</span>
              <span>28</span>
              <span>29</span>
              <span>30</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </div>
        </div>

        {/* Right: Anomaly types Donut Chart (5 cols) */}
        <div className="md:col-span-5 bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-white mb-2">Anomaly types</div>

          {/* Donut chart */}
          <div className="flex items-center justify-center my-auto py-2">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#16293d" strokeWidth="12" />
                {/* Metal debris: Dark blue / cyan (35%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#0284c7"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="155"
                />
                {/* Fishing net: Sky blue (25%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#38bdf8"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="180"
                />
                {/* Rocks: Amber / orange (20%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f97316"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="190"
                />
                {/* Unknown: Yellow (12%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#eab308"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="210"
                />
                {/* Other: Grey/teal (8%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#64748b"
                  strokeWidth="12"
                  strokeDasharray="238.7"
                  strokeDashoffset="220"
                />
              </svg>
            </div>
          </div>

          {/* Legend matching PDF */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-[#8aa1b6] pt-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#0284c7]" />
              <span>Metal debris</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#38bdf8]" />
              <span>Fishing net</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#f97316]" />
              <span>Rocks</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#eab308]" />
              <span>Unknown</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#64748b]" />
              <span>Other</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Cards matching PDF Page 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Recent scans */}
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 space-y-2.5">
          <div className="text-xs font-semibold text-white">Recent scans</div>
          <div className="space-y-2">
            <div
              onClick={() => onNavigate('analyze', { scanId: 'scan-0248' })}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#08121d] hover:bg-[#112338] border border-[#16293d] cursor-pointer transition-colors group"
            >
              <span className="text-xs font-mono text-white group-hover:text-cyan-400 transition-colors">Scan_0248</span>
              <span className="text-xs font-mono text-[#ff6b6b]">High</span>
            </div>
            <div
              onClick={() => onNavigate('analyze', { scanId: 'scan-0247' })}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#08121d] hover:bg-[#112338] border border-[#16293d] cursor-pointer transition-colors group"
            >
              <span className="text-xs font-mono text-white group-hover:text-cyan-400 transition-colors">Scan_0247</span>
              <span className="text-xs font-mono text-[#2dd4bf]">Normal</span>
            </div>
          </div>
        </div>

        {/* Right: Alerts */}
        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 space-y-2.5">
          <div className="text-xs font-semibold text-white">Alerts</div>
          <div className="space-y-2">
            <div
              onClick={() => onNavigate('alerts')}
              className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#08121d] hover:bg-[#112338] border border-[#16293d] cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff6b6b] shrink-0" />
              <span className="text-xs text-white truncate">
                High priority anomaly in Scan_0246
              </span>
            </div>
            <div
              onClick={() => onNavigate('alerts')}
              className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#08121d] hover:bg-[#112338] border border-[#16293d] cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs text-white truncate">
                Model updated successfully
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
