import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppTranslations, getTranslation } from './i18n/translations';
import { getLanguage } from './i18n/languages';
import {
  UserProfile,
  PantryItem,
  ShoppingItem,
  Timer,
  Recipe,
  TwoOptionRecipePair,
  ChatMessage,
  MealPlan,
} from './types';
import { api, authStorage } from './services/api';
import { Header } from './components/Header';
import { VoiceAssistant } from './components/VoiceAssistant';
import { PantryManager } from './components/PantryManager';
import { ShoppingList } from './components/ShoppingList';
import { RecipeHub } from './components/RecipeHub';
import { TimerManager } from './components/TimerManager';
import { MealPlanner } from './components/MealPlanner';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { MCPInspectorModal } from './components/MCPInspectorModal';
import { GuidedCookingModal } from './components/GuidedCookingModal';
import { LanguageSelectionScreen } from './components/LanguageSelectionScreen';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import {
  Mic,
  ChefHat,
  BookOpen,
  Timer as TimerIcon,
  ShoppingBag,
  Calendar,
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const App: React.FC = () => {
  // Application high-level screen state
  const [appState, setAppState] = useState<'loading' | 'language_select' | 'auth' | 'onboarding' | 'main'>('loading');

  // Selected language for pre-auth flows (defaults to English or last stored preference)
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('zestiquee_temp_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // Authenticated user state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Kitchen data (isolated per user)
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRecipePair, setCurrentRecipePair] = useState<TwoOptionRecipePair | null>(null);

  // Restock alert notification banner
  const [restockAlert, setRestockAlert] = useState<{
    message: string;
    type: 'low' | 'out' | 'success';
  } | null>(null);

  // Navigation and Modals state
  const [activeTab, setActiveTab] = useState<
    'assistant' | 'kitchen' | 'recipes' | 'saved' | 'timers' | 'shopping' | 'mealplanner'
  >('assistant');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMCPInspectorOpen, setIsMCPInspectorOpen] = useState(false);
  const [guidedCookingRecipe, setGuidedCookingRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Translation hook
  const activeLangCode = user?.displayLanguage || selectedLanguage;
  const t = useMemo(() => getTranslation(activeLangCode), [activeLangCode]);

  // Session verification on initial load
  useEffect(() => {
    checkSession();

    // Listen for unauthorized events dispatched by API service
    const handleUnauthorized = () => {
      handleForceLogout();
    };
    window.addEventListener('zestiquee_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('zestiquee_unauthorized', handleUnauthorized);
    };
  }, []);

  const checkSession = async () => {
    const token = authStorage.getToken();
    if (!token) {
      // Unauthenticated visitor -> MUST start at language selection!
      setAppState('language_select');
      return;
    }

    try {
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setSelectedLanguage(data.user.displayLanguage || 'en');

        if (!data.user.isOnboarded) {
          setAppState('onboarding');
        } else {
          setAppState('main');
          loadUserData();
        }
      } else {
        authStorage.clearToken();
        setAppState('language_select');
      }
    } catch {
      authStorage.clearToken();
      setAppState('language_select');
    }
  };

  const loadUserData = async () => {
    try {
      // 1. Pantry
      const pData = await api.getPantry();
      const currentPantry = pData.items || [];
      if (pData.success) setPantry(currentPantry);

      // 2. Shopping
      const sData = await api.getShopping();
      const currentShopping = sData.items || [];
      if (sData.success) setShopping(currentShopping);

      // Trigger automatic restock monitor for authenticated user's pantry
      if (pData.success && sData.success) {
        checkAndTriggerAutoRestock(currentPantry, currentShopping);
      }

      // 3. Timers
      const tData = await api.getTimers();
      if (tData.success) setTimers(tData.timers || []);

      // 4. Saved Recipes
      const rData = await api.getSavedRecipes();
      if (rData.success) setSavedRecipes(rData.recipes || []);

      // 5. Meal Plans
      const mData = await api.getMealPlans();
      if (mData.success) setMealPlans(mData.plans || []);
    } catch (err) {
      console.warn('Error loading user kitchen records:', err);
    }
  };

  /* =========================================================
     RESTOCK MONITOR
     ========================================================= */
  const checkAndTriggerAutoRestock = useCallback(
    async (pantryItems: PantryItem[], shoppingItems: ShoppingItem[]) => {
      const itemsToAdd: any[] = [];
      let latestAlert: { message: string; type: 'low' | 'out' } | null = null;

      for (const p of pantryItems) {
        const currentQty = Number(p.quantity) || 0;
        const threshold = p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 1;

        const isDepleted = currentQty <= 0;
        const isLow = !isDepleted && currentQty <= threshold;

        if (isDepleted || isLow) {
          const alreadyListed = shoppingItems.some(
            (s) => !s.purchased && s.name.trim().toLowerCase() === p.name.trim().toLowerCase()
          );

          if (!alreadyListed) {
            const refillQty = threshold > 0 ? Number((threshold * 2).toFixed(2)) : 1;
            const restockReason = isDepleted ? 'out_of_stock' : 'low_stock';

            itemsToAdd.push({
              name: p.name,
              category: p.category || 'Pantry Staples',
              quantity: refillQty,
              unit: p.unit || 'unit',
              isAutoRestock: true,
              restockReason,
              pantryQuantity: currentQty,
              pantryThreshold: threshold,
              suggestedQuantity: refillQty,
              notes: isDepleted ? 'Out of stock auto-refill' : 'Low stock auto-refill',
            });

            if (isDepleted) {
              latestAlert = {
                message: `Out of stock: ${p.name} is finished. Added to your Shopping List.`,
                type: 'out',
              };
            } else {
              latestAlert = {
                message: `Low stock: ${p.name} is running low (${currentQty} ${p.unit} left). Added to your Shopping List.`,
                type: 'low',
              };
            }
          }
        }
      }

      if (itemsToAdd.length > 0) {
        try {
          const data = await api.addShoppingItem(itemsToAdd);
          if (data.success) {
            setShopping(data.allShopping);
            if (latestAlert) {
              setRestockAlert(latestAlert);
              setTimeout(() => setRestockAlert(null), 8000);
            }
          }
        } catch (e) {
          console.warn('Auto restock sync error:', e);
        }
      }
    },
    []
  );

  /* =========================================================
     SCREEN TRANSITION HANDLERS
     ========================================================= */
  // Step 1: Language selected on first screen
  const handleLanguageContinue = (displayLang: string, inputLang: string, responseLang: string) => {
    setSelectedLanguage(displayLang);
    try {
      localStorage.setItem('zestiquee_temp_lang', displayLang);
    } catch {}
    setAppState('auth');
  };

  // Step 2: User successfully authenticated
  const handleAuthenticated = (authenticatedUser: UserProfile, isNewUser: boolean) => {
    setUser(authenticatedUser);
    setSelectedLanguage(authenticatedUser.displayLanguage || selectedLanguage);

    if (isNewUser || !authenticatedUser.isOnboarded) {
      setAppState('onboarding');
    } else {
      setAppState('main');
      loadUserData();
    }
  };

  // Step 3: Onboarding completed
  const handleFinishOnboarding = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    setSelectedLanguage(updatedProfile.displayLanguage || selectedLanguage);
    setAppState('main');
    loadUserData();
  };

  // Logout handler
  const handleLogout = async () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    await api.logout();
    handleForceLogout();
  };

  const handleForceLogout = () => {
    authStorage.clearToken();
    setUser(null);
    setPantry([]);
    setShopping([]);
    setTimers([]);
    setSavedRecipes([]);
    setMealPlans([]);
    setMessages([]);
    setCurrentRecipePair(null);
    setIsSettingsOpen(false);
    setIsLanguageModalOpen(false);
    setGuidedCookingRecipe(null);
    setAppState('language_select');
  };

  // Delete account handler
  const handleDeleteAccount = () => {
    handleForceLogout();
  };

  // Settings save handler
  const handleSaveUserPreferences = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    setSelectedLanguage(updated.displayLanguage || selectedLanguage);
    try {
      const data = await api.saveUserProfile(updated);
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Error saving user profile:', e);
    }
  };

  // Language selection change inside app
  const handleSelectLanguageInApp = async (displayLang: string, inputLang: string, responseLang: string) => {
    if (!user) return;
    const updated = {
      ...user,
      displayLanguage: displayLang,
      inputLanguage: inputLang,
      responseLanguage: responseLang,
    };
    setUser(updated);
    setSelectedLanguage(displayLang);
    setIsLanguageModalOpen(false);
    try {
      await api.saveUserProfile(updated);
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  };

  /* =========================================================
     VOICE ASSISTANT & CHAT
     ========================================================= */
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: 'm_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await api.sendChatMessage(text, messages.slice(-8));
      setIsLoading(false);

      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: 'm_' + Date.now() + '_ai',
          role: 'assistant',
          content: data.textResponse || 'I have updated your kitchen records.',
          timestamp: Date.now(),
          spokenAudioBase64: data.spokenAudioBase64,
          recipePair: data.recipePair || undefined,
          toolCallsExecuted: data.toolExecutions,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.recipePair) {
          setCurrentRecipePair(data.recipePair);
          setActiveTab('recipes');
        }

        if (data.updatedPantry) {
          setPantry(data.updatedPantry);
          checkAndTriggerAutoRestock(data.updatedPantry, data.updatedShopping || shopping);
        }
        if (data.updatedShopping) {
          setShopping(data.updatedShopping);
        }
        if (data.updatedTimers) {
          setTimers(data.updatedTimers);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'm_err_' + Date.now(),
            role: 'assistant',
            content: data.error || 'Sorry, I encountered an issue updating your kitchen records.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'm_err_' + Date.now(),
          role: 'assistant',
          content: 'Unable to connect to kitchen services. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  /* =========================================================
     PANTRY MANAGEMENT
     ========================================================= */
  const handleAddPantryItem = async (item: Partial<PantryItem>) => {
    try {
      const data = await api.addPantryItem(item);
      if (data.success) {
        const updated = data.allPantry || [...pantry, data.items[0]];
        setPantry(updated);
        checkAndTriggerAutoRestock(updated, shopping);
      }
    } catch (e) {
      console.warn('Error adding pantry item:', e);
    }
  };

  const handleUpdatePantryItem = async (id: string, updates: Partial<PantryItem>) => {
    try {
      const data = await api.updatePantryItem(id, updates);
      if (data.success) {
        const updated = pantry.map((p) => (p.id === id ? data.item : p));
        setPantry(updated);
        checkAndTriggerAutoRestock(updated, shopping);
      }
    } catch (e) {
      console.warn('Error updating pantry item:', e);
    }
  };

  const handleDeletePantryItem = async (id: string) => {
    try {
      await api.deletePantryItem(id);
      setPantry((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.warn('Error deleting pantry item:', e);
    }
  };

  const handleConsumePantryItem = async (id: string, amount: number) => {
    try {
      const data = await api.consumePantryItem(id, amount);
      if (data.success) {
        const updated = pantry.map((p) => (p.id === id ? data.item : p));
        setPantry(updated);
        checkAndTriggerAutoRestock(updated, shopping);
      }
    } catch (e) {
      console.warn('Error consuming item:', e);
    }
  };

  /* =========================================================
     SHOPPING LIST & PURCHASE CONFIRMATION
     ========================================================= */
  const handleAddShoppingItem = async (item: Partial<ShoppingItem>) => {
    try {
      const data = await api.addShoppingItem([item]);
      if (data.success) {
        setShopping(data.allShopping);
      }
    } catch (e) {
      console.warn('Error adding shopping item:', e);
    }
  };

  const handleToggleShoppingPurchased = async (id: string, purchased: boolean) => {
    try {
      const data = await api.updateShoppingItem(id, { purchased });
      if (data.success) {
        setShopping((prev) => prev.map((s) => (s.id === id ? data.item : s)));
      }
    } catch (e) {
      console.warn('Error toggling shopping item:', e);
    }
  };

  const handleConfirmPurchase = async (
    item: ShoppingItem,
    actualQty: number,
    actualUnit: string,
    actualPrice?: number
  ) => {
    try {
      // 1. Mark as purchased in Shopping List
      const dataShop = await api.updateShoppingItem(item.id, {
        purchased: true,
        quantity: actualQty,
        unit: actualUnit,
        estimatedPrice: actualPrice,
      });
      if (dataShop.success) {
        setShopping((prev) => prev.map((s) => (s.id === item.id ? dataShop.item : s)));
      }

      // 2. Merge into Pantry with unit conversion
      const itemNameLower = item.name.trim().toLowerCase();
      const existingPantryItem = pantry.find(
        (p) => p.name.trim().toLowerCase() === itemNameLower
      );

      if (existingPantryItem) {
        const pQty = Number(existingPantryItem.quantity) || 0;
        const pUnit = (existingPantryItem.unit || '').trim().toLowerCase();
        const bUnit = (actualUnit || '').trim().toLowerCase();

        let addedAmount = actualQty;
        if (pUnit === 'kg' && bUnit === 'g') {
          addedAmount = actualQty / 1000;
        } else if (pUnit === 'g' && bUnit === 'kg') {
          addedAmount = actualQty * 1000;
        } else if ((pUnit === 'l' || pUnit === 'liter') && bUnit === 'ml') {
          addedAmount = actualQty / 1000;
        } else if (pUnit === 'ml' && (bUnit === 'l' || bUnit === 'liter')) {
          addedAmount = actualQty * 1000;
        }

        const newQty = Number((pQty + addedAmount).toFixed(2));
        const dataPantry = await api.updatePantryItem(existingPantryItem.id, {
          quantity: newQty,
          notes: (existingPantryItem.notes || '').replace('[Depleted]', '').trim(),
        });
        if (dataPantry.success) {
          setPantry((prev) =>
            prev.map((p) => (p.id === existingPantryItem.id ? dataPantry.item : p))
          );
        }
      } else {
        const dataPantry = await api.addPantryItem({
          name: item.name,
          category: item.category || 'Pantry Staples',
          quantity: actualQty,
          unit: actualUnit,
          storageLocation: 'Pantry',
          lowStockThreshold: 1,
          notes: 'Purchased from shopping list',
        });
        if (dataPantry.success && dataPantry.items?.[0]) {
          setPantry((prev) => [...prev, dataPantry.items[0]]);
        }
      }

      setRestockAlert({
        message: `Purchased: Added ${actualQty} ${actualUnit} of ${item.name} to My Pantry.`,
        type: 'success',
      });
      setTimeout(() => setRestockAlert(null), 6000);
    } catch (e) {
      console.warn('Error confirming purchase:', e);
    }
  };

  const handleDeleteShoppingItem = async (id: string) => {
    try {
      await api.deleteShoppingItem(id);
      setShopping((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.warn('Error deleting shopping item:', e);
    }
  };

  const handleTransferToPantry = async () => {
    try {
      const data = await api.transferPurchasedToPantry();
      if (data.success) {
        setPantry(data.pantry);
        setShopping(data.shopping);
        setRestockAlert({
          message: 'All bought shopping items have been transferred to My Pantry!',
          type: 'success',
        });
        setTimeout(() => setRestockAlert(null), 5000);
      }
    } catch (e) {
      console.warn('Error transferring to pantry:', e);
    }
  };

  /* =========================================================
     TIMERS
     ========================================================= */
  const handleStartTimer = async (label: string, durationSeconds: number) => {
    try {
      const data = await api.startTimer(label, durationSeconds);
      if (data.success) {
        setTimers((prev) => [...prev, data.timer]);
      }
    } catch (e) {
      console.warn('Error starting timer:', e);
    }
  };

  const handleTogglePauseTimer = async (id: string, isPaused: boolean) => {
    try {
      const data = await api.togglePauseTimer(id, isPaused);
      if (data.success) {
        setTimers((prev) => prev.map((t) => (t.id === id ? data.timer : t)));
      }
    } catch (e) {
      console.warn('Error pausing timer:', e);
    }
  };

  const handleCancelTimer = async (id: string) => {
    try {
      await api.cancelTimer(id);
      setTimers((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.warn('Error cancelling timer:', e);
    }
  };

  /* =========================================================
     RECIPES & MEAL PLANS
     ========================================================= */
  const handleSearchRecipe = async (dishQuery: string, mode: 'general' | 'pantry') => {
    const promptText =
      mode === 'pantry'
        ? `What can I cook right now using the ingredients in my pantry? Please provide both the Traditional Recipe and the Pantry-Adapted Recipe for: ${dishQuery}`
        : `How do I prepare ${dishQuery}? Please provide both the Traditional Recipe and the Pantry-Adapted Recipe based on what is in my pantry.`;

    await handleSendMessage(promptText);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const data = await api.saveRecipe(recipe);
      if (data.success) {
        setSavedRecipes(data.savedRecipes);
      }
    } catch (e) {
      console.warn('Error saving recipe:', e);
    }
  };

  const handleRemoveSavedRecipe = async (id: string) => {
    try {
      const data = await api.removeSavedRecipe(id);
      if (data.success) {
        setSavedRecipes(data.savedRecipes);
      }
    } catch (e) {
      console.warn('Error removing saved recipe:', e);
    }
  };

  const handleAddMissingToShopping = async (missingItems: any[]) => {
    try {
      const itemsToAdd = missingItems.map((m) => ({
        name: m.name,
        category: 'Recipe Missing Staples',
        quantity: Number(m.quantity) || 1,
        unit: m.unit || 'unit',
        notes: 'Added from recipe missing ingredients',
      }));

      const data = await api.addShoppingItem(itemsToAdd);
      if (data.success) {
        setShopping(data.allShopping);
        setRestockAlert({
          message: `Added ${missingItems.length} missing recipe ingredients to your shopping list!`,
          type: 'success',
        });
        setTimeout(() => setRestockAlert(null), 5000);
      }
    } catch (e) {
      console.warn('Error adding missing items to shopping:', e);
    }
  };

  const handleSaveMealPlan = async (plan: MealPlan) => {
    try {
      const data = await api.saveMealPlan(plan);
      if (data.success) {
        setMealPlans((prev) => {
          const idx = prev.findIndex((p) => p.id === plan.id);
          return idx >= 0 ? prev.map((p) => (p.id === plan.id ? plan : p)) : [...prev, plan];
        });
      }
    } catch (e) {
      console.warn('Error saving meal plan:', e);
    }
  };

  const handleGenerateShoppingFromMealPlan = async (plan: MealPlan) => {
    try {
      const data = await api.generateShoppingFromMealPlan(plan);
      if (data.success) {
        setShopping(data.shoppingList);
      }
    } catch (e) {
      console.warn('Error generating shopping list from meal plan:', e);
    }
  };

  const handleTestVoice = (voiceName: string, lang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(
      `Hello! I am Zestiquee, your personal voice kitchen assistant. This is the ${voiceName} voice.`
    );
    utt.lang = lang || 'en-US';
    utt.rate = user?.speechRate || 1.0;
    window.speechSynthesis.speak(utt);
  };

  const activeTimersCount = timers.filter((tm) => tm.remainingSeconds > 0).length;
  const shoppingCount = shopping.filter((s) => !s.purchased).length;
  const savedCount = savedRecipes.length;

  /* =========================================================
     ROUTING & VIEWPORT RENDERING
     ========================================================= */

  // 1. Initial Session Loading Screen
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#2D5A43] text-white flex items-center justify-center shadow-md shadow-[#2D5A43]/20 mb-4 animate-bounce">
          <ChefHat className="w-8 h-8 text-[#EBF3EE]" />
        </div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-[#2D5A43]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening your kitchen...</span>
        </div>
      </div>
    );
  }

  // 2. Mandatory First Screen: Language Selection Screen
  if (appState === 'language_select') {
    return (
      <LanguageSelectionScreen
        currentLang={selectedLanguage}
        onContinue={handleLanguageContinue}
      />
    );
  }

  // 3. Mandatory Authentication Screen
  if (appState === 'auth') {
    return (
      <AuthScreen
        t={t}
        currentLang={selectedLanguage}
        onBackToLanguage={() => setAppState('language_select')}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  // 4. Multi-Step Onboarding Flow (for newly signed-up cooks)
  if (appState === 'onboarding' && user) {
    return (
      <OnboardingFlow
        t={t}
        initialUser={user}
        onFinishOnboarding={handleFinishOnboarding}
      />
    );
  }

  // 5. Authenticated Main Application View
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2421] flex flex-col font-sans selection:bg-[#2D5A43] selection:text-white">
      {/* App Header */}
      <Header
        t={t}
        currentLang={user.displayLanguage}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMCPInspector={() => setIsMCPInspectorOpen(true)}
        activeTimersCount={activeTimersCount}
        shoppingCount={shoppingCount}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        activeTab={activeTab}
      />

      {/* Restock Notification Banner */}
      {restockAlert && (
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
            restockAlert.type === 'out'
              ? 'bg-rose-600 text-white'
              : restockAlert.type === 'success'
              ? 'bg-emerald-700 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {restockAlert.type === 'out' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : restockAlert.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0" />
              )}
              <span>{restockAlert.message}</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setActiveTab('shopping');
                  setRestockAlert(null);
                }}
                className="underline text-[11px] hover:opacity-90 cursor-pointer"
              >
                View Shopping List →
              </button>
              <button
                onClick={() => setRestockAlert(null)}
                className="p-1 hover:opacity-80 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <nav className="bg-white border-b border-[#E6DFD5] px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'assistant'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{t.navAssistant || 'Voice Assistant'}</span>
            </button>

            <button
              onClick={() => setActiveTab('kitchen')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'kitchen'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>{t.pantryTitle || 'My Pantry'}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#EBF3EE] text-[#2D5A43] font-bold">
                {pantry.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'recipes'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.navRecipes || 'Recipes'}</span>
            </button>

            {/* Dedicated Saved Recipes Tab */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'saved'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Recipes</span>
              {savedCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#EBF3EE] text-[#2D5A43] font-bold">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('timers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'timers'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <TimerIcon className="w-4 h-4" />
              <span>{t.navTimers || 'Timers & Reminders'}</span>
              {activeTimersCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#C85A32] text-white font-bold">
                  {activeTimersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'shopping'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.navShopping || 'Shopping List'}</span>
              {shoppingCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#2D5A43] text-white font-bold">
                  {shoppingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mealplanner')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'mealplanner'
                  ? 'bg-[#2D5A43] text-white shadow-xs'
                  : 'text-[#5A625B] hover:text-[#1F2421] hover:bg-[#FAF7F2]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t.navMealPlanner || 'Meal Plans'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'assistant' && (
          <VoiceAssistant
            t={t}
            user={user}
            pantry={pantry}
            shopping={shopping}
            timers={timers}
            messages={messages}
            savedRecipes={savedRecipes}
            onSaveRecipe={handleSaveRecipe}
            onRemoveSavedRecipe={handleRemoveSavedRecipe}
            onSendMessage={handleSendMessage}
            onStartTimer={handleStartTimer}
            onAddMissingToShopping={handleAddMissingToShopping}
            onStartGuidedCooking={(recipe) => setGuidedCookingRecipe(recipe)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onNewConversation={() => {
              setMessages([]);
              setCurrentRecipePair(null);
            }}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'kitchen' && (
          <PantryManager
            t={t}
            pantry={pantry}
            onAddItem={handleAddPantryItem}
            onUpdateItem={handleUpdatePantryItem}
            onDeleteItem={handleDeletePantryItem}
            onConsumeItem={handleConsumePantryItem}
            onBatchVoiceAdd={(txt) => {
              setActiveTab('assistant');
              handleSendMessage(txt);
            }}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeHub
            t={t}
            user={user}
            pantry={pantry}
            savedRecipes={savedRecipes}
            onSearchRecipe={handleSearchRecipe}
            onSaveRecipe={handleSaveRecipe}
            onRemoveSavedRecipe={handleRemoveSavedRecipe}
            onAddMissingToShopping={handleAddMissingToShopping}
            onStartGuidedCooking={(recipe) => setGuidedCookingRecipe(recipe)}
            currentRecipePair={currentRecipePair}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'saved' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#2D5A43]" />
                  <span>Persistent Bookmarks</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
                  My Saved Recipes ({savedRecipes.length})
                </h2>
                <p className="text-sm text-[#5A625B] mt-1">
                  Your hand-picked traditional favorites and adapted pantry creations, ready to cook hands-free anytime.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('recipes')}
                className="px-5 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                + Discover More Recipes
              </button>
            </div>

            {savedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs hover:border-[#2D5A43]/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          {recipe.isAdapted ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                              🌿 Pantry Adaptation
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] border border-[#2D5A43]/20 px-2.5 py-0.5 rounded-full">
                              📖 Traditional Recipe
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-white border border-[#E6DFD5] px-2.5 py-0.5 rounded-full">
                            {recipe.cuisine || 'Home Cooking'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveSavedRecipe(recipe.id)}
                          className="text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-[#1F2421] mb-2">
                        {recipe.name}
                      </h3>
                      <p className="text-xs text-[#5A625B] line-clamp-3 mb-4 leading-relaxed">
                        {recipe.description}
                      </p>

                      <div className="text-xs text-[#5A625B] space-y-1 mb-4">
                        <div>
                          ⏱ Prep: {recipe.prepTimeMinutes}m • Cook: {recipe.cookTimeMinutes}m
                        </div>
                        <div>👥 Servings: {recipe.servings} persons</div>
                        <div>🥕 Ingredients: {recipe.ingredients.length} items</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E6DFD5] flex items-center space-x-2">
                      <button
                        onClick={() => setGuidedCookingRecipe(recipe)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-bold transition shadow-xs cursor-pointer text-center"
                      >
                        Start Hands-Free Cooking
                      </button>
                      <button
                        onClick={() => {
                          setCurrentRecipePair({
                            dishQuery: recipe.name,
                            originalRecipe: recipe,
                            adaptedRecipe: null,
                            pantryMatchSummary: {
                              totalIngredients: recipe.ingredients.length,
                              availableCount: recipe.ingredients.filter((i) => i.isAvailableInPantry).length,
                              missingCount: recipe.ingredients.filter((i) => !i.isAvailableInPantry).length,
                              canMakeOriginal: true,
                              canMakeAdapted: true,
                            },
                          });
                          setActiveTab('recipes');
                        }}
                        className="py-2.5 px-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DFD5] max-w-lg mx-auto">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-lg text-[#1F2421] mb-1">
                  No Saved Recipes Yet
                </h3>
                <p className="text-xs text-[#5A625B] mb-5">
                  When you discover delicious recipes in the Recipe Studio, tap the bookmark icon to save them here for quick hands-free cooking.
                </p>
                <button
                  onClick={() => setActiveTab('recipes')}
                  className="px-6 py-2.5 rounded-xl bg-[#2D5A43] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Explore Recipes
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timers' && (
          <TimerManager
            t={t}
            timers={timers}
            onStartTimer={handleStartTimer}
            onTogglePauseTimer={handleTogglePauseTimer}
            onCancelTimer={handleCancelTimer}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingList
            t={t}
            user={user}
            shopping={shopping}
            onAddItem={handleAddShoppingItem}
            onTogglePurchased={handleToggleShoppingPurchased}
            onConfirmPurchase={handleConfirmPurchase}
            onDeleteItem={handleDeleteShoppingItem}
            onTransferToPantry={handleTransferToPantry}
          />
        )}

        {activeTab === 'mealplanner' && (
          <MealPlanner
            t={t}
            user={user}
            pantry={pantry}
            mealPlans={mealPlans}
            onSaveMealPlan={handleSaveMealPlan}
            onGenerateShoppingList={handleGenerateShoppingFromMealPlan}
          />
        )}
      </main>

      {/* Guided Cooking Mode Overlay Modal */}
      {guidedCookingRecipe && (
        <GuidedCookingModal
          t={t}
          user={user}
          recipe={guidedCookingRecipe}
          onClose={() => setGuidedCookingRecipe(null)}
          onStartTimer={handleStartTimer}
        />
      )}

      {/* Modals */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        currentLang={user.displayLanguage}
        onSelectLanguage={handleSelectLanguageInApp}
        onClose={() => setIsLanguageModalOpen(false)}
        isFirstScreen={false}
      />

      <SettingsModal
        t={t}
        user={user}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveUser={handleSaveUserPreferences}
        onTestVoice={handleTestVoice}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onOpenLanguageSelector={() => setIsLanguageModalOpen(true)}
      />

      <MCPInspectorModal
        isOpen={isMCPInspectorOpen}
        onClose={() => setIsMCPInspectorOpen(false)}
      />
    </div>
  );
};

export default App;
