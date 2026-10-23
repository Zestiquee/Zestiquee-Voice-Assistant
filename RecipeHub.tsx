import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Recipe, TwoOptionRecipePair, PantryItem, UserProfile } from '../types';
import { voiceService } from '../services/voiceService';
import {
  Search,
  Sparkles,
  ChefHat,
  Play,
  ListPlus,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Users,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  X,
} from 'lucide-react';

interface RecipeHubProps {
  t: AppTranslations;
  user: UserProfile;
  pantry: PantryItem[];
  savedRecipes: Recipe[];
  onSearchRecipe: (query: string, mode: 'general' | 'pantry') => Promise<void>;
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
  onRemoveSavedRecipe: (id: string) => Promise<void>;
  onAddMissingToShopping: (items: any[]) => Promise<void>;
  onStartGuidedCooking: (recipe: Recipe) => void;
  currentRecipePair: TwoOptionRecipePair | null;
  isLoading: boolean;
}

export const RecipeHub: React.FC<RecipeHubProps> = ({
  t,
  user,
  pantry,
  savedRecipes,
  onSearchRecipe,
  onSaveRecipe,
  onRemoveSavedRecipe,
  onAddMissingToShopping,
  onStartGuidedCooking,
  currentRecipePair,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'saved'>('discover');
  const [servingsMultiplier, setServingsMultiplier] = useState(user.householdSize || 2);
  const [addedMissingSuccess, setAddedMissingSuccess] = useState(false);
  const [isListeningForRecipe, setIsListeningForRecipe] = useState(false);
  const [voiceSearchError, setVoiceSearchError] = useState<string | null>(null);
  const lastSearchedRef = useRef<string>('');

  const handleSearch = (mode: 'general' | 'pantry', customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : query).trim();
    if (mode === 'general' && !q) return;
    lastSearchedRef.current = q;
    const finalQuery =
      mode === 'pantry' && !q
        ? 'Delicious dinner using my current pantry ingredients'
        : q;
    onSearchRecipe(finalQuery, mode);
  };

  // Debounced auto-search when user pauses typing (at least 3 characters)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || isListeningForRecipe) return;
    if (trimmed.toLowerCase() === lastSearchedRef.current.toLowerCase()) return;

    const timer = setTimeout(() => {
      lastSearchedRef.current = trimmed;
      triggerSmartRecipeSearch(trimmed);
    }, 750);

    return () => clearTimeout(timer);
  }, [query, isListeningForRecipe]);

  const isRecipeSaved = (recipeId: string) => {
    return savedRecipes.some((r) => r.id === recipeId);
  };

  const handleToggleSave = async (recipe: Recipe) => {
    if (isRecipeSaved(recipe.id)) {
      await onRemoveSavedRecipe(recipe.id);
    } else {
      await onSaveRecipe(recipe);
    }
  };

  // Convert currentRecipePair.adaptedRecipe into a complete, standalone, identifiable Recipe object
  const adaptedFullRecipe: Recipe | null = useMemo(() => {
    if (!currentRecipePair?.adaptedRecipe) return null;
    const adapt = currentRecipePair.adaptedRecipe;
    const orig = currentRecipePair.originalRecipe;
    const uniqueId =
      adapt.id && adapt.id.startsWith('rec_adapt')
        ? adapt.id
        : `rec_adapt_${orig?.id || 'dish'}_${(adapt.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    return {
      id: uniqueId,
      name: adapt.name,
      description: adapt.description || 'Pantry-adapted recipe using your current ingredients.',
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
      adaptationNotes: adapt.adaptationNotes || 'Carefully adapted to utilize ingredients available in your pantry.',
    };
  }, [currentRecipePair, user.householdSize]);

  // Voice Search Handler
  const toggleRecipeVoiceSearch = async () => {
    if (isListeningForRecipe) {
      setIsListeningForRecipe(false);
      const recognized = await voiceService.stopListening();
      if (recognized && recognized.trim()) {
        const cleaned = recognized.trim();
        setQuery(cleaned);
        lastSearchedRef.current = cleaned;
        triggerSmartRecipeSearch(cleaned);
      }
    } else {
      setVoiceSearchError(null);
      setIsListeningForRecipe(true);
      await voiceService.startListening({
        languageCode: user.inputLanguage || user.displayLanguage || 'en',
        onInterimResult: (transcript) => {
          setQuery(transcript);
        },
        onFinalResult: (transcript) => {
          setIsListeningForRecipe(false);
          if (transcript.trim()) {
            const cleaned = transcript.trim();
            setQuery(cleaned);
            lastSearchedRef.current = cleaned;
            triggerSmartRecipeSearch(cleaned);
          }
        },
        onError: (err) => {
          setIsListeningForRecipe(false);
          setVoiceSearchError(
            err.includes('denied')
              ? 'Microphone permission was denied. Please allow microphone access.'
              : 'Could not capture voice input. Please try speaking again or type your recipe name.'
          );
        },
        onStateChange: (state) => {
          if (state === 'idle') {
            setIsListeningForRecipe(false);
          }
        },
      });
    }
  };

  const triggerSmartRecipeSearch = (spokenText: string) => {
    const lower = spokenText.toLowerCase();
    if (
      lower.includes('pantry') ||
      lower.includes('what can i cook') ||
      lower.includes('what i have') ||
      lower.includes('what to make with')
    ) {
      handleSearch('pantry', spokenText);
    } else {
      handleSearch('general', spokenText);
    }
  };

  const handleAddMissing = async (recipe: Recipe) => {
    const missing = recipe.ingredients
      .filter((i) => !i.isAvailableInPantry)
      .map((i) => ({
        name: i.name,
        quantity: i.missingQuantity || i.quantity,
        unit: i.unit,
      }));

    if (missing.length === 0) return;
    await onAddMissingToShopping(missing);
    setAddedMissingSuccess(true);
    setTimeout(() => setAddedMissingSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Dual Option Recipe Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {t.recipesTitle || 'Intelligent Recipe Studio'}
          </h2>
          <p className="text-sm text-[#5A625B] mt-1">
            {t.recipesSubtitle ||
              'Authentic traditional dishes and adaptive recipes crafted for your actual pantry.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E6DFD5]">
          <button
            onClick={() => setActiveSubTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'discover'
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'text-[#5A625B] hover:text-[#1F2421]'
            }`}
          >
            Discover Recipes
          </button>
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSubTab === 'saved'
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'text-[#5A625B] hover:text-[#1F2421]'
            }`}
          >
            Saved Recipes ({savedRecipes.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'discover' ? (
        <>
          {/* Search bar with Microphone Voice Search and Mode A/B buttons */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch('general');
                    }
                  }}
                  placeholder={
                    isListeningForRecipe
                      ? 'Listening... Speak a dish (e.g. "white sauce pasta")...'
                      : t.searchRecipePlaceholder ||
                        'What would you like to cook? (e.g. Biryani, White sauce pasta, Dal tadka)...'
                  }
                  className={`w-full pl-12 pr-24 py-3.5 rounded-2xl border text-base transition focus:outline-none focus:ring-2 focus:ring-[#2D5A43] ${
                    isListeningForRecipe
                      ? 'border-rose-400 bg-rose-50/40 text-rose-950 placeholder-rose-400 ring-2 ring-rose-200'
                      : 'border-[#D5CCC0] bg-[#FAF7F2] text-[#1F2421] placeholder-gray-400'
                  }`}
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      lastSearchedRef.current = '';
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Recipe Microphone Button */}
                <button
                  type="button"
                  onClick={toggleRecipeVoiceSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                    isListeningForRecipe
                      ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                      : 'text-[#2D5A43] bg-white border border-[#E6DFD5] hover:bg-[#EBF3EE] hover:border-[#2D5A43] shadow-2xs'
                  }`}
                  title={
                    isListeningForRecipe
                      ? 'Listening... Tap to finish voice search'
                      : 'Search recipe by speaking (e.g. "white sauce pasta" or "what can I cook with my pantry")'
                  }
                  aria-label="Voice search for recipes"
                >
                  {isListeningForRecipe ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Explicit Primary Search Button */}
              <button
                type="button"
                onClick={() => handleSearch('general')}
                disabled={isLoading || !query.trim()}
                className="px-6 py-3.5 rounded-2xl bg-[#2D5A43] hover:bg-[#234734] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search</span>
              </button>
            </div>

            {/* Listening Banner or Voice Diagnostic Notice */}
            {isListeningForRecipe && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span className="font-semibold">
                    Listening ({user.inputLanguage?.toUpperCase() || 'EN'})... Say a dish name like "white sauce pasta" or "what can I cook with my pantry?"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecipeVoiceSearch}
                  className="px-2 py-0.5 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold text-[11px]"
                >
                  Stop & Search
                </button>
              </div>
            )}

            {voiceSearchError && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span>{voiceSearchError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceSearchError(null)}
                  className="text-amber-800 font-bold hover:underline ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSearch('pantry')}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] disabled:bg-gray-400 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t.cookWithPantryBtn || 'Cook With What I Have (Mode B)'}</span>
                </button>

                <button
                  onClick={() => handleSearch('general')}
                  disabled={isLoading || !query.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-[#2D5A43] text-[#2D5A43] hover:bg-[#EBF3EE] disabled:border-gray-300 disabled:text-gray-400 text-xs font-semibold transition cursor-pointer"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>{t.allRecipesBtn || 'Explore Any Recipe (Mode A)'}</span>
                </button>
              </div>

              {/* Quick dish prompt tags */}
              <div className="flex items-center space-x-1.5 text-xs text-[#5A625B]">
                <span className="font-semibold">Try:</span>
                {['White sauce pasta', 'Vegetable Biryani', 'Soft Chapatis', 'Dal Palak'].map((dish) => (
                  <button
                    key={dish}
                    onClick={() => {
                      setQuery(dish);
                      onSearchRecipe(dish, 'general');
                    }}
                    className="hover:text-[#2D5A43] hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {dish}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DFD5] shadow-xs">
              <div className="w-12 h-12 rounded-full border-4 border-[#2D5A43]/20 border-t-[#2D5A43] animate-spin mx-auto mb-4" />
              <h3 className="font-serif font-bold text-lg text-[#1F2421]">
                Formulating Both Traditional and Pantry-Adapted Recipes...
              </h3>
              <p className="text-xs text-[#5A625B] mt-1">
                Comparing all ingredients against your {pantry.length} pantry items.
              </p>
            </div>
          )}

          {/* TWO-OPTION RECIPE DISPLAY */}
          {currentRecipePair && !isLoading && (
            <div className="space-y-6">
              {addedMissingSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{t.addedMissingSuccess || 'Added missing ingredients to your shopping list!'}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ================= OPTION 1: ORIGINAL TRADITIONAL RECIPE ================= */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E6DFD5] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full border border-[#2D5A43]/20">
                        {t.originalRecipeHeading || 'Option 1: Traditional Recipe'}
                      </span>
                      <button
                        onClick={() => handleToggleSave(currentRecipePair.originalRecipe)}
                        className="text-gray-400 hover:text-[#2D5A43] transition p-1"
                      >
                        {isRecipeSaved(currentRecipePair.originalRecipe.id) ? (
                          <BookmarkCheck className="w-5 h-5 text-[#2D5A43]" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <h3 className="font-serif font-bold text-2xl text-[#1F2421] mb-2">
                      {currentRecipePair.originalRecipe.name}
                    </h3>
                    <p className="text-sm text-[#5A625B] mb-4">
                      {currentRecipePair.originalRecipe.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs font-medium text-[#5A625B] py-2.5 px-3 bg-[#FAF7F2] rounded-xl mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-[#2D5A43]" />
                        <span>Prep: {currentRecipePair.originalRecipe.prepTimeMinutes}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 text-orange-600" />
                        <span>Cook: {currentRecipePair.originalRecipe.cookTimeMinutes}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{currentRecipePair.originalRecipe.servings} servings</span>
                      </div>
                    </div>

                    {/* Pantry Comparison Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1F2421]">
                        <span>Pantry Ingredient Comparison</span>
                        <span className="text-emerald-700">
                          {currentRecipePair.pantryMatchSummary.availableCount} Available /{' '}
                          {currentRecipePair.pantryMatchSummary.missingCount} Missing
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {currentRecipePair.originalRecipe.ingredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                              ing.isAvailableInPantry
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : 'bg-amber-50/70 border-amber-200 text-amber-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {ing.isAvailableInPantry ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <span className="font-medium">
                                {ing.quantity} {ing.unit} {ing.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white shadow-2xs">
                              {ing.isAvailableInPantry ? 'In Pantry' : 'Needs Purchase'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chef Tips & Food Safety */}
                    {currentRecipePair.originalRecipe.cookingTips && (
                      <div className="p-3.5 bg-[#FAF7F2] rounded-2xl text-xs text-[#1F2421] mb-4 space-y-1 border border-[#E6DFD5]">
                        <div className="font-bold text-[#2D5A43] flex items-center space-x-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{t.cookingTips || 'Chef Tips'}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                          {currentRecipePair.originalRecipe.cookingTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[#E6DFD5]">
                    {currentRecipePair.originalRecipe.ingredients.some((i) => !i.isAvailableInPantry) && (
                      <button
                        onClick={() => handleAddMissing(currentRecipePair.originalRecipe)}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>{t.addMissingToShopping || 'Add Missing Ingredients to Shopping List'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onStartGuidedCooking(currentRecipePair.originalRecipe)}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Play className="w-4 h-4" />
                      <span>{t.startGuidedCooking || 'Start Step-by-Step Cooking Mode'}</span>
                    </button>
                  </div>
                </div>

                {/* ================= OPTION 2: ADAPTED PANTRY RECIPE ================= */}
                <div className="bg-[#EBF3EE]/50 rounded-3xl p-6 sm:p-8 border-2 border-[#2D5A43]/40 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-white px-3 py-1 rounded-full border border-emerald-300">
                        {t.adaptedRecipeHeading || 'Option 2: Pantry Adaptation'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          Zero Purchases Needed
                        </span>
                        {adaptedFullRecipe && (
                          <button
                            type="button"
                            onClick={() => handleToggleSave(adaptedFullRecipe)}
                            className="p-1 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-white/80 transition cursor-pointer"
                            title={
                              isRecipeSaved(adaptedFullRecipe.id)
                                ? 'Remove pantry adaptation from saved bookmarks'
                                : 'Save pantry adaptation to bookmarks'
                            }
                            aria-label="Save pantry-adapted recipe to bookmarks"
                          >
                            {isRecipeSaved(adaptedFullRecipe.id) ? (
                              <BookmarkCheck className="w-5 h-5 text-emerald-800" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-emerald-700 hover:text-emerald-900" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {currentRecipePair.adaptedRecipe ? (
                      <>
                        <h3 className="font-serif font-bold text-2xl text-[#1F2421] mb-2">
                          {currentRecipePair.adaptedRecipe.name}
                        </h3>
                        <p className="text-sm text-[#5A625B] mb-4">
                          {currentRecipePair.adaptedRecipe.description}
                        </p>

                        {/* Adaptation explanation box */}
                        <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-xs text-[#1F2421] mb-5 shadow-2xs">
                          <div className="font-bold text-emerald-800 mb-1 flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pantry Adaptations & Expected Difference</span>
                          </div>
                          <p className="leading-relaxed text-gray-700">
                            {currentRecipePair.adaptedRecipe.adaptationNotes}
                          </p>
                        </div>

                        {/* Ingredients used */}
                        <div className="space-y-2 mb-6">
                          <div className="text-xs font-bold text-[#1F2421]">
                            Pantry Ingredients Used:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentRecipePair.adaptedRecipe.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 font-medium"
                              >
                                {ing.quantity} {ing.unit} {ing.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Preparation steps preview */}
                        <div className="space-y-2 mb-4">
                          <div className="text-xs font-bold text-[#1F2421]">Step Overview:</div>
                          <ol className="text-xs space-y-1.5 list-decimal list-inside text-gray-700 max-h-40 overflow-y-auto pr-1">
                            {currentRecipePair.adaptedRecipe.steps.map((st) => (
                              <li key={st.stepNumber} className="line-clamp-2">
                                {st.instruction}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </>
                    ) : (
                      <div className="py-16 text-center text-xs text-[#5A625B] space-y-2">
                        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                        <p className="font-semibold text-sm text-[#1F2421]">
                          No sensible adaptation possible with current ingredients
                        </p>
                        <p className="max-w-xs mx-auto">
                          Essential foundational ingredients are missing. Please refer to Option 1
                          and add the missing items to your shopping list!
                        </p>
                      </div>
                    )}
                  </div>

                  {currentRecipePair.adaptedRecipe && (
                    <div className="pt-4 border-t border-emerald-200">
                      <button
                        onClick={() => onStartGuidedCooking(adaptedFullRecipe || (currentRecipePair.adaptedRecipe as any))}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Cook Pantry-Adapted Version</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* YouTube Cooking Recommendations Section */}
              <div className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#1F2421]">
                    {t.watchAndLearn || 'Watch & Learn (Verified Cooking Videos)'}
                  </h4>
                  <p className="text-xs text-[#5A625B]">
                    Hand-matched video guides for {currentRecipePair.dishQuery} in {user.responseLanguage.toUpperCase()}
                  </p>
                </div>

                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${currentRecipePair.dishQuery} recipe step by step ${user.responseLanguage}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition"
                >
                  <span>Open Verified YouTube Search</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </>
      ) : (
        /* SAVED RECIPES TAB */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-[#1F2421]">
              Your Bookmarked Recipes ({savedRecipes.length})
            </h3>
            <span className="text-xs text-[#5A625B]">
              Traditional and Pantry-Adapted favorites saved separately
            </span>
          </div>

          {savedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                    recipe.isAdapted
                      ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-500'
                      : 'bg-[#FAF7F2] border-[#E6DFD5] hover:border-[#2D5A43]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                        {recipe.isAdapted ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                            🌿 Pantry Adaptation
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D5A43] bg-white border border-[#2D5A43]/20 px-2 py-0.5 rounded-md">
                            📖 Traditional Recipe
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 bg-white px-2 py-0.5 rounded-md border border-[#E6DFD5]">
                          {recipe.cuisine || 'Recipe'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSavedRecipe(recipe.id)}
                        className="text-gray-400 hover:text-rose-600 transition p-1 cursor-pointer"
                        title="Remove bookmark"
                        aria-label="Remove bookmark"
                      >
                        <BookmarkCheck className={`w-5 h-5 ${recipe.isAdapted ? 'text-emerald-700' : 'text-[#2D5A43]'}`} />
                      </button>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-[#1F2421] mb-1">
                      {recipe.name}
                    </h4>
                    <p className="text-xs text-[#5A625B] line-clamp-2 mb-3">
                      {recipe.description}
                    </p>

                    {recipe.adaptationNotes && (
                      <div className="text-[11px] text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-200 mb-3 line-clamp-2">
                        <span className="font-semibold">Substitutions:</span> {recipe.adaptationNotes}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 flex items-center space-x-3 mb-4">
                      <span>⏱ {recipe.totalTimeMinutes}m total</span>
                      <span>•</span>
                      <span>👥 {recipe.servings} servings</span>
                      <span>•</span>
                      <span>🥕 {recipe.ingredients.length} ingredients</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onStartGuidedCooking(recipe)}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-white text-xs font-semibold transition cursor-pointer ${
                      recipe.isAdapted
                        ? 'bg-emerald-800 hover:bg-emerald-900'
                        : 'bg-[#2D5A43] hover:bg-[#234734]'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{t.startGuidedCooking || 'Start Guided Cooking'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#5A625B]">
              You haven't bookmarked any recipes yet. Search any dish and click the bookmark icon on Option 1 (Traditional) or Option 2 (Pantry Adaptation)!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
