import React, { useState } from 'react';
import { UserCheck, Shield, Sliders, Bell, Check, Sparkles, SlidersHorizontal, Save } from 'lucide-react';
import { OperatorProfile } from '../App';

interface SettingsTabProps {
  operator?: OperatorProfile;
  onUpdateOperator?: (updated: OperatorProfile) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  operator = {
    name: 'Ocean explorer',
    role: 'Admin',
    email: 'explorer@aquanex.ocean',
    organization: 'National Institute of Ocean Technology',
  },
  onUpdateOperator,
  onShowToast,
}) => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [classes, setClasses] = useState([
    { id: 'metal', name: 'Metal debris', weight: 80, dotColor: '#ef4444', enabled: true },
    { id: 'net', name: 'Fishing net', weight: 75, dotColor: '#f97316', enabled: true },
    { id: 'rock', name: 'Rock / boulder', weight: 25, dotColor: '#38bdf8', enabled: true },
    { id: 'shipwreck', name: 'Shipwreck', weight: 60, dotColor: '#818cf8', enabled: true },
  ]);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(operator.name);
  const [editRole, setEditRole] = useState(operator.role);
  const [editEmail, setEditEmail] = useState(operator.email);

  const handleSaveProfile = () => {
    if (onUpdateOperator) {
      onUpdateOperator({
        ...operator,
        name: editName.trim() || 'Ocean explorer',
        role: editRole.trim() || 'Admin',
        email: editEmail.trim() || 'explorer@aquanex.ocean',
      });
    }
    setShowProfileModal(false);
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight: newWeight } : c))
    );
  };

  const handleSaveWeights = () => {
    if (onShowToast) {
      onShowToast('Classifier thresholds & weights calibrated.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title & Subtitle matching PDF Page 4 Bottom */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            System & sensor configuration
          </h1>
          <p className="text-xs text-[#71879c] mt-1">
            Configure detection classes, acoustic thresholds, and account preferences.
          </p>
        </div>

        <button
          onClick={handleSaveWeights}
          className="self-start sm:self-auto bg-[#00a3c4] hover:bg-[#0092b0] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-950/40"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Thresholds</span>
        </button>
      </div>

      {/* Target detection classes (2x2 Grid) matching PDF */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white">Target detection classes</div>
          <span className="text-[11px] text-[#6c8299]">Acoustic priority weights (0-100)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-[#223e5e] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: cls.dotColor }}
                  />
                  <span className="text-xs font-semibold text-white">{cls.name}</span>
                </div>
                <div className="text-[11px] text-cyan-400 font-mono font-bold bg-[#071320] px-2 py-0.5 rounded border border-[#132b45]">
                  Weight {cls.weight}
                </div>
              </div>

              {/* Interactive slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={cls.weight}
                  onChange={(e) => handleWeightChange(cls.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#16293e] rounded-lg appearance-none cursor-pointer accent-[#00a3c4]"
                />
                <div className="flex justify-between text-[10px] text-[#556d82] font-mono">
                  <span>Low Risk (10)</span>
                  <span>Critical Risk (100)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Section matching PDF */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-white">Account</div>

        <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-cyan-500/30">
              {operator.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'OE'}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{operator.name}</div>
              <div className="text-[11px] text-[#6c8299] font-mono">{operator.role} • {operator.email}</div>
            </div>
          </div>

          <button
            onClick={() => {
              setEditName(operator.name);
              setEditRole(operator.role);
              setEditEmail(operator.email);
              setShowProfileModal(true);
            }}
            className="border border-[#203c5a] hover:border-[#00a3c4] text-[#8da2b5] hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Email alerts preference matching PDF */}
      <div className="bg-[#0d1b2a] border border-[#182d43] rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs text-white font-medium block">
            Email alerts for high-priority detections
          </span>
          <span className="text-[11px] text-[#6c8299] mt-0.5 block">
            Immediate dispatch to {operator.email} upon anomaly severity &ge; 75
          </span>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={(e) => {
              setEmailAlerts(e.target.checked);
              if (onShowToast) {
                onShowToast(
                  e.target.checked
                    ? 'High-priority email alerts enabled.'
                    : 'Email alerts disabled.',
                  'info'
                );
              }
            }}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-[#16283d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00a3c4]" />
        </label>
      </div>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1b2a] border border-[#1b3149] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-white">Edit Operator Profile</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8da2b5] mb-1">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#08121e] border border-[#182d43] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[#8da2b5] mb-1">Role / Designation</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-[#08121e] border border-[#182d43] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[#8da2b5] mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#08121e] border border-[#182d43] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-xs text-[#6c8299] hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="bg-[#00a3c4] hover:bg-[#0092b0] text-white text-xs font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-cyan-950/40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
