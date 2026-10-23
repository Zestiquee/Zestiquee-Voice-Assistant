import React from 'react';
import { AppTranslations } from '../i18n/translations';
import { getLanguage } from '../i18n/languages';
import { Timer, ShoppingBag, Globe, Settings, Sparkles, ChefHat, User } from 'lucide-react';

interface HeaderProps {
  t: AppTranslations;
  currentLang: string;
  onOpenLanguageModal: () => void;
  onOpenSettings: () => void;
  onOpenMCPInspector: () => void;
  activeTimersCount: number;
  shoppingCount: number;
  onNavigateTab: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  t,
  currentLang,
  onOpenLanguageModal,
  onOpenSettings,
  onOpenMCPInspector,
  activeTimersCount,
  shoppingCount,
  onNavigateTab,
  activeTab,
}) => {
  const currentLangObj = getLanguage(currentLang);

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E6DFD5] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateTab('assistant')}>
          <div className="w-10 h-10 rounded-2xl bg-[#2D5A43] text-white flex items-center justify-center shadow-md shadow-[#2D5A43]/15">
            <ChefHat className="w-6 h-6 text-[#EBF3EE]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-serif font-bold tracking-tight text-[#1F2421]">
                Zestiquee
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#2D5A43] border border-[#2D5A43]/20">
                Alexa-Inspired
              </span>
            </div>
            <p className="text-[11px] text-[#5A625B] hidden md:block">
              {t.tagline || 'Your kitchen. Your voice. Everything organized.'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active Timers Badge */}
          <button
            onClick={() => onNavigateTab('timers')}
            title="Active Timers"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeTimersCount > 0
                ? 'bg-[#C85A32]/10 border-[#C85A32]/30 text-[#C85A32] animate-pulse'
                : 'bg-white border-[#E6DFD5] text-[#5A625B] hover:border-gray-400'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span className="hidden xs:inline">Timers</span>
            {activeTimersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-[10px] font-bold">
                {activeTimersCount}
              </span>
            )}
          </button>

          {/* Shopping List Badge */}
          <button
            onClick={() => onNavigateTab('shopping')}
            title="Shopping List"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeTab === 'shopping'
                ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                : 'bg-white border-[#E6DFD5] text-[#1F2421] hover:border-gray-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">Shopping</span>
            {shoppingCount > 0 && (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeTab === 'shopping'
                    ? 'bg-white text-[#2D5A43]'
                    : 'bg-[#2D5A43] text-white'
                }`}
              >
                {shoppingCount}
              </span>
            )}
          </button>

          {/* Language Selector Trigger */}
          <button
            onClick={onOpenLanguageModal}
            title={t.changeLanguage || 'Change Language'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6DFD5] hover:border-[#2D5A43] text-xs font-semibold text-[#1F2421] transition shadow-xs"
          >
            <span className="text-sm">{currentLangObj.flag || '🌐'}</span>
            <span className="hidden sm:inline font-medium">{currentLangObj.nativeName}</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title={t.settingsTitle || 'Settings'}
            className="p-2 rounded-xl bg-white border border-[#E6DFD5] hover:border-[#2D5A43] text-[#5A625B] hover:text-[#1F2421] transition shadow-xs"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
