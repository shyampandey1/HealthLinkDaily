/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ClipboardList, Package, Users, UserCheck, Menu, Activity, ShieldAlert, ChevronLeft, ChevronRight, Sun, Moon, Compass, LogOut, Settings } from 'lucide-react';
import Header from './components/Header';
import BottomNav, { TabType } from './components/BottomNav';
import DailyReportView from './components/DailyReportView';
import InventoryView from './components/InventoryView';
import PatientsView from './components/PatientsView';
import StaffView from './components/StaffView';
import GeoHotspotView, { GeoScan } from './components/GeoHotspotView';
import ClinicInfoModal from './components/ClinicInfoModal';
import GlassmorphicPrompt, { PromptConfig } from './components/GlassmorphicPrompt';
import AuthView from './components/AuthView';
import PatientDashboardView from './components/PatientDashboardView';
import { initialStockItems, initialPatients, initialStaffMembers, initialReportsHistory } from './data/initialData';
import { StockItem, Patient, StaffMember, DailyReport } from './types';
import { isFirebaseReady } from './config/firebase';
import {
  getFirestoreInventory,
  saveFirestoreInventoryItem,
  deleteFirestoreInventoryItem,
  getFirestorePatients,
  saveFirestorePatient,
  deleteFirestorePatient,
  getFirestoreStaff,
  saveFirestoreStaffMember,
  deleteFirestoreStaffMember,
  getFirestoreReports,
  saveFirestoreReport
} from './services/firebaseService';

