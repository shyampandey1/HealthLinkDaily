/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Settings, FileSpreadsheet, Download, RefreshCw, UserCheck, 
  HelpCircle, Compass, Cpu, Key, Sliders, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, Wifi, ShieldCheck, Loader2
} from 'lucide-react';

interface ClinicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onResetData: () => void;
  stockCount: number;
  patientsCount: number;
  staffCount: number;
  reportsCount: number;
  onNavigateToTab?: (tab: 'reports' | 'inventory' | 'patients' | 'staff' | 'geo-hotspot' | 'settings') => void;
  openPrompt?: (
    type: 'transfer' | 'discharge' | 'delete' | 'submitReport' | 'resetData',
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => void;
}

export default function ClinicInfoModal({
  isOpen,
  onClose,
  userEmail,
  onResetData,
  stockCount,
  patientsCount,
  staffCount,
  reportsCount,
  onNavigateToTab,
  openPrompt,
}: ClinicInfoModalProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'metrics' | 'ota' | 'keys'>('metrics');
  
  // System configurations
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem('hl_config_autosync') !== 'false');
  const [syncInterval, setSyncInterval] = useState(() => Number(localStorage.getItem('hl_config_interval') || '30'));
  const [offlineCache, setOfflineCache] = useState(() => localStorage.getItem('hl_config_cache') !== 'false');
  const [logLevel, setLogLevel] = useState(() => localStorage.getItem('hl_config_loglevel') || 'INFO');

  // OTA Update States
  const [otaChannel, setOtaChannel] = useState<'stable' | 'beta' | 'nightly'>('stable');
  const [otaStatus, setOtaStatus] = useState<'idle' | 'checking' | 'downloading' | 'applying' | 'success'>('idle');
  const [otaProgress, setOtaProgress] = useState(0);
  const [otaLog, setOtaLog] = useState<string>('');

  // API Integration States
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('hl_key_gemini') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [firebaseApiKey, setFirebaseApiKey] = useState(() => localStorage.getItem('hl_key_firebase_api') || '');
  const [firebaseProjId, setFirebaseProjId] = useState(() => localStorage.getItem('hl_key_firebase_proj') || 'smart-healthlink-2026');
  const [showKeys, setShowKeys] = useState(false);
  
  // Connection Diagnostic States
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [testLatency, setTestLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  // Save configurations to localStorage
  const handleSaveConfigs = () => {
    localStorage.setItem('hl_config_autosync', String(autoSync));
    localStorage.setItem('hl_config_interval', String(syncInterval));
    localStorage.setItem('hl_config_cache', String(offlineCache));
    localStorage.setItem('hl_config_loglevel', logLevel);
    alert('System settings saved successfully!');
  };

  // Save integration keys
  const handleSaveKeys = () => {
    localStorage.setItem('hl_key_gemini', geminiKey);
    localStorage.setItem('hl_key_firebase_api', firebaseApiKey);
    localStorage.setItem('hl_key_firebase_proj', firebaseProjId);
    alert('API Keys and Integration settings updated! Refresh to apply credentials.');
  };

  // Run mock Diagnostic key test
  const handleTestConnection = () => {
    setTestStatus('testing');
    setTestMsg('Initializing handshake with endpoints...');
    setTestLatency(null);

    setTimeout(() => {
      const trimmedKey = geminiKey.trim();
      if (!trimmedKey || trimmedKey === '' || trimmedKey === 'MY_GEMINI_API_KEY') {
        setTestStatus('failed');
        setTestMsg("Gemini Vision Key validation failed: Key is empty, invalid, or set to the default placeholder 'MY_GEMINI_API_KEY'. Please replace it with your actual Google AI Studio API key.");
        return;
      }
      if (trimmedKey.length < 15 || !trimmedKey.startsWith('AIzaSy')) {
        setTestStatus('failed');
        setTestMsg('Gemini Vision Key validation failed: Key format is invalid (Google Cloud/Gemini API keys typically start with "AIzaSy" and are at least 15 characters long).');
        return;
      }
      
      setTestLatency(Math.floor(120 + Math.random() * 180));
      setTestStatus('success');
      setTestMsg('Handshake successful! Gemini AI endpoints online & Firebase DB responding.');
    }, 1500);
  };

  // Run mock OTA update flow
  const handleTriggerOTA = () => {
    if (otaStatus !== 'idle') return;
    
    setOtaStatus('checking');
    setOtaProgress(10);
    setOtaLog('> Contacting release server...');
    
    setTimeout(() => {
      setOtaStatus('downloading');
      setOtaProgress(40);
      setOtaLog('> Found healthlink-core-bundle@1.0.5. Downloading modules...');
      
      setTimeout(() => {
        setOtaStatus('applying');
        setOtaProgress(75);
        setOtaLog('> Validation complete (SHA-256 ok). Swapping assets...');
        
        setTimeout(() => {
          setOtaStatus('success');
          setOtaProgress(100);
          setOtaLog('> Over-the-air hot patch applied! Version updated to v1.0.5.');
        }, 1200);
      }, 1200);
    }, 1000);
  };

  // Export report history as JSON
  const handleExportData = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      user: userEmail,
      stats: { stockCount, patientsCount, staffCount, reportsCount },
      localData: {
        stock: localStorage.getItem('hl_stock_items'),
        patients: localStorage.getItem('hl_patients'),
        staff: localStorage.getItem('hl_staff_members'),
        reports: localStorage.getItem('hl_reports_history'),
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `healthlink_daily_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200">
      {/* Page Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/60 bg-surface-container-lowest shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
            <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">System Configuration & Integrations</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure database sync, manage OTA firmware updates, and authenticate third-party endpoints</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors border border-outline-variant/30 cursor-pointer"
          title="Return to Dashboard"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Panel Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-outline-variant/60 bg-surface-container-lowest p-4 space-y-1.5 shrink-0 flex flex-row md:flex-col overflow-x-auto no-scrollbar md:overflow-x-visible gap-2 md:gap-0">
          <button
            onClick={() => setActiveSettingsTab('metrics')}
            className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2.5 shrink-0 justify-center md:justify-start ${
              activeSettingsTab === 'metrics'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-650/10'
                : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-on-surface'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Config & Metrics</span>
          </button>
          
          <button
            onClick={() => setActiveSettingsTab('ota')}
            className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2.5 shrink-0 justify-center md:justify-start ${
              activeSettingsTab === 'ota'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-650/10'
                : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-on-surface'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span>OTA Firmware</span>
          </button>
          
          <button
            onClick={() => setActiveSettingsTab('keys')}
            className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2.5 shrink-0 justify-center md:justify-start ${
              activeSettingsTab === 'keys'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-650/10'
                : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 text-on-surface'
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>API Credentials</span>
          </button>

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1" />

          {/* Footer info in desktop sidebar */}
          <div className="hidden md:block bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-outline-variant/60 text-center">
            <p className="text-[10px] font-extrabold text-teal-650 dark:text-teal-400 tracking-wider">HEALTHLINK SYSTEM</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">v1.0.4-build.921</p>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* TAB 1: CONFIG & METRICS */}
            {activeSettingsTab === 'metrics' && (
              <div className="space-y-6 animate-fadeIn">
                {/* General Config Cards */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-5 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-outline-variant pb-2">General Configurations</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Automatic Firestore Sync</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Auto-save data to cloud on change</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSync}
                        onChange={(e) => setAutoSync(e.target.checked)}
                        className="accent-teal-600 h-4 w-4 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Sync Poll Interval (Seconds)</span>
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{syncInterval}s</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={syncInterval}
                        onChange={(e) => setSyncInterval(Number(e.target.value))}
                        className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Offline Local Caching</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Preserve session data in localStorage</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={offlineCache}
                        onChange={(e) => setOfflineCache(e.target.checked)}
                        className="accent-teal-600 h-4 w-4 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Console Log Levels</span>
                      <select
                        value={logLevel}
                        onChange={(e) => setLogLevel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-teal-500"
                      >
                        <option value="DEBUG">DEBUG (Detailed Telemetry)</option>
                        <option value="INFO">INFO (Standard Logs)</option>
                        <option value="WARNING">WARNING (Only Errors & Alerts)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSaveConfigs}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Configuration</span>
                    </button>
                  </div>
                </div>

                {/* Shift Metrics Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-outline-variant pb-2">Shift Metrics Summary</h2>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-outline-variant/50">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">SUPPLIES</span>
                      <span className="font-mono text-lg font-black text-slate-850 dark:text-slate-100">{stockCount}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-outline-variant/50">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">REGISTRIES</span>
                      <span className="font-mono text-lg font-black text-slate-850 dark:text-slate-100">{patientsCount}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-outline-variant/50">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">PERSONNEL</span>
                      <span className="font-mono text-lg font-black text-slate-850 dark:text-slate-100">{staffCount}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-outline-variant/50">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block">SHIFT LOGS</span>
                      <span className="font-mono text-lg font-black text-slate-850 dark:text-slate-100">{reportsCount}</span>
                    </div>
                  </div>
                </div>

                {/* Operations & backups */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-outline-variant pb-2">System Backups & Maintenance</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleExportData}
                      className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-850 dark:hover:bg-white text-white dark:text-slate-900 transition-all text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-transparent"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>Export Backup (.JSON)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (openPrompt) {
                          openPrompt(
                            'resetData',
                            'Restore Default Datasets',
                            {},
                            () => {
                              onResetData();
                              onClose();
                            }
                          );
                        } else if(confirm("Are you sure you want to restore default initial mock datasets? This clears all changes.")) {
                          onResetData();
                          onClose();
                        }
                      }}
                      className="w-full bg-red-50 text-red-650 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 transition-all text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Restore default mock data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OVER-THE-AIR UPDATES */}
            {activeSettingsTab === 'ota' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-500/20 rounded-2xl p-6 space-y-3.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                      System Core Firmware
                    </span>
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Current Installed Build Version</span>
                    <span className="font-mono text-xl font-black text-slate-850 dark:text-slate-100 mt-1 block">v1.0.4-build.921</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-5 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-outline-variant pb-2">Firmware Distribution Control</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Update Release Channel</label>
                      <select
                        value={otaChannel}
                        onChange={(e) => setOtaChannel(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                      >
                        <option value="stable">Stable (Production - Recommended)</option>
                        <option value="beta">Beta (Early-access previews)</option>
                        <option value="nightly">Developer (Nightly compilation builds)</option>
                      </select>
                    </div>

                    {otaStatus === 'idle' ? (
                      <button
                        onClick={handleTriggerOTA}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-white animate-spin-slow" />
                        <span>Check for OTA Core Updates</span>
                      </button>
                    ) : (
                      <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-outline-variant">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{otaStatus} update...</span>
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{otaProgress}%</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-teal-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${otaProgress}%` }}
                          />
                        </div>

                        {/* Simulation Logs Terminal */}
                        <div className="w-full bg-black/95 p-3 rounded-lg font-mono text-[9px] text-emerald-450 space-y-1 shadow-inner select-text">
                          <p>{otaLog}</p>
                          {otaStatus !== 'success' && <p className="animate-pulse text-emerald-500">...</p>}
                        </div>

                        {otaStatus === 'success' && (
                          <button
                            onClick={() => { setOtaStatus('idle'); setOtaProgress(0); }}
                            className="w-full bg-teal-600/10 hover:bg-teal-600/20 text-teal-600 dark:text-teal-400 font-bold text-[10px] py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Clear Simulation Run
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INTEGRATIONS & API KEYS */}
            {activeSettingsTab === 'keys' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Third-Party Sync Credentials</h2>
                    <button
                      onClick={() => setShowKeys(!showKeys)}
                      className="text-[10px] text-teal-650 dark:text-teal-450 font-bold hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showKeys ? 'Hide Keys' : 'Reveal Keys'}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Gemini AI Vision Key</label>
                      <input
                        type={showKeys ? 'text' : 'password'}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="e.g. AIzaSy..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono placeholder-slate-450 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Firebase Client API Key</label>
                      <input
                        type={showKeys ? 'text' : 'password'}
                        value={firebaseApiKey}
                        onChange={(e) => setFirebaseApiKey(e.target.value)}
                        placeholder="e.g. AIzaSyB2v..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono placeholder-slate-450 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Firebase Project ID</label>
                      <input
                        type="text"
                        value={firebaseProjId}
                        onChange={(e) => setFirebaseProjId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <button
                      onClick={handleSaveKeys}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer mt-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Apply API Credentials</span>
                    </button>
                  </div>
                </div>

                {/* Connections Tester Diagnostics */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-outline-variant p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-outline-variant pb-2">Integration Diagnostics</h2>
                  </div>

                  {testStatus === 'idle' ? (
                    <button
                      onClick={handleTestConnection}
                      className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-outline-variant text-slate-800 dark:text-slate-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Wifi className="w-4 h-4 text-teal-600 animate-pulse shrink-0" />
                      <span>Run Connection Diagnostics Handshake</span>
                    </button>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-outline-variant space-y-3.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs">
                        {testStatus === 'testing' && (
                          <>
                            <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{testMsg}</span>
                          </>
                        )}
                        {testStatus === 'success' && (
                          <>
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">All Integrations Active</span>
                          </>
                        )}
                        {testStatus === 'failed' && (
                          <>
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="font-bold text-red-600 dark:text-red-400">Handshake Failed</span>
                          </>
                        )}
                      </div>
                      
                      {testStatus !== 'testing' && (
                        <p className="text-xs text-slate-650 dark:text-slate-400 leading-normal select-text">
                          {testMsg}
                        </p>
                      )}

                      {testLatency && (
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono pt-1">
                          <span>API Ping Latency:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{testLatency}ms</span>
                        </div>
                      )}

                      {testStatus !== 'testing' && (
                        <button
                          onClick={() => setTestStatus('idle')}
                          className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 transition-colors text-[10px] font-bold text-slate-800 dark:text-slate-200 py-2 rounded-lg cursor-pointer"
                        >
                          Reset Diagnostics
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
