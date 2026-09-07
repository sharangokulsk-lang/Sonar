import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Plus,
  Radio,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Waves,
} from 'lucide-react';
import { Mission, SurveySession, SonarScan } from '../types';
import { storageService } from '../services/storageService';

interface MissionsSessionsViewProps {
  viewMode: 'missions' | 'sessions';
  missions: Mission[];
  sessions: SurveySession[];
  scans: SonarScan[];
  onNavigate: (tab: string) => void;
  onSelectScan: (scanId: string) => void;
}

export const MissionsSessionsView: React.FC<MissionsSessionsViewProps> = ({
  viewMode,
  missions,
  sessions,
  scans,
  onNavigate,
  onSelectScan,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMissionName, setNewMissionName] = useState('');
  const [newMissionCode, setNewMissionCode] = useState('');
  const [newSurveyArea, setNewSurveyArea] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('AUV-MAYUR-03');
  const [newVehicleType, setNewVehicleType] = useState<'AUV' | 'ROV' | 'TOWFISH' | 'USV'>('AUV');
  const [newOperator, setNewOperator] = useState('Lt. Cdr. S. Gokul');
  const [newNotes, setNewNotes] = useState('');

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionName) return;

    const mission: Mission = {
      id: `mission-${Date.now()}`,
      userId: 'op-sih-2026-lead',
      missionName: newMissionName,
      missionCode: newMissionCode || `IN-SURV-${Date.now().toString().slice(-4)}`,
      surveyArea: newSurveyArea || 'Coastal Territorial Waters',
      startTime: new Date().toISOString(),
      vehicleId: newVehicleId,
      vehicleType: newVehicleType,
      operator: newOperator,
      notes: newNotes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      totalScans: 0,
      totalDetections: 0,
    };

    await storageService.createMission(mission);
    setShowCreateModal(false);
    setNewMissionName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold">
                OPERATIONAL DEPLOYMENTS
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {viewMode === 'missions'
                  ? 'Hydrographic Survey Missions'
                  : 'Active Survey Sessions & Transects'}
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Campaign coordination for autonomous underwater vehicles, towfish swaths, and multi-transect acoustic mapping.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors flex items-center space-x-1.5 shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{viewMode === 'missions' ? 'Create New Mission' : 'Start New Session'}</span>
          </button>
        </div>
      </div>

      {/* Missions View */}
      {viewMode === 'missions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {missions.map((m) => {
            const missionScans = scans.filter((s) => s.missionId === m.id);
            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {m.missionCode}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{m.missionName}</h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{m.surveyArea}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      m.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-lg text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">VEHICLE / SENSOR</span>
                    <span className="text-white">
                      {m.vehicleId} ({m.vehicleType})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">OPERATOR IN CHARGE</span>
                    <span className="text-white">{m.operator}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block text-[10px]">INGESTED SWATHS</span>
                    <span className="text-cyan-400 font-bold">{missionScans.length}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block text-[10px]">TOTAL DETECTIONS</span>
                    <span className="text-orange-400 font-bold">{m.totalDetections || 0}</span>
                  </div>
                </div>

                {m.notes && <p className="text-xs text-slate-400 italic">"{m.notes}"</p>}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500">
                    Created {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onNavigate('upload')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    + Upload Swath to Mission &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Survey Sessions View */}
      {viewMode === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Session Code</th>
                    <th className="py-3 px-4">Mission Reference</th>
                    <th className="py-3 px-4">Ping Count</th>
                    <th className="py-3 px-4">Swath Width</th>
                    <th className="py-3 px-4">Frequency</th>
                    <th className="py-3 px-4">Sound Speed</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sessions.map((ses) => (
                    <tr key={ses.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">{ses.sessionCode}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{ses.missionId}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400">
                        {ses.pingCount.toLocaleString()} pings
                      </td>
                      <td className="py-3 px-4 font-mono">{ses.swathWidthMeters} m</td>
                      <td className="py-3 px-4 font-mono">{ses.frequencyKhz} kHz</td>
                      <td className="py-3 px-4 font-mono">{ses.soundSpeedMps} m/s</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            ses.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ses.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Mission */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Initialize Hydrographic Mission</span>
            </h3>

            <form onSubmit={handleCreateMission} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mission Name
                </label>
                <input
                  type="text"
                  required
                  value={newMissionName}
                  onChange={(e) => setNewMissionName(e.target.value)}
                  placeholder="e.g. Cochin Harbor Acoustic Dredge Audit"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mission Code
                  </label>
                  <input
                    type="text"
                    value={newMissionCode}
                    onChange={(e) => setNewMissionCode(e.target.value)}
                    placeholder="IN-COH-26"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Survey Vehicle Type
                  </label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="AUV">AUV (Autonomous Underwater Vehicle)</option>
                    <option value="TOWFISH">Towfish Side-Scan Array</option>
                    <option value="ROV">ROV (Remotely Operated Vehicle)</option>
                    <option value="USV">USV (Unmanned Surface Vessel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Survey Area / Nautical Coordinates
                </label>
                <input
                  type="text"
                  value={newSurveyArea}
                  onChange={(e) => setNewSurveyArea(e.target.value)}
                  placeholder="e.g. Cochin Outer Approach KM 04-12"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Mission objectives, trawl hazards, bathymetric parameters..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Save Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
