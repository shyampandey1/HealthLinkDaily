/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClipboardList, Package, Users, UserCheck, MapPin } from 'lucide-react';

export type TabType = 'reports' | 'inventory' | 'patients' | 'staff' | 'geo-hotspot' | 'settings' | 'about';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  languageMode: 'english' | 'hindi' | 'bilingual';
}

export default function BottomNav({ activeTab, setActiveTab, languageMode }: BottomNavProps) {
  
  const getLabel = (tab: TabType) => {
    switch (tab) {
      case 'reports':
        return languageMode === 'hindi' ? 'रिपोर्ट्स' : 'Reports';
      case 'inventory':
        return languageMode === 'hindi' ? 'स्टॉक' : 'Inventory';
      case 'patients':
        return languageMode === 'hindi' ? 'मरीज' : 'Patients';
      case 'staff':
        return languageMode === 'hindi' ? 'स्टाफ' : 'Staff';
    }
  };

  const navItems = [
    { id: 'reports' as TabType, icon: ClipboardList, label: getLabel('reports') },
    { id: 'inventory' as TabType, icon: Package, label: getLabel('inventory') },
    { id: 'patients' as TabType, icon: Users, label: getLabel('patients') },
    { id: 'staff' as TabType, icon: UserCheck, label: getLabel('staff') },
  ];

  return (
    <nav 
      id="bottom-navigation-bar"
      className="bg-surface-container-lowest/95 backdrop-blur-md fixed bottom-0 left-0 right-0 w-full z-40 h-20 border-t border-outline-variant shadow-lg flex md:hidden justify-center gap-10 items-center px-4 pb-4 shrink-0 select-none transition-colors duration-200 overflow-x-auto no-scrollbar"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            id={`tab-button-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer min-w-0 shrink ${
              isActive 
                ? 'bg-secondary-container text-on-secondary-container rounded-full px-3 py-1.5' 
                : 'text-on-surface-variant hover:bg-surface-container-low active:scale-95 px-1.5 py-1.5 rounded-full'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            <span className="text-[9px] sm:text-[10px] font-bold tracking-tight sm:tracking-wider uppercase mt-1 truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
