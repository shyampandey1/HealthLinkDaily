/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu, Globe, AlertCircle, Info, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  languageMode: 'english' | 'hindi' | 'bilingual';
  setLanguageMode: (mode: 'english' | 'hindi' | 'bilingual') => void;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
}

export default function Header({ languageMode, setLanguageMode, isInfoOpen, onToggleInfo, isDarkMode, setIsDarkMode }: HeaderProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleLangMenu = () => {
    setShowLangMenu(!showLangMenu);
  };

  const handleSelectMode = (mode: 'english' | 'hindi' | 'bilingual') => {
    setLanguageMode(mode);
    setShowLangMenu(false);
  };

  return (
    <header 
      id="app-header"
      className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-6 h-12 w-full z-50 shrink-0 sticky top-0 shadow-sm transition-colors duration-200 relative"
    >
      <button 
        id="btn-menu-info"
        onClick={onToggleInfo}
        aria-label="Application Information"
        className={`${
          isInfoOpen ? 'fixed top-1 left-6 z-[60]' : 'relative'
        } flex md:hidden flex-col justify-center items-center w-10 h-10 hover:bg-surface-container/50 transition-all duration-200 rounded-full text-on-surface-variant cursor-pointer z-50`}
      >
        <span 
          className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
            isInfoOpen ? 'rotate-45 translate-y-[6px]' : ''
          }`} 
        />
        <span 
          className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 my-[4px] ${
            isInfoOpen ? 'opacity-0' : ''
          }`} 
        />
        <span 
          className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ${
            isInfoOpen ? '-rotate-45 -translate-y-[6px]' : ''
          }`} 
        />
      </button>

      <h1 
        id="app-title"
        className="absolute left-1/2 -translate-x-1/2 font-sans text-lg font-bold text-primary tracking-tight select-none"
      >
        HealthLink Daily
      </h1>

      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* Mobile/Header Dark Mode Toggle */}
        <button
          id="header-btn-toggle-dark-mode"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-100 rounded-full text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
          ) : (
            <Moon className="w-5 h-5 text-slate-800 fill-slate-800" />
          )}
        </button>

        <div className="relative">
          <button 
            id="btn-language-selector"
            onClick={toggleLangMenu}
            aria-label="Change Language Mode"
            className="flex items-center justify-center w-10 h-10 hover:bg-surface-container transition-colors duration-100 rounded-full text-on-surface-variant cursor-pointer"
          >
            <Globe className="w-5 h-5" />
          </button>

          {showLangMenu && (
            <div 
              id="lang-dropdown-menu"
              className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-outline-variant shadow-lg rounded-lg z-20 py-1"
            >
              <div className="px-3 py-1.5 text-xs font-bold text-on-surface-variant border-b border-outline-variant">
                Language / भाषा
              </div>
              <button
                id="btn-lang-bilingual"
                onClick={() => handleSelectMode('bilingual')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container transition-colors flex items-center justify-between ${languageMode === 'bilingual' ? 'font-semibold text-secondary' : 'text-on-surface'}`}
              >
                <span>Bilingual (English/हिन्दी)</span>
              </button>
              <button
                id="btn-lang-english"
                onClick={() => handleSelectMode('english')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container transition-colors flex items-center justify-between ${languageMode === 'english' ? 'font-semibold text-secondary' : 'text-on-surface'}`}
              >
                <span>English Only</span>
              </button>
              <button
                id="btn-lang-hindi"
                onClick={() => handleSelectMode('hindi')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-container transition-colors flex items-center justify-between ${languageMode === 'hindi' ? 'font-semibold text-secondary' : 'text-on-surface'}`}
              >
                <span>हिन्दी केवल</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
