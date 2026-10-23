import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserProfile, ChatMessage, PantryItem, ShoppingItem, Timer, Recipe, TwoOptionRecipePair } from '../types';
import { voiceService, VoiceState } from '../services/voiceService';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Clock,
  ShoppingBag,
  ChefHat,
  CheckCircle2,
  ListPlus,
  Play,
  ArrowRight,
  ExternalLink,
  Flame,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';

interface VoiceAssistantProps {
  t: AppTranslations;
  user: UserProfile;
  pantry: PantryItem[];
  shopping: ShoppingItem[];
  timers: Timer[];
  messages: ChatMessage[];
  savedRecipes?: Recipe[];
  onSaveRecipe?: (recipe: Recipe) => Promise<void>;
  onRemoveSavedRecipe?: (id: string) => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onStartTimer: (label: string, durationSeconds: number) => void;
  onAddMissingToShopping: (items: any[]) => void;
  onStartGuidedCooking: (recipe: any) => void;
  onNavigateTab: (tab: string) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  t,
  user,
  pantry,
  shopping,
  timers,
  messages,
  savedRecipes = [],
  onSaveRecipe,
  onRemoveSavedRecipe,
  onSendMessage,
  onStartTimer,
  onAddMissingToShopping,
  onStartGuidedCooking,
  onNavigateTab,
  onNewConversation,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());
  const [isMuted, setIsMuted] = useState<boolean>(voiceService.getIsMuted());
  const [speechError, setSpeechError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSpokenMsgIdRef = useRef<string | null>(null);

  // Subscribe to voiceService state changes (idle, listening, thinking, speaking)
  useEffect(() => {
    const unsubscribe = voiceService.subscribeState((state) => {
      setVoiceState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // MANDATORY CRITICAL REQUIREMENT: The Voice Assistant must automatically speak every Assistant response audibly
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id !== lastSpokenMsgIdRef.current) {
      lastSpokenMsgIdRef.current = lastMsg.id;

      // Automatically play the spoken response audibly
      voiceService.speak(lastMsg.content, {
        audioBase64: lastMsg.spokenAudioBase64,
        languageCode: user.responseLanguage || user.displayLanguage || 'en',
        voiceName: user.voicePreference || 'Kore',
        speechRate: user.speechRate || 1.0,
      });
    }
  }, [messages, user.responseLanguage, user.displayLanguage, user.voicePreference, user.speechRate]);

  // Expiring items (expiryDate within 3 days or expired)
  const expiringItems = pantry.filter((item) => {
    if (!item.expiryDate) return false;
    const diffDays = Math.ceil(
      (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
    );
    return diffDays <= 3;
  });

  // Low stock items
  const lowStockItems = pantry.filter((item) => {
    if (item.lowStockThreshold === undefined) return false;
    return Number(item.quantity) <= Number(item.lowStockThreshold);
  });

  // Toggle voice listening
  const toggleListening = async () => {
    if (voiceState === 'speaking') {
      voiceService.stopSpeaking();
    }

    if (voiceState === 'listening') {
      const recognized = await voiceService.stopListening();
      if (recognized && recognized.trim()) {
        setInputText('');
      }
    } else {
      setSpeechError(null);
      await voiceService.startListening({
        languageCode: user.inputLanguage || user.displayLanguage || 'en',
        speechRate: user.speechRate || 1.0,
        onInterimResult: (transcript) => {
          setInputText(transcript);
        },
        onFinalResult: async (transcript) => {
          if (transcript.trim()) {
            setInputText('');
            await onSendMessage(transcript.trim());
          }
        },
        onError: (err) => {
          if (err.includes('denied')) {
            setSpeechError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
          } else {
            setSpeechError('Listening paused. Tap the microphone to speak or type your question below.');
          }
        },
      });
    }
  };

  const handleToggleMute = () => {
    const newMuted = voiceService.toggleMute();
    setIsMuted(newMuted);
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
  };

  const handleReplayLast = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      voiceService.speak(lastAssistant.content, {
        audioBase64: lastAssistant.spokenAudioBase64,
        languageCode: user.responseLanguage || user.displayLanguage || 'en',
        voiceName: user.voicePreference || 'Kore',
        speechRate: user.speechRate || 1.0,
      });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    onSendMessage(msg);
  };

  const isRecipeSaved = (recipeId?: string) => {
    if (!recipeId) return false;
    return savedRecipes.some((r) => r.id === recipeId);
  };

  const handleToggleSaveRecipe = async (recipe: Recipe) => {
    if (!onSaveRecipe || !onRemoveSavedRecipe) return;
    if (isRecipeSaved(recipe.id)) {
      await onRemoveSavedRecipe(recipe.id);
    } else {
      await onSaveRecipe(recipe);
    }
  };

  // Convert adaptedRecipe into a complete, saveable Recipe object
  const buildAdaptedRecipeObject = (pair: TwoOptionRecipePair): Recipe => {
    const adapt = pair.adaptedRecipe!;
    const orig = pair.originalRecipe;
    const uniqueId =
      adapt.id && adapt.id.startsWith('rec_adapt')
        ? adapt.id
        : `rec_adapt_${orig?.id || 'dish'}_${(adapt.name || 'dish').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    return {
      id: uniqueId,
      name: adapt.name,
      description: adapt.description || 'Pantry-adapted recipe using available ingredients.',
      cuisine: adapt.cuisine || orig?.cuisine || 'Pantry Adaptation',
      dietaryLabels: adapt.dietaryLabels || ['Pantry Ready'],
      servings: adapt.servings || orig?.servings || user.householdSize || 2,
      prepTimeMinutes: adapt.prepTimeMinutes || orig?.prepTimeMinutes || 10,
      cookTimeMinutes: adapt.cookTimeMinutes || orig?.cookTimeMinutes || 15,
      totalTimeMinutes: adapt.totalTimeMinutes || orig?.totalTimeMinutes || 25,
      ingredients: (adapt.ingredients || []).map((i: any) => ({
        name: i.name,
        quantity: Number(i.quantity) || 1,
        unit: i.unit || 'unit',
        isAvailableInPantry: true,
        availableQuantity: Number(i.quantity) || 1,
        missingQuantity: 0,
        isOptional: false,
      })),
      steps: adapt.steps && adapt.steps.length > 0 ? adapt.steps : (orig?.steps || []),
      isAdapted: true,
      adaptationNotes: adapt.adaptationNotes || 'Adapted to use ingredients in your pantry.',
    };
  };

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = isLoading || voiceState === 'thinking';
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Friendly Greeting & Kitchen Summary Cards */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#2D5A43]" />
              <span>Voice Kitchen Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
              {t.greeting || 'Welcome back to your kitchen!'}, {user.name}
            </h1>
            <p className="text-sm text-[#5A625B] mt-1">
              {t.tagline || 'Your kitchen. Your voice. Everything organized.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mute/Unmute Button */}
            <button
              onClick={handleToggleMute}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isMuted
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#FAF7F2] hover:bg-[#F3EFEA] border-[#E6DFD5] text-[#1F2421]'
              }`}
              title={isMuted ? 'Voice responses muted (Click to unmute)' : 'Voice responses active (Click to mute)'}
              aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                  <span>Voice Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#2D5A43]" />
                  <span>Voice Active</span>
                </>
              )}
            </button>

            <button
              onClick={onNewConversation}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E6DFD5] text-xs font-semibold text-[#1F2421] transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5A625B]" />
              <span>{t.newConversation || 'New Conversation'}</span>
            </button>
          </div>
        </div>

        {/* Real Kitchen Data Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div
            onClick={() => onNavigateTab('kitchen')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] hover:border-[#2D5A43] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-[#5A625B] mb-1">
              <span>{t.summaryPantryItems || 'Pantry Items'}</span>
              <ChefHat className="w-4 h-4 text-[#2D5A43]" />
            </div>
            <div className="text-2xl font-bold text-[#1F2421]">{pantry.length}</div>
            <div className="text-[11px] text-[#2D5A43] font-medium mt-1">View inventory →</div>
          </div>

          <div
            onClick={() => onNavigateTab('kitchen')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              expiringItems.length > 0
                ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                : 'bg-[#FAF7F2] border-[#E6DFD5]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#5A625B] mb-1">
              <span>{t.summaryExpiringSoon || 'Expiring Soon'}</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">{expiringItems.length}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              {expiringItems.length > 0 ? `${expiringItems[0]?.name}` : 'All fresh'}
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('kitchen')}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              lowStockItems.length > 0
                ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                : 'bg-[#FAF7F2] border-[#E6DFD5]'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#5A625B] mb-1">
              <span>{t.summaryLowStock || 'Low Stock'}</span>
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700">{lowStockItems.length}</div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">
              {lowStockItems.length > 0 ? `${lowStockItems[0]?.name}` : 'Stock healthy'}
            </div>
          </div>

          <div
            onClick={() => onNavigateTab('shopping')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] hover:border-[#2D5A43] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-[#5A625B] mb-1">
              <span>{t.summaryShoppingItems || 'To Buy'}</span>
              <ShoppingBag className="w-4 h-4 text-[#2D5A43]" />
            </div>
            <div className="text-2xl font-bold text-[#1F2421]">
              {shopping.filter((s) => !s.purchased).length}
            </div>
            <div className="text-[11px] text-[#2D5A43] font-medium mt-1">Shopping list →</div>
          </div>
        </div>
      </div>

      {/* Central Alexa-Inspired Voice Interaction Orb Card */}
      <div className="bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] rounded-3xl p-6 sm:p-10 border border-[#E6DFD5] shadow-md text-center relative overflow-hidden">
        {/* Subtle decorative glow ring */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#2D5A43]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Central Voice Button */}
        <div className="relative inline-block mb-6">
          <button
            onClick={toggleListening}
            disabled={isThinking}
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
              isListening
                ? 'bg-[#C85A32] text-white animate-voice-active shadow-2xl scale-105'
                : isThinking
                ? 'bg-amber-600 text-white animate-pulse'
                : isSpeaking
                ? 'bg-[#2D5A43] text-white animate-voice-glow shadow-xl ring-4 ring-[#2D5A43]/30'
                : 'bg-[#2D5A43] hover:bg-[#234734] text-white shadow-xl hover:shadow-2xl hover:scale-105'
            }`}
            aria-label={t.tapToSpeak || 'Tap to speak'}
          >
            {isListening ? (
              <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider mt-1.5 opacity-90">
              {isListening
                ? 'Listening'
                : isThinking
                ? 'Thinking'
                : isSpeaking
                ? 'Speaking'
                : 'Tap to Talk'}
            </span>
          </button>
        </div>

        {/* State Indicators & Spoken Audio Controls */}
        <div className="max-w-md mx-auto mb-6">
          <p className="text-base sm:text-lg font-medium text-[#1F2421]">
            {isListening
              ? t.listening || 'Listening to your voice... Speak naturally'
              : isThinking
              ? t.thinking || 'Checking your pantry and cooking insights...'
              : isSpeaking
              ? t.speaking || 'Speaking response audibly...'
              : t.askAnything || 'Ask anything about cooking, your pantry, or setting timers.'}
          </p>

          {speechError && (
            <p className="text-xs text-rose-700 mt-2 bg-rose-50 py-2 px-3 rounded-xl inline-block border border-rose-200 text-left max-w-lg">
              {speechError}
            </p>
          )}

          {/* Controls while speaking or after answer */}
          <div className="flex items-center justify-center space-x-3 mt-3">
            {isSpeaking && (
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold hover:bg-rose-200 transition cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t.stopSpeaking || 'Stop Audio'}</span>
              </button>
            )}

            {lastAssistantMessage && (
              <button
                type="button"
                onClick={handleReplayLast}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#EBF3EE] text-[#2D5A43] text-xs font-semibold hover:bg-[#d8e8dc] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.repeatSpeech || 'Replay Answer'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Text Input Fallback / Live Transcription Bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Transcribing your voice in real time...'
                  : t.voicePromptPlaceholder ||
                    'Ask a question or say "I bought 1kg carrots and 500g rice"...'
              }
              className={`w-full px-5 py-3.5 rounded-2xl border text-sm sm:text-base shadow-xs transition focus:outline-none focus:ring-2 focus:ring-[#2D5A43] ${
                isListening
                  ? 'border-rose-400 bg-rose-50/30 text-rose-950 placeholder-rose-400'
                  : 'border-[#D5CCC0] bg-white text-[#1F2421] placeholder-gray-400'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-3.5 rounded-2xl bg-[#2D5A43] hover:bg-[#234734] disabled:bg-gray-300 text-white transition shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Voice Prompt Suggestions */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {[
            '📦 What is in my pantry?',
            '🛒 What is on my shopping list?',
            '➕ Add 1kg tomatoes to pantry',
            '➕ Add milk to shopping list',
            '🍝 White sauce pasta recipe',
            '⏱️ Start a 10-minute timer for pasta',
            '🥗 What can I cook with what I have?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              className="px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#EBF3EE] border border-[#E6DFD5] hover:border-[#2D5A43] text-xs font-medium text-[#1F2421] transition shadow-2xs cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Timeline & Message Bubbles */}
      {messages.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6DFD5] pb-4">
            <h3 className="font-serif font-bold text-lg text-[#1F2421]">
              Conversation with Zestiquee
            </h3>
            <span className="text-xs text-[#5A625B]">
              Responds audibly in {user.responseLanguage?.toUpperCase() || 'EN'}
            </span>
          </div>

          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-2 text-xs text-[#5A625B] mb-1.5 px-1">
                    <span>{isUser ? user.name : 'Zestiquee Assistant'}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-4 sm:p-5 rounded-2xl max-w-2xl text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-[#2D5A43] text-white rounded-tr-xs'
                        : 'bg-[#FAF7F2] text-[#1F2421] border border-[#E6DFD5] rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Audio playback button for assistant messages */}
                    {!isUser && (
                      <div className="mt-3 pt-2.5 border-t border-[#E6DFD5]/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            voiceService.speak(msg.content, {
                              audioBase64: msg.spokenAudioBase64,
                              languageCode: user.responseLanguage || user.displayLanguage || 'en',
                              voiceName: user.voicePreference || 'Kore',
                              speechRate: user.speechRate || 1.0,
                            })
                          }
                          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#2D5A43] hover:text-[#1F2421] transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{t.speakStep || 'Listen to Answer'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Executed Tools Badges (Pantry updated, timer set, etc.) */}
                  {msg.toolCallsExecuted && msg.toolCallsExecuted.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-xl">
                      {msg.toolCallsExecuted.map((tc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#EBF3EE] text-[#2D5A43] text-xs font-medium border border-[#2D5A43]/20"
                        >
                          <CheckCircle2 className="w-3 h-3 text-[#2D5A43]" />
                          <span>{tc.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TWO-OPTION RECIPE EMBEDDED IN CHAT WITH SAVE BUTTONS FOR BOTH */}
                  {msg.recipePair && (
                    <div className="w-full mt-4 bg-white rounded-2xl border-2 border-[#2D5A43]/20 p-5 sm:p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6DFD5] pb-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-[#2D5A43] mb-1">
                            Pantry-Aware Dual Recipe Recommendation
                          </div>
                          <h4 className="text-xl font-serif font-bold text-[#1F2421]">
                            {msg.recipePair.dishQuery}
                          </h4>
                        </div>
                        <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2D5A43]">
                          {msg.recipePair.pantryMatchSummary.availableCount} of{' '}
                          {msg.recipePair.pantryMatchSummary.totalIngredients} items available
                        </div>
                      </div>

                      {/* TWO DISTINCT OPTIONS */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* OPTION 1: ORIGINAL TRADITIONAL RECIPE */}
                        <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD5] flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A43] bg-white px-2.5 py-0.5 rounded-full border border-[#E6DFD5]">
                                {t.originalRecipeHeading || 'Option 1: Traditional Recipe'}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-[#5A625B]">
                                  {msg.recipePair.originalRecipe.totalTimeMinutes}m total
                                </span>
                                {onSaveRecipe && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSaveRecipe(msg.recipePair!.originalRecipe)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-[#2D5A43] transition cursor-pointer"
                                    title={
                                      isRecipeSaved(msg.recipePair.originalRecipe.id)
                                        ? 'Remove from saved recipes'
                                        : 'Save traditional recipe to bookmarks'
                                    }
                                    aria-label="Bookmark traditional recipe"
                                  >
                                    {isRecipeSaved(msg.recipePair.originalRecipe.id) ? (
                                      <BookmarkCheck className="w-4 h-4 text-[#2D5A43]" />
                                    ) : (
                                      <Bookmark className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <h5 className="font-serif font-bold text-lg text-[#1F2421] mb-1">
                              {msg.recipePair.originalRecipe.name}
                            </h5>
                            <p className="text-xs text-[#5A625B] mb-4">
                              {msg.recipePair.originalRecipe.description}
                            </p>

                            {/* Pantry ingredient comparison */}
                            <div className="space-y-2 mb-4">
                              <div className="text-xs font-semibold text-[#1F2421]">
                                Ingredients & Pantry Check:
                              </div>
                              <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {msg.recipePair.originalRecipe.ingredients.map((ing, idx) => (
                                  <li
                                    key={idx}
                                    className={`flex items-center justify-between p-1.5 rounded-lg border ${
                                      ing.isAvailableInPantry
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                        : 'bg-amber-50 border-amber-200 text-amber-900'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-1.5">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          ing.isAvailableInPantry ? 'bg-emerald-600' : 'bg-amber-500'
                                        }`}
                                      />
                                      <span>
                                        {ing.quantity} {ing.unit} {ing.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-semibold">
                                      {ing.isAvailableInPantry ? 'In Pantry' : 'Missing'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-[#E6DFD5]">
                            {/* Missing ingredients action button */}
                            {msg.recipePair.originalRecipe.ingredients.some((i) => !i.isAvailableInPantry) && (
                              <button
                                onClick={() => {
                                  const missing = msg.recipePair!.originalRecipe.ingredients
                                    .filter((i) => !i.isAvailableInPantry)
                                    .map((i) => ({
                                      name: i.name,
                                      quantity: i.missingQuantity || i.quantity,
                                      unit: i.unit,
                                    }));
                                  onAddMissingToShopping(missing);
                                }}
                                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                              >
                                <ListPlus className="w-4 h-4" />
                                <span>{t.addMissingToShopping || 'Add Missing to Shopping List'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => onStartGuidedCooking(msg.recipePair!.originalRecipe)}
                              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                            >
                              <Play className="w-4 h-4" />
                              <span>{t.startGuidedCooking || 'Start Guided Cooking'}</span>
                            </button>
                          </div>
                        </div>

                        {/* OPTION 2: ADAPTED PANTRY RECIPE */}
                        <div className="p-5 rounded-2xl bg-[#EBF3EE]/60 border border-[#2D5A43]/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                                {t.adaptedRecipeHeading || 'Option 2: Pantry Adaptation'}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-semibold text-emerald-800">
                                  Pantry Ready
                                </span>
                                {msg.recipePair.adaptedRecipe && onSaveRecipe && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleSaveRecipe(buildAdaptedRecipeObject(msg.recipePair!))
                                    }
                                    className="p-1 rounded-lg text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                                    title={
                                      isRecipeSaved(buildAdaptedRecipeObject(msg.recipePair!).id)
                                        ? 'Remove from saved recipes'
                                        : 'Save pantry adaptation to bookmarks'
                                    }
                                    aria-label="Bookmark pantry adaptation"
                                  >
                                    {isRecipeSaved(buildAdaptedRecipeObject(msg.recipePair!).id) ? (
                                      <BookmarkCheck className="w-4 h-4 text-emerald-800" />
                                    ) : (
                                      <Bookmark className="w-4 h-4 text-emerald-700 hover:text-emerald-900" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {msg.recipePair.adaptedRecipe ? (
                              <>
                                <h5 className="font-serif font-bold text-lg text-[#1F2421] mb-1">
                                  {msg.recipePair.adaptedRecipe.name}
                                </h5>
                                <p className="text-xs text-[#5A625B] mb-3">
                                  {msg.recipePair.adaptedRecipe.description}
                                </p>

                                <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-[#1F2421] mb-4">
                                  <div className="font-semibold text-emerald-800 mb-1">
                                    Substitutions & Notes:
                                  </div>
                                  <p>{msg.recipePair.adaptedRecipe.adaptationNotes}</p>
                                </div>

                                <div className="space-y-1 mb-4">
                                  <div className="text-xs font-semibold text-[#1F2421]">
                                    Ingredients Used:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {msg.recipePair.adaptedRecipe.ingredients.map((ing, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-900"
                                      >
                                        {ing.quantity} {ing.unit} {ing.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="py-8 text-center text-xs text-[#5A625B]">
                                No reasonable adaptation was possible with current inventory. Please use the traditional recipe with missing items.
                              </div>
                            )}
                          </div>

                          {msg.recipePair.adaptedRecipe && (
                            <div className="pt-3 border-t border-emerald-200">
                              <button
                                onClick={() =>
                                  onStartGuidedCooking(buildAdaptedRecipeObject(msg.recipePair!))
                                }
                                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                              >
                                <Play className="w-4 h-4" />
                                <span>Cook Adapted Version</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* YouTube Video link recommendation */}
                      {msg.recipePair.originalRecipe.youtubeQuery && (
                        <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs text-[#5A625B]">
                          <span className="font-medium text-[#1F2421]">
                            {t.watchAndLearn || 'Watch & Learn (Verified Cooking Videos)'}:
                          </span>
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                              msg.recipePair.originalRecipe.youtubeQuery + ' recipe ' + user.responseLanguage
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-semibold"
                          >
                            <span>Search YouTube Videos</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
