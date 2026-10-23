import React, { useState, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, getLanguage } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import { LanguageOption } from '../types';
import { Search, Globe, Check, ChevronRight, Sliders } from 'lucide-react';

interface LanguageSelectorModalProps {
  currentLang: string;
  onSelectLanguage: (displayLang: string, inputLang: string, responseLang: string) => void;
  isOpen: boolean;
  onClose?: () => void;
  isFirstScreen?: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  currentLang,
  onSelectLanguage,
  isOpen,
  onClose,
  isFirstScreen = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDisplay, setSelectedDisplay] = useState(currentLang);
  const [selectedInput, setSelectedInput] = useState(currentLang);
  const [selectedResponse, setSelectedResponse] = useState(currentLang);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const t = useMemo(() => getTranslation(selectedDisplay), [selectedDisplay]);

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  const handleSelectPrimary = (code: string) => {
    setSelectedDisplay(code);
    setSelectedInput(code);
    setSelectedResponse(code);
  };

  const handleContinue = () => {
    onSelectLanguage(selectedDisplay, selectedInput, selectedResponse);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E6DFD5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2D5A43] text-white p-6 sm:p-8 text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-3 border border-white/20">
            <Globe className="w-8 h-8 text-[#EBF3EE]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
            {t.selectLanguageTitle || 'Choose Your Preferred Language'}
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-md mx-auto">
            {t.selectLanguageSubtitle ||
              'Select how you want Zestiquee to speak, listen, and organize your kitchen.'}
          </p>

          {!isFirstScreen && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#E6DFD5]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchLanguagePlaceholder || 'Search languages (Telugu, Hindi, Spanish)...'}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D5CCC0] bg-[#FDFBF7] text-[#1F2421] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A43] text-base"
              autoFocus={isFirstScreen}
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredLanguages.map((lang: LanguageOption) => {
              const isSelected = selectedDisplay === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectPrimary(lang.code)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#EBF3EE] border-[#2D5A43] ring-2 ring-[#2D5A43]/20 shadow-sm'
                      : 'bg-white border-[#E6DFD5] hover:border-[#2D5A43]/50 hover:bg-[#F9F7F3]'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-2xl">{lang.flag || '🌐'}</span>
                    <div className="truncate">
                      <div className="font-semibold text-base text-[#1F2421]">
                        {lang.nativeName}
                      </div>
                      <div className="text-xs text-[#5A625B]">
                        {lang.name} • {lang.region}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2D5A43] text-white shrink-0 ml-2">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-10 text-[#5A625B]">
              <p className="font-medium">No languages matching "{search}"</p>
              <p className="text-sm mt-1 text-gray-400">Try searching in English or native script</p>
            </div>
          )}

          {/* Advanced toggle for separate Display / Input / Response */}
          <div className="pt-4 border-t border-[#E6DFD5] mt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-xs font-semibold uppercase tracking-wider text-[#2D5A43] hover:text-[#1F2421] transition"
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              {showAdvanced ? 'Hide Separate Language Controls' : 'Configure Separate Voice & Display Languages'}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-white rounded-xl border border-[#E6DFD5] space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Display Language (Menus, Buttons)
                  </label>
                  <select
                    value={selectedDisplay}
                    onChange={(e) => setSelectedDisplay(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Voice Input Language (What you speak)
                  </label>
                  <select
                    value={selectedInput}
                    onChange={(e) => setSelectedInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.speechLangCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assistant Voice & Response Language
                  </label>
                  <select
                    value={selectedResponse}
                    onChange={(e) => setSelectedResponse(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Continue Button */}
        <div className="p-4 sm:p-6 bg-[#FAF7F2] border-t border-[#E6DFD5] flex items-center justify-between">
          <div className="text-xs text-[#5A625B]">
            Selected:{' '}
            <span className="font-bold text-[#1F2421]">
              {getLanguage(selectedDisplay).nativeName}
            </span>
          </div>

          <button
            onClick={handleContinue}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-medium shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>{t.continueButton || 'Continue to My Kitchen'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
