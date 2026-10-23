import React, { useState, useMemo } from 'react';
import { SUPPORTED_LANGUAGES, getLanguage } from '../i18n/languages';
import { getTranslation } from '../i18n/translations';
import { LanguageOption } from '../types';
import { Search, Globe, Check, ArrowRight, Volume2, ShieldCheck, Sparkles } from 'lucide-react';

interface LanguageSelectionScreenProps {
  currentLang: string;
  onContinue: (displayLang: string, inputLang: string, responseLang: string) => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  currentLang,
  onContinue,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDisplay, setSelectedDisplay] = useState(currentLang || 'en');
  const [selectedInput, setSelectedInput] = useState(currentLang || 'en');
  const [selectedResponse, setSelectedResponse] = useState(currentLang || 'en');
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  const t = useMemo(() => getTranslation(selectedDisplay), [selectedDisplay]);
  const activeLangObj = useMemo(() => getLanguage(selectedDisplay), [selectedDisplay]);

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

  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedDisplay(lang.code);
    setSelectedInput(lang.code);
    setSelectedResponse(lang.code);
  };

  const handleTestPronunciation = (lang: LanguageOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudioPreview(true);

    const greetingSample =
      lang.code === 'te'
        ? 'నమస్కారం! జెస్టికి వంటగదికి స్వాగతం.'
        : lang.code === 'hi'
        ? 'नमस्ते! जेस्टिक्वी रसोई में आपका स्वागत है।'
        : lang.code === 'es'
        ? '¡Hola! Bienvenido a la cocina de Zestiquee.'
        : lang.code === 'fr'
        ? 'Bonjour! Bienvenue dans la cuisine Zestiquee.'
        : lang.code === 'de'
        ? 'Hallo! Willkommen in der Zestiquee-Küche.'
        : lang.code === 'it'
        ? 'Ciao! Benvenuto nella cucina di Zestiquee.'
        : lang.code === 'pt'
        ? 'Olá! Bem-vindo à cozinha Zestiquee.'
        : lang.code === 'ar'
        ? 'مرحباً! أهلاً بكم في مطبخ زيستيكي.'
        : lang.code === 'zh'
        ? '你好！欢迎来到 Zestiquee 智能厨房。'
        : lang.code === 'ja'
        ? 'こんにちは！Zestiquee キッチンへようこそ。'
        : lang.code === 'ko'
        ? '안녕하세요! Zestiquee 주방에 오신 것을 환영합니다.'
        : lang.code === 'ta'
        ? 'வணக்கம்! ஜெஸ்டிகீ சமையலறைக்கு வரவேற்கிறோம்.'
        : lang.code === 'kn'
        ? 'ನಮಸ್ಕಾರ! ಜೆಸ್ಟಿಕೀ ಅಡುಗೆಮನೆಗೆ ಸುಸ್ವಾಗತ.'
        : lang.code === 'ml'
        ? 'നമസ്കാരം! സെസ്റ്റിക്കീ അടുക്കളയിലേക്ക് സ്വാഗതം.'
        : `Welcome to Zestiquee, your voice-first kitchen assistant.`;

    const utt = new SpeechSynthesisUtterance(greetingSample);
    utt.lang = lang.speechLangCode || 'en-US';
    utt.rate = 0.95;
    utt.onend = () => setIsPlayingAudioPreview(false);
    utt.onerror = () => setIsPlayingAudioPreview(false);
    window.speechSynthesis.speak(utt);
  };

  const handleProceed = () => {
    onContinue(selectedDisplay, selectedInput, selectedResponse);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2421] flex flex-col justify-between selection:bg-[#2D5A43] selection:text-white">
      {/* Top Banner */}
      <div className="bg-[#2D5A43] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-[#234734] shadow-md relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-100 text-xs font-semibold mb-4 backdrop-blur-xs border border-white/20">
            <Globe className="w-4 h-4 text-emerald-200" />
            <span>Step 1: Global Kitchen Localization</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-3">
            Welcome to Zestiquee. Which language would you prefer?
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Choose your preferred language for speech, kitchen display, recipe instructions, and voice interactions.
            You can also adjust this anytime later in Settings.
          </p>

          {/* Privacy & Scope Disclaimer */}
          <div className="mt-4 inline-flex items-center space-x-2 text-xs text-emerald-200/80 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Language selection does not create an account or grant access to private kitchen data.</span>
          </div>
        </div>
      </div>

      {/* Main Selector Section */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Search Input */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DFD5] shadow-xs mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by language name or native script (e.g. తెలుగు, हिन्दी, Spanish, 日本語, Arabic)..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 bg-[#FAF7F2]/60 text-[#1F2421] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A43] focus:border-transparent text-sm sm:text-base transition"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-[#5A625B]">
            <span>Showing {filteredLanguages.length} languages worldwide</span>
            <span>Selected: <strong className="text-[#2D5A43]">{activeLangObj.name} ({activeLangObj.nativeName})</strong></span>
          </div>
        </div>

        {/* Languages Grid */}
        <div className="flex-1 overflow-y-auto max-h-[50vh] sm:max-h-[55vh] pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedDisplay === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                    isSelected
                      ? 'bg-[#EBF3EE] border-[#2D5A43] shadow-sm ring-2 ring-[#2D5A43]/20'
                      : 'bg-white border-[#E6DFD5] hover:border-[#2D5A43]/50 hover:bg-[#FDFBF7]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="text-2xl shrink-0 select-none">{lang.flag || '🌐'}</span>
                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold text-sm truncate ${isSelected ? 'text-[#2D5A43]' : 'text-[#1F2421]'}`}>
                          {lang.name}
                        </span>
                        {isSelected && (
                          <span className="shrink-0 w-4 h-4 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-[#2D5A43]/90 mt-0.5 truncate">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] text-[#5A625B] truncate">
                        {lang.region}
                      </div>
                    </div>
                  </div>

                  {/* Pronunciation voice preview button */}
                  <button
                    type="button"
                    onClick={(e) => handleTestPronunciation(lang, e)}
                    title={`Listen to sample speech in ${lang.name}`}
                    className={`p-2 rounded-xl border shrink-0 transition ${
                      isSelected
                        ? 'bg-white border-[#2D5A43]/30 text-[#2D5A43] hover:bg-[#2D5A43] hover:text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#E6DFD5]">
              <Globe className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No language matches "{search}"</p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-xs text-[#2D5A43] font-semibold underline"
              >
                Show all available languages
              </button>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-6 pt-5 border-t border-[#E6DFD5] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 p-4 rounded-2xl">
          <div className="flex items-center space-x-3 text-xs text-[#5A625B]">
            <div className="w-8 h-8 rounded-xl bg-[#2D5A43]/10 flex items-center justify-center text-[#2D5A43]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-[#1F2421]">Current Choice: {activeLangObj.name} ({activeLangObj.nativeName})</div>
              <div className="text-[11px]">Next: Sign up or log in to access your private kitchen records.</div>
            </div>
          </div>

          <button
            onClick={handleProceed}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-sm shadow-md shadow-[#2D5A43]/20 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