const initialGeoScans: GeoScan[] = [
  {
    id: 'scan-1',
    medicineName: 'Ringer\'s Lactate Infusion 500ml',
    batchNumber: 'RL-88219',
    expiryDate: '06/2028',
    itemType: 'drip',
    qty: 60,
    lat: 28.5355,
    lng: 77.3910,
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    confidence: 0.98,
    verbalLog: 'Captured sixty Ringers Lactate infusions for emergency ward',
    operator: 'belaur2008@gmail.com'
  },
  {
    id: 'scan-2',
    medicineName: 'NaCl 0.9% Normal Saline',
    batchNumber: 'NS-7721',
    expiryDate: '11/2027',
    itemType: 'drip',
    qty: 120,
    lat: 28.4595,
    lng: 77.0266,
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    confidence: 0.96,
    verbalLog: 'Add hundred and twenty units of saline bottles',
    operator: 'belaur2008@gmail.com'
  },
  {
    id: 'scan-3',
    medicineName: 'Ceftriaxone 1g Injection',
    batchNumber: 'CFT-91024',
    expiryDate: '03/2027',
    itemType: 'vial',
    qty: 80,
    lat: 28.8955,
    lng: 76.6066,
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    confidence: 0.94,
    verbalLog: 'Logged eighty Ceftriaxone injection vials at Rohtak base',
    operator: 'belaur2008@gmail.com'
  },
  {
    id: 'scan-4',
    medicineName: 'Paracetamol 500mg Strip',
    batchNumber: 'B-P500-112',
    expiryDate: '04/2028',
    itemType: 'tablet',
    qty: 350,
    lat: 28.4089,
    lng: 77.3178,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    confidence: 0.97,
    verbalLog: 'Registered three hundred and fifty paracetamol tablet strips',
    operator: 'belaur2008@gmail.com'
  },
  {
    id: 'scan-5',
    medicineName: 'Dextrose 5% Infusion',
    batchNumber: 'DXT-551',
    expiryDate: '09/2029',
    itemType: 'drip',
    qty: 45,
    lat: 28.6924,
    lng: 76.9240,
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    confidence: 0.95,
    verbalLog: 'Dextrose five percent injection forty five bottles',
    operator: 'belaur2008@gmail.com'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [languageMode, setLanguageMode] = useState<'english' | 'hindi' | 'bilingual'>('bilingual');

  // States for sidebar collapsible behavior and dark mode
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('hl_sidebar_collapsed') === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('hl_dark_mode') === 'true';
  });

  // Load from local storage or fall back to seeded initial clinical data
  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('hl_stock_items');
    return saved ? JSON.parse(saved) : initialStockItems;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('hl_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('hl_staff_members');
    return saved ? JSON.parse(saved) : initialStaffMembers;
  });

  const [reportsHistory, setReportsHistory] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('hl_reports_history');
    return saved ? JSON.parse(saved) : initialReportsHistory;
  });

  const [geoScans, setGeoScans] = useState<GeoScan[]>(() => {
    const saved = localStorage.getItem('hl_geo_scans');
    return saved ? JSON.parse(saved) : initialGeoScans;
  });

  // Session / Auth States
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'worker' | 'patient';
    associated_id?: string;
    facility_name?: string;
  } | null>(() => {
    const saved = localStorage.getItem('hl_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('hl_auth_token') || null;
  });

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('hl_session_user');
    localStorage.removeItem('hl_auth_token');
  };

  const handleLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('hl_session_user', JSON.stringify(user));
    localStorage.setItem('hl_auth_token', token);
  };

  // Lifted pending report states
  const [reportNotes, setReportNotes] = useState<string>(() => {
    return localStorage.getItem('hl_pending_report_notes') || '';
  });

  const [manualOPDOffset, setManualOPDOffset] = useState<number>(() => {
    const saved = localStorage.getItem('hl_pending_opd_offset');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [manualIPDOffset, setManualIPDOffset] = useState<number>(() => {
    const saved = localStorage.getItem('hl_pending_ipd_offset');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Prompt configuration state
  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    isOpen: false,
    type: 'transfer',
    title: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const openPrompt = (
    type: PromptConfig['type'],
    title: string,
    extra: { patientId?: string; patientName?: string; itemId?: string; itemName?: string },
    onConfirm: (data: any) => void
  ) => {
    setPromptConfig({
      isOpen: true,
      type,
      title,
      ...extra,
      onConfirm: (data) => {
        onConfirm(data);
        setPromptConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setPromptConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Sync to local storage when state changes
  useEffect(() => {
    localStorage.setItem('hl_stock_items', JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem('hl_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('hl_staff_members', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('hl_reports_history', JSON.stringify(reportsHistory));
  }, [reportsHistory]);

  useEffect(() => {
    localStorage.setItem('hl_geo_scans', JSON.stringify(geoScans));
  }, [geoScans]);

  useEffect(() => {
    localStorage.setItem('hl_pending_report_notes', reportNotes);
  }, [reportNotes]);

  useEffect(() => {
    localStorage.setItem('hl_pending_opd_offset', manualOPDOffset.toString());
  }, [manualOPDOffset]);

  useEffect(() => {
    localStorage.setItem('hl_pending_ipd_offset', manualIPDOffset.toString());
  }, [manualIPDOffset]);

  useEffect(() => {
    localStorage.setItem('hl_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hl_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hl_dark_mode', 'false');
    }
  }, [isDarkMode]);

  // Fetch initial datasets from FastAPI backend or Firestore on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      if (isFirebaseReady) {
        try {
          console.log("[Firebase Connection] Fetching clinical databases from Firestore...");
          const [inv, pat, staff, rep] = await Promise.all([
            getFirestoreInventory(),
            getFirestorePatients(),
            getFirestoreStaff(),
            getFirestoreReports()
          ]);
          if (inv.length > 0) setStockItems(inv);
          if (pat.length > 0) setPatients(pat);
          if (staff.length > 0) setStaffMembers(staff);
          if (rep.length > 0) setReportsHistory(rep);
        } catch (err) {
          console.warn("[Firebase Connection] Firestore query failed.", err);
        }
      } else {
        console.warn("Firebase is not initialized. Using initial mocked data.");
      }
    };
    fetchInitialData();
  }, []);

  // Database Synchronization Wrappers to intercept state changes and save to backend & Firestore
  const syncStockItems = async (updater: any) => {
    let next: StockItem[];
    if (typeof updater === 'function') {
      next = updater(stockItems);
    } else {
      next = updater;
    }
    
    // Detect added, deleted or modified stock
    // Detect added, deleted or modified stock
    if (next.length > stockItems.length) {
      const added = next.find(n => !stockItems.some(s => s.id === n.id));
      if (added && isFirebaseReady) {
        try { await saveFirestoreInventoryItem(added); } catch (e) { console.error("Firestore sync error:", e); }
      }
    } else if (next.length < stockItems.length) {
      const deleted = stockItems.find(s => !next.some(n => n.id === s.id));
      if (deleted && isFirebaseReady) {
        try { await deleteFirestoreInventoryItem(deleted.id); } catch (e) { console.error("Firestore sync error:", e); }
      }
    } else {
      for (const n of next) {
        const prev = stockItems.find(s => s.id === n.id);
        if (prev && (prev.count !== n.count || prev.criticalThreshold !== n.criticalThreshold)) {
          if (isFirebaseReady) {
            try { await saveFirestoreInventoryItem(n); } catch (e) { console.error("Firestore sync error:", e); }
          }
        }
      }
    }
    setStockItems(next);
  };

  const syncPatients = async (updater: any) => {
    let next: Patient[];
    if (typeof updater === 'function') {
      next = updater(patients);
    } else {
      next = updater;
    }

    if (next.length > patients.length) {
      const added = next.find(n => !patients.some(s => s.id === n.id));
      if (added && isFirebaseReady) {
        try { await saveFirestorePatient(added); } catch (e) { console.error("Firestore sync error:", e); }
      }
    } else if (next.length < patients.length) {
      const deleted = patients.find(s => !next.some(n => n.id === s.id));
      if (deleted && isFirebaseReady) {
        try { await deleteFirestorePatient(deleted.id); } catch (e) { console.error("Firestore sync error:", e); }
      }
    } else {
      for (const n of next) {
        const prev = patients.find(s => s.id === n.id);
        if (prev && JSON.stringify(prev) !== JSON.stringify(n)) {
          if (isFirebaseReady) {
            try { await saveFirestorePatient(n); } catch (e) { console.error("Firestore sync error:", e); }
          }
        }
      }
    }
    setPatients(next);
  };

  const syncStaff = async (updater: any) => {
    let next: StaffMember[];
    if (typeof updater === 'function') {
      next = updater(staffMembers);
    } else {
      next = updater;
    }

    for (const n of next) {
      const prev = staffMembers.find(s => s.id === n.id);
      if (prev && JSON.stringify(prev) !== JSON.stringify(n)) {
        if (isFirebaseReady) {
          try { await saveFirestoreStaffMember(n); } catch (e) { console.error("Firestore sync error:", e); }
        }
      }
    }
    setStaffMembers(next);
  };

  // Handle Full Database Reset
  const handleResetData = async () => {
    // Only resets local state and local storage when serverless
    console.log("[HealthLink API] Resetting local sandbox states...");

    setStockItems(initialStockItems);
    setPatients(initialPatients);
    setStaffMembers(initialStaffMembers);
    setReportsHistory(initialReportsHistory);
    setGeoScans(initialGeoScans);
    setReportNotes('');
    setManualOPDOffset(0);
    setManualIPDOffset(0);
    localStorage.clear();
  };

  // Submit Shift Report to backend
  const handleSubmitReport = async (notes?: string) => {
    const activePatientsOPD = Math.max(0, patients.filter(p => p.type === 'OPD').length + manualOPDOffset);
    const activePatientsIPD = Math.max(0, patients.filter(p => p.type === 'IPD').length + manualIPDOffset);

    const reportPayload = {
      date: new Date().toISOString().split('T')[0],
      stockCounts: stockItems.map(item => ({ itemId: item.id, count: item.count })),
      footfall: {
        opd: activePatientsOPD,
        ipd: activePatientsIPD,
      },
      staffAttendance: staffMembers.map(staff => ({ staffId: staff.id, present: staff.active })),
      submittedBy: 'belaur2008@gmail.com',
      notes,
    };

    const newReport: DailyReport = {
      id: `rep-${Date.now()}`,
      date: reportPayload.date,
      stockCounts: reportPayload.stockCounts,
      footfall: reportPayload.footfall,
      staffAttendance: reportPayload.staffAttendance,
      submittedBy: currentUser?.username || reportPayload.submittedBy,
      submittedAt: new Date().toISOString(),
      notes: notes || '',
    };

    if (isFirebaseReady) {
      try {
        await saveFirestoreReport(newReport);
        console.log('[Firebase Connection] Shift report saved to Firestore.');
        const reps = await getFirestoreReports();
        if (reps.length > 0) setReportsHistory(reps);
      } catch (err) {
        console.error('[Firebase Connection] Failed to sync report to Firestore:', err);
      }
    }

    // Always update local state immediately
    setReportsHistory(prev => [newReport, ...prev]);

    // Clear pending inputs upon successful submission
    setReportNotes('');
    setManualOPDOffset(0);
    setManualIPDOffset(0);
  };

  if (!currentUser || !authToken) {
    return <AuthView onLoginSuccess={handleLoginSuccess} languageMode={languageMode} />;
  }

  if (currentUser.role === 'patient') {
    return (
      <PatientDashboardView
        patientId={currentUser.associated_id || ''}
        username={currentUser.username}
        patientName={currentUser.name}
        onLogout={handleLogout}
        languageMode={languageMode}
      />
    );
  }

  return (
    <div 
      id="app-root-container"
      className="bg-background text-on-background h-screen overflow-hidden flex flex-col md:flex-row font-sans antialiased relative transition-colors duration-200"
    >
      {/* Responsive Left Sidebar for Tablets & Desktops */}
      <aside 
        id="desktop-sidebar"
        className={`hidden md:flex flex-col bg-white/70 backdrop-blur-xl border-r border-outline-variant shrink-0 select-none p-6 justify-between transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-20 px-3' : 'w-72'
        }`}
      >
        <div className="space-y-8">
          {/* Brand/App Title Card */}
          <div className={`flex ${isSidebarCollapsed ? 'flex-col-reverse items-center gap-4' : 'items-center justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-white font-black text-lg shadow-md shadow-secondary/20 shrink-0">
                <Activity className="w-5 h-5 text-white animate-pulse" />
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-fadeIn">
                  <h1 className="font-sans text-base font-bold text-primary tracking-tight leading-none">
                    HealthLink Daily
                  </h1>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1 block">
                    Primary Care Log
                  </span>
                </div>
              )}
            </div>

            {/* Hamburger Collapse/Expand Toggle */}
            <button
              id="btn-sidebar-collapse"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex items-center justify-center w-10 h-10 hover:bg-surface-container transition-colors rounded-full text-on-surface-variant cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'reports' as TabType, icon: ClipboardList, label: languageMode === 'hindi' ? 'रिपोर्ट्स' : 'Reports' },
              { id: 'inventory' as TabType, icon: Package, label: languageMode === 'hindi' ? 'स्टॉक' : 'Inventory' },
              { id: 'patients' as TabType, icon: Users, label: languageMode === 'hindi' ? 'मरीज' : 'Patients' },
              { id: 'staff' as TabType, icon: UserCheck, label: languageMode === 'hindi' ? 'स्टाफ' : 'Staff' },
              { id: 'geo-hotspot' as TabType, icon: Compass, label: languageMode === 'hindi' ? 'हॉटस्पॉट' : 'Hotspots' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-button-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex items-center rounded-xl transition-all duration-200 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    isSidebarCollapsed 
                      ? 'justify-center w-12 h-12 mx-auto' 
                      : 'gap-3.5 px-4 py-3 w-full'
                  } ${
                    isActive 
                      ? 'bg-secondary text-white shadow-md shadow-secondary/15 scale-[1.02]' 
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                  {!isSidebarCollapsed && <span className="animate-fadeIn truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Mini Live Metrics Panel */}
          {!isSidebarCollapsed && (
            <div className="bg-surface-container-low/60 rounded-2xl p-4 border border-outline-variant/50 space-y-3 animate-fadeIn">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block border-b border-outline-variant/30 pb-1">
                Active Shift Status
              </span>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                  <span className="text-[9px] text-on-surface-variant font-bold block">PATIENTS</span>
                  <span className="font-mono text-sm font-extrabold text-primary">{patients.length}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                  <span className="text-[9px] text-on-surface-variant font-bold block">STAFF</span>
                  <span className="font-mono text-sm font-extrabold text-emerald-700">{staffMembers.filter(s => s.active).length} ON</span>
                </div>
              </div>
              {stockItems.some(i => i.count <= i.criticalThreshold) && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-700 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Supply alerts active!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-outline-variant/60 pt-4 space-y-3">
          {!isSidebarCollapsed ? (
            <div className="text-[10px] font-mono text-on-surface-variant/80 animate-fadeIn">
              <p className="font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                SYSTEM OPERATIONAL
              </p>
              <p className="mt-1">ID: {currentUser.username} ({currentUser.role.toUpperCase()})</p>
              <p className="mt-0.5">Name: {currentUser.name}</p>
              {currentUser.facility_name && <p className="mt-0.5 font-bold text-secondary truncate">{currentUser.facility_name}</p>}
            </div>
          ) : (
            <div className="flex justify-center" title={`SYSTEM OPERATIONAL: ${currentUser.username}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
          )}

          {/* Action Row */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-around'} pt-1`}>
            {/* Gear Icon (Settings) */}
            <button
              id="sidebar-btn-open-info"
              onClick={() => setActiveTab('settings')}
              title="Control Panel & Settings"
              className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors border border-outline-variant/30 cursor-pointer"
            >
              <Settings className="w-4.5 h-4.5 animate-spin-slow" />
            </button>

            {/* Logout button */}
            <button
              id="sidebar-btn-logout"
              onClick={handleLogout}
              title="Sign Out"
              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors border border-red-200 dark:border-red-900/50 cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Right Content Pane */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Application Header */}
        <Header 
          languageMode={languageMode} 
          setLanguageMode={setLanguageMode} 
          isInfoOpen={activeTab === 'settings'}
          onToggleInfo={() => setActiveTab(activeTab === 'settings' ? 'reports' : 'settings')}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        {activeTab === 'settings' ? (
          <div className="flex-1 overflow-hidden relative">
            <ClinicInfoModal
              isOpen={true}
              onClose={() => setActiveTab('reports')}
              userEmail="belaur2008@gmail.com"
              onResetData={handleResetData}
              stockCount={stockItems.length}
              patientsCount={patients.length}
              staffCount={staffMembers.length}
              reportsCount={reportsHistory.length}
              onNavigateToTab={setActiveTab}
              openPrompt={openPrompt}
            />
          </div>
        ) : (
          <main 
            id="main-app-content"
            className="flex-1 overflow-y-auto px-6 pt-5 pb-24 md:pb-8 flex flex-col gap-6 w-full max-w-7xl mx-auto"
          >
            {activeTab === 'reports' && (
              <DailyReportView
                stockItems={stockItems}
                setStockItems={syncStockItems}
                patients={patients}
                staffMembers={staffMembers}
                setStaffMembers={syncStaff}
                reportsHistory={reportsHistory}
                onSubmitReport={handleSubmitReport}
                languageMode={languageMode}
                openPrompt={openPrompt}
                notes={reportNotes}
                setNotes={setReportNotes}
                manualOPDOffset={manualOPDOffset}
                setManualOPDOffset={setManualOPDOffset}
                manualIPDOffset={manualIPDOffset}
                setManualIPDOffset={setManualIPDOffset}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                stockItems={stockItems}
                setStockItems={syncStockItems}
                languageMode={languageMode}
                openPrompt={openPrompt}
                onAddGeoScan={(newScan) => {
                  setGeoScans(prev => [
                    {
                      id: `scan-${Date.now()}`,
                      ...newScan,
                      timestamp: new Date().toISOString(),
                      operator: 'belaur2008@gmail.com'
                    },
                    ...prev
                  ]);
                }}
              />
            )}

            {activeTab === 'geo-hotspot' && (
              <GeoHotspotView
                geoScans={geoScans}
                setGeoScans={setGeoScans}
                stockItems={stockItems}
                setStockItems={syncStockItems}
                languageMode={languageMode}
                openPrompt={openPrompt}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsView
                patients={patients}
                setPatients={syncPatients}
                languageMode={languageMode}
                openPrompt={openPrompt}
              />
            )}

            {activeTab === 'staff' && (
              <StaffView
                staffMembers={staffMembers}
                setStaffMembers={syncStaff}
                languageMode={languageMode}
                openPrompt={openPrompt}
              />
            )}
          </main>
        )}

      {/* Footer Tab Navigation Bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        languageMode={languageMode} 
      />

      {/* Centralized Glassmorphism Prompts and Confirmations */}
      <GlassmorphicPrompt 
        config={promptConfig} 
        languageMode={languageMode} 
      />
      </div>
    </div>
  );
}
