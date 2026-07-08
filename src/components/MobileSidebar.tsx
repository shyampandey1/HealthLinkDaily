import React from 'react';
import { 
  X, Activity, Settings, LogOut, Package, Users, UserCheck, 
  ClipboardList, Compass, MapPin, Map, Info, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { TabType } from './BottomNav';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: any;
  handleLogout: () => void;
  languageMode: string;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  handleLogout,
  languageMode
}: MobileSidebarProps) {
  if (!isOpen) return null;

  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-50 dark:bg-slate-950 shadow-2xl transition-transform duration-300 transform flex flex-col`}>
        
        {/* Header with Close */}
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">HealthLink</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Info */}
        <div className="p-5 border-b border-outline-variant/30 bg-white/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xl uppercase shadow-sm">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.name || 'User'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.username}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Main Menu</div>
            
            {[
              { id: 'reports' as TabType, icon: ClipboardList, label: languageMode === 'hindi' ? 'रिपोर्ट्स' : 'Reports & Dashboard' },
              { id: 'inventory' as TabType, icon: Package, label: languageMode === 'hindi' ? 'स्टॉक' : 'Medical Store' },
              { id: 'patients' as TabType, icon: Users, label: languageMode === 'hindi' ? 'मरीज' : 'Patient Registry' },
              { id: 'staff' as TabType, icon: UserCheck, label: languageMode === 'hindi' ? 'स्टाफ' : 'Staff Roster' }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 px-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">System</div>
            
            <button
              onClick={() => navigateTo('settings')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                activeTab === 'settings'
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4.5 h-4.5 ${activeTab === 'settings' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                <span className="text-sm">App Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            
            <button
              onClick={() => navigateTo('about' as TabType)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors ${
                activeTab === 'about'
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Info className={`w-4.5 h-4.5 ${activeTab === 'about' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                <span className="text-sm">About App</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/50 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 py-3 rounded-xl transition-colors font-bold text-sm border border-red-100 dark:border-red-900/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
        
      </div>
    </>
  );
}
