import React, { useState, useEffect } from 'react';
import { Sidebar, TabKey } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { RealTimeStreamTab } from './components/RealTimeStreamTab';
import { AnalyzeTab } from './components/AnalyzeTab';
import { DashboardTab } from './components/DashboardTab';
import { MissionMapTab } from './components/MissionMapTab';
import { ScanHistoryTab } from './components/ScanHistoryTab';
import { AlertsTab } from './components/AlertsTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { storageService } from './services/storageService';
import { SonarScan } from './types';
import { Menu, X, Radar, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertItem {
  id: string;
  title: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'info';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'DISMISSED';
  accentColor: string;
  scanId?: string;
}

export interface OperatorProfile {
  name: string;
  role: string;
  email: string;
  organization: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('map');
  const [selectedScanId, setSelectedScanId] = useState<string>('scan-0248');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [scans, setScans] = useState<SonarScan[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast notification system for tactile UX feedback
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Shared Operator Profile
  const [operator, setOperator] = useState<OperatorProfile>({
    name: 'Ocean explorer',
    role: 'Admin',
    email: 'explorer@aquanex.ocean',
    organization: 'National Institute of Ocean Technology',
  });

  // Shared Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alert-1',
      title: 'High priority anomaly detected in Scan_0246',
      timestamp: '11:42 AM',
      severity: 'high',
      status: 'PENDING',
      accentColor: '#f43f5e',
      scanId: 'scan-0246',
    },
    {
      id: 'alert-2',
      title: 'New scan requires verification — Scan_0246 has unconfirmed objects',
      timestamp: '09:29 AM',
      severity: 'medium',
      status: 'PENDING',
      accentColor: '#f59e0b',
      scanId: 'scan-0246',
    },
    {
      id: 'alert-3',
      title: 'System update completed — AI model updated successfully',
      timestamp: 'Yesterday',
      severity: 'info',
      status: 'DISMISSED',
      accentColor: '#0ea5e9',
    },
  ]);

  const unreadAlertsCount = alerts.filter((a) => a.status === 'PENDING').length;

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
    );
    showToast('Alert marked as acknowledged.', 'info');
  };

  const handleNavigate = (tab: TabKey, options?: { scanId?: string; targetId?: string }) => {
    setActiveTab(tab);
    if (options?.scanId) {
      setSelectedScanId(options.scanId);
    }
    if (options?.targetId) {
      setSelectedTargetId(options.targetId);
    }
  };

  useEffect(() => {
    const unsubScans = storageService.subscribeSonarScans((newScans) => {
      setScans(newScans);
    });

    return () => {
      unsubScans();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070e17] text-slate-100 flex font-sans antialiased selection:bg-cyan-500 selection:text-black relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#0d1f33] border border-cyan-500/40 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 backdrop-blur-md">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span className="font-medium tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Desktop Sidebar matching PDF */}
      <div className="hidden md:flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          unreadAlertsCount={unreadAlertsCount}
          operatorName={operator.name}
          operatorRole={operator.role}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/70 backdrop-blur-sm">
          <div className="relative flex-1 max-w-xs w-full bg-[#08121e]">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#6c8299] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                handleNavigate(tab);
                setMobileMenuOpen(false);
              }}
              unreadAlertsCount={unreadAlertsCount}
              operatorName={operator.name}
              operatorRole={operator.role}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-[#08121e] border-b border-[#152538] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00b4d8] to-[#0077b6] flex items-center justify-center text-white">
              <Radar className="w-4 h-4" />
            </div>
            <span className="font-bold text-white tracking-wide">AquaNex</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg text-[#8da2b5] hover:text-white hover:bg-[#112233]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Viewport content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
              scans={scans}
            />
          )}

          {activeTab === 'live' && (
            <RealTimeStreamTab
              onShowToast={showToast}
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
            />
          )}

          {activeTab === 'analyze' && (
            <AnalyzeTab
              scans={scans}
              selectedScanId={selectedScanId}
              initialTargetId={selectedTargetId}
              onShowToast={showToast}
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
              scans={scans}
            />
          )}

          {activeTab === 'map' && (
            <MissionMapTab
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
              scans={scans}
              onShowToast={showToast}
              operator={operator}
            />
          )}

          {activeTab === 'history' && (
            <ScanHistoryTab
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsTab
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onNavigate={(tab, opts) => handleNavigate(tab, opts)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              onShowToast={showToast}
              scans={scans}
              operator={operator}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              operator={operator}
              onUpdateOperator={(updated) => {
                setOperator(updated);
                showToast('Operator profile updated successfully.');
              }}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
