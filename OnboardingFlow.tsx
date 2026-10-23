import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
  ChefHat,
  User,
  Users,
  Utensils,
  Heart,
  ShieldAlert,
  Flame,
  Clock,
  DollarSign,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Info,
  Check,
  Plus,
  X,
  Loader2,
} from 'lucide-react';

interface OnboardingFlowProps {
  t: AppTranslations;
  initialUser: UserProfile;
  onFinishOnboarding: (updatedUser: UserProfile) => void;
}

const COMMON_DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'Non-vegetarian',
  'Pescatarian',
  'Jain',
  'Halal',
  'Kosher',
];

const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Gluten / Wheat',
  'Dairy / Milk',
  'Eggs',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
];

const CUISINES = [
  'South Indian',
  'North Indian',
  'Italian',
  'Mexican',
  'East Asian / Thai',
  'Mediterranean',
  'American',
  'Middle Eastern',
  'Continental',
];

const COMMON_EQUIPMENT = [
  'Microwave',
  'Oven',
  'Pressure Cooker / Instant Pot',
  'Air Fryer',
  'Blender / Mixer Grinder',
  'Induction Cooktop',
  'Slow Cooker',
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  t,
  initialUser,
  onFinishOnboarding,
}) => {
  // Step tracker: 1 to 7 (where 7 is Final Review)
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Step 1: Personal info
  const [name, setName] = useState(initialUser.name || '');
  const [country, setCountry] = useState(initialUser.country || '');
  const [userRole, setUserRole] = useState(initialUser.userRole || '');

  // Step 2: Household info
  const [householdSize, setHouseholdSize] = useState<number>(initialUser.householdSize || 1);

  // Step 3: Dietary preferences & Allergies
  const [enableDietaryPreferences, setEnableDietaryPreferences] = useState(
    initialUser.dietaryPreferences && initialUser.dietaryPreferences.length > 0
  );
  const [selectedDiets, setSelectedDiets] = useState<string[]>(initialUser.dietaryPreferences || []);
  const [customDiet, setCustomDiet] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(initialUser.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');
  const [dislikedFoods, setDislikedFoods] = useState<string[]>(initialUser.dislikedFoods || []);
  const [customDislike, setCustomDislike] = useState('');

  // Step 4: Cooking & kitchen preferences
  const [cookingSkill, setCookingSkill] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialUser.cookingSkill || 'intermediate'
  );
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(
    initialUser.preferredCuisines || ['South Indian', 'North Indian', 'Italian']
  );
  const [cookingTimePreference, setCookingTimePreference] = useState<'quick' | 'moderate' | 'slow'>(
    initialUser.cookingTimePreference || 'moderate'
  );
  const [measurementUnit, setMeasurementUnit] = useState<'metric' | 'imperial'>(
    initialUser.measurementUnit || 'metric'
  );
  const [currency, setCurrency] = useState(initialUser.currency || '₹');
  const [equipment, setEquipment] = useState<string[]>(initialUser.equipment || ['Microwave', 'Blender / Mixer Grinder']);

  // Step 5: Meal planning & budget
  const [enableMealPlanning, setEnableMealPlanning] = useState(false);
  const [mealPlanSlots, setMealPlanSlots] = useState<string[]>(['Breakfast', 'Lunch', 'Dinner']);
  const [budgetPeriod, setBudgetPeriod] = useState<'none' | 'daily' | 'weekly'>('none');
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(initialUser.budget || undefined);
  const [mealPlanPriority, setMealPlanPriority] = useState<'pantry' | 'time' | 'budget' | 'variety'>('pantry');

  // Step 6: Notification preferences
  const [notifications, setNotifications] = useState({
    restock: initialUser.notificationPreferences?.restock ?? true,
    expiring: initialUser.notificationPreferences?.expiring ?? true,
    timers: initialUser.notificationPreferences?.timers ?? true,
    mealPlans: initialUser.notificationPreferences?.mealPlans ?? true,
  });
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Helper togglers
  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) => (prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]));
  };

  const addCustomDiet = () => {
    if (customDiet.trim() && !selectedDiets.includes(customDiet.trim())) {
      setSelectedDiets((prev) => [...prev, customDiet.trim()]);
      setCustomDiet('');
    }
  };

  const toggleAllergy = (allergen: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies((prev) => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const addDislikedFood = () => {
    if (customDislike.trim() && !dislikedFoods.includes(customDislike.trim())) {
      setDislikedFoods((prev) => [...prev, customDislike.trim()]);
      setCustomDislike('');
    }
  };

  const removeDislikedFood = (item: string) => {
    setDislikedFoods((prev) => prev.filter((d) => d !== item));
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferredCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const toggleEquipment = (eq: string) => {
    setEquipment((prev) => (prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]));
  };

  const toggleMealSlot = (slot: string) => {
    setMealPlanSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const requestBrowserNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const result = await Notification.requestPermission();
        setNotificationPermissionStatus(result);
      } catch (e) {
        console.warn('Notification permission error:', e);
      }
    }
  };

  // Step 1 Validation
  const canProceedStep1 = name.trim().length > 0;

  // Final Save handler
  const handleFinalSubmit = async () => {
    setIsSaving(true);
    setSaveError('');

    const completedProfile: UserProfile = {
      ...initialUser,
      name: name.trim(),
      country: country.trim() || undefined,
      userRole: userRole || undefined,
      householdSize: Math.max(1, Number(householdSize) || 1),
      dietaryPreferences: enableDietaryPreferences ? selectedDiets : [],
      allergies: selectedAllergies,
      dislikedFoods: dislikedFoods,
      cookingSkill: cookingSkill,
      preferredCuisines: preferredCuisines,
      cookingTimePreference: cookingTimePreference,
      measurementUnit: measurementUnit,
      currency: currency,
      equipment: equipment,
      budget: budgetPeriod !== 'none' && budgetAmount ? Number(budgetAmount) : undefined,
      budgetPeriod: budgetPeriod,
      mealPlanSlots: enableMealPlanning ? mealPlanSlots : [],
      mealPlanPriorities: mealPlanPriority,
      notificationPreferences: notifications,
      isOnboarded: true,
      isAuthenticated: true,
    };

    try {
      const res = await api.saveOnboarding(completedProfile);
      if (res.success && res.user) {
        onFinishOnboarding(res.user);
      } else {
        setSaveError('Failed to save kitchen onboarding preferences. Please retry.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Network error saving preferences. Your answers have been preserved.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalSteps = 6;
  const progressPercent = Math.min(100, Math.round(((step - 1) / totalSteps) * 100));

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2421] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 selection:bg-[#2D5A43] selection:text-white">
      {/* Top Header & Progress */}
      <div className="max-w-3xl w-full mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2D5A43] text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5 text-[#EBF3EE]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#1F2421]">Zestiquee Onboarding</span>
              <span className="text-xs text-[#5A625B] ml-2 font-medium">
                {step <= 6 ? `Step ${step} of ${totalSteps}` : 'Final Review'}
              </span>
            </div>
          </div>

          {step > 1 && (
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="text-xs font-semibold text-[#5A625B] hover:text-[#1F2421] flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#E6DFD5] bg-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#E6DFD5] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#2D5A43] h-full transition-all duration-300 rounded-full"
            style={{ width: `${step > 6 ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-3xl w-full mx-auto bg-white rounded-3xl border border-[#E6DFD5] shadow-xl p-6 sm:p-8 flex-1 flex flex-col justify-between">
        {saveError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{saveError}</span>
          </div>
        )}

        {/* =========================================================
            STEP 1: PERSONAL INFORMATION
            ========================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <User className="w-3.5 h-3.5" />
                <span>Personal Information</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Let's get to know you
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                We only ask what is needed to personalize your voice assistant and recipe recommendations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  What should we call you? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your preferred name (e.g. Snikitha, Alex)"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Which country are you in? <span className="text-gray-400 font-normal">(Optional — helps tailor ingredients & grocery terms)</span>
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India, United States, United Kingdom, Canada, Australia"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  What best describes you? <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'College student',
                    'Working professional',
                    'Homemaker',
                    'Parent or caregiver',
                    'Other',
                    'Prefer not to say',
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setUserRole(role === userRole ? '' : role)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                        userRole === role
                          ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: HOUSEHOLD INFORMATION
            ========================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Household Information</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                How many people are in your household?
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                Household size helps calculate recipe servings, ingredient portions, and grocery meal quantities automatically.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E6DFD5] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#1F2421]">Number of Household Members</div>
                  <div className="text-xs text-[#5A625B]">Default is 1 person. You can adjust this anytime in Settings.</div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setHouseholdSize((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-300 text-lg font-bold hover:bg-gray-100 transition flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-2xl font-serif font-bold w-12 text-center text-[#2D5A43]">
                    {householdSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHouseholdSize((prev) => Math.min(20, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-gray-300 text-lg font-bold hover:bg-gray-100 transition flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-[#2D5A43] shrink-0 mt-0.5" />
                <span>
                  When you ask Zestiquee for recipes (such as Pasta or Biryani), quantities and cooking timers will be scaled specifically for <strong>{householdSize} {householdSize === 1 ? 'person' : 'people'}</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: FOOD PREFERENCES & ALLERGIES
            ========================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <Heart className="w-3.5 h-3.5" />
                <span>Optional Food Preferences</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Dietary Preferences & Allergies
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                This section is completely optional. If you have no special restrictions, you can skip this step or select "No special preferences".
              </p>
            </div>

            {/* Quick Skip or Configure Toggle */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnableDietaryPreferences(false);
                  setSelectedDiets([]);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  !enableDietaryPreferences
                    ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                No special preferences (Unrestricted)
              </button>

              <button
                type="button"
                onClick={() => setEnableDietaryPreferences(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  enableDietaryPreferences
                    ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure Specific Dietary Habits
              </button>
            </div>

            {enableDietaryPreferences && (
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Select all that apply to your household:
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIETARY_PREFERENCES.map((diet) => {
                    const isSelected = selectedDiets.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleDiet(diet)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-[#2D5A43]'
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    value={customDiet}
                    onChange={(e) => setCustomDiet(e.target.value)}
                    placeholder="Add custom preference (e.g. Low Sodium, Gluten-Free)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addCustomDiet}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Separate Allergies & Dislikes Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Allergies & Food Intolerances (Strict Safety Filter)</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Safety Reminder:</strong> When allergies are selected, Zestiquee will strictly avoid suggesting recipes or substitutions containing them. However, always verify ingredient labels and check for cross-contamination.
              </div>

              <div className="flex flex-wrap gap-2">
                {COMMON_ALLERGENS.map((allergen) => {
                  const isSelected = selectedAllergies.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergy(allergen)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                        isSelected
                          ? 'bg-rose-700 text-white border-rose-700'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
                      }`}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Add other allergen (e.g. Kiwi, Pine nuts, Latex foods)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white"
                />
                <button
                  type="button"
                  onClick={addCustomAllergy}
                  className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold"
                >
                  Add Allergy
                </button>
              </div>

              {/* Separate Disliked Foods */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Disliked Ingredients (Distinguished from medical allergies)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customDislike}
                    onChange={(e) => setCustomDislike(e.target.value)}
                    placeholder="e.g. Cilantro, Bitter gourd, Eggplant, Olives"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addDislikedFood}
                    className="px-4 py-2 rounded-xl bg-gray-700 text-white text-xs font-semibold"
                  >
                    Add Dislike
                  </button>
                </div>

                {dislikedFoods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dislikedFoods.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => removeDislikedFood(item)}
                          className="text-gray-400 hover:text-gray-700 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4: COOKING & KITCHEN PREFERENCES
            ========================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <Utensils className="w-3.5 h-3.5" />
                <span>Cooking Preferences</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Cooking & Kitchen Preferences
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                Customize your skill level, favorite cuisines, and kitchen appliances. (All fields are skippable).
              </p>
            </div>

            <div className="space-y-4">
              {/* Cooking Skill */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">Cooking Experience</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner', label: 'Beginner', desc: 'Simple steps & explanations' },
                    { id: 'intermediate', label: 'Intermediate', desc: 'Everyday home cooking' },
                    { id: 'advanced', label: 'Experienced', desc: 'Complex techniques & timing' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setCookingSkill(lvl.id as any)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        cookingSkill === lvl.id
                          ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-xs">{lvl.label}</div>
                      <div className={`text-[10px] ${cookingSkill === lvl.id ? 'text-white/80' : 'text-gray-500'}`}>
                        {lvl.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Cuisines */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Preferred Cuisines (Multiple selections allowed)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((cuisine) => {
                    const isSelected = preferredCuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D5A43]'
                        }`}
                      >
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cooking time preference */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">Typical Meal Prep Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'quick', label: 'Quick Meals (< 30 min)' },
                    { id: 'moderate', label: 'Moderate (30 - 60 min)' },
                    { id: 'slow', label: 'Longer Cooking (> 60 min)' },
                  ].map((time) => (
                    <button
                      key={time.id}
                      type="button"
                      onClick={() => setCookingTimePreference(time.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                        cookingTimePreference === time.id
                          ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Units & Currency */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Measurement Units</label>
                  <select
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                  >
                    <option value="metric">Metric (g, kg, ml, L)</option>
                    <option value="imperial">Imperial (oz, lb, cups, tbsp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                  >
                    <option value="₹">₹ (INR - Rupee)</option>
                    <option value="$">$ (USD - Dollar)</option>
                    <option value="€">€ (EUR - Euro)</option>
                    <option value="£">£ (GBP - Pound)</option>
                    <option value="¥">¥ (JPY - Yen)</option>
                    <option value="₩">₩ (KRW - Won)</option>
                  </select>
                </div>
              </div>

              {/* Available Equipment */}
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Available Appliances & Equipment
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_EQUIPMENT.map((eq) => {
                    const isSelected = equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#2D5A43]'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5: MEAL PLANNING & BUDGET
            ========================================================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Meal Planning & Budget</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Personalized Meal Planning & Budget
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                Configure whether you would like proactive weekly meal suggestions and budget limits. (Completely skippable).
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5]">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#1F2421]">Enable Smart Meal Planning</div>
                  <div className="text-[11px] text-[#5A625B]">Generate personalized weekly schedules synced with pantry stock</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableMealPlanning}
                  onChange={(e) => setEnableMealPlanning(e.target.checked)}
                  className="w-5 h-5 accent-[#2D5A43] cursor-pointer"
                />
              </div>

              {enableMealPlanning && (
                <div className="p-4 bg-white rounded-2xl border border-[#E6DFD5] space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Included Meal Slots
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((slot) => {
                        const isSelected = mealPlanSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleMealSlot(slot)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                              isSelected
                                ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                                : 'bg-white text-gray-700 border-gray-300'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggestion Priorities */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Meal Suggestions Should Prioritize
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'pantry', label: 'Pantry Ingredients' },
                        { id: 'time', label: 'Preparation Time' },
                        { id: 'budget', label: 'Budget Friendly' },
                        { id: 'variety', label: 'Culinary Variety' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMealPlanPriority(item.id as any)}
                          className={`p-2 rounded-xl border text-xs font-semibold text-center cursor-pointer ${
                            mealPlanPriority === item.id
                              ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Food Budget Configuration */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Grocery / Food Budget Limit
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'none', label: 'No Budget Limit' },
                    { id: 'weekly', label: 'Weekly Budget' },
                    { id: 'daily', label: 'Daily Budget' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetPeriod(b.id as any)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border text-center cursor-pointer ${
                        budgetPeriod === b.id
                          ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                {budgetPeriod !== 'none' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Budget Amount ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={budgetAmount || ''}
                        onChange={(e) => setBudgetAmount(Number(e.target.value) || undefined)}
                        placeholder="e.g. 3000"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 6: NOTIFICATION PREFERENCES
            ========================================================= */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <Bell className="w-3.5 h-3.5" />
                <span>Notification Preferences</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Reminders & In-App Alerts
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                Choose which reminders you would like to receive. Each category can be toggled independently.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'restock',
                  title: 'Low Stock Restock Alerts',
                  desc: 'Notifies you when pantry staples reach the depletion threshold and auto-adds to shopping list',
                },
                {
                  id: 'expiring',
                  title: 'Expiring Ingredients Alerts',
                  desc: 'Alerts you 3 days before perishable items in your fridge or pantry expire',
                },
                {
                  id: 'timers',
                  title: 'Cooking Timers & Alarms',
                  desc: 'Visual and audio chime countdown completion alerts during recipe preparation',
                },
                {
                  id: 'mealPlans',
                  title: 'Meal Planning Reminders',
                  desc: 'Daily meal schedule suggestions and prep recommendations',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5]"
                >
                  <div className="pr-4">
                    <div className="text-xs sm:text-sm font-bold text-[#1F2421]">{item.title}</div>
                    <div className="text-[11px] text-[#5A625B] leading-relaxed">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={(notifications as any)[item.id]}
                    onChange={(e) =>
                      setNotifications({ ...notifications, [item.id]: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#2D5A43] cursor-pointer shrink-0"
                  />
                </div>
              ))}

              {/* Browser notification permission request banner */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Browser Audio & Push Notifications</div>
                  <div className="text-[11px] text-emerald-800">
                    Status: {notificationPermissionStatus === 'granted' ? 'Enabled' : 'Not granted yet (In-app alerts are active)'}
                  </div>
                </div>

                {notificationPermissionStatus !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestBrowserNotificationPermission}
                    className="px-3 py-1.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Enable Browser Alerts
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FINAL REVIEW SCREEN (STEP 7)
            ========================================================= */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preferences Review</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1F2421]">
                Review Your Kitchen Profile
              </h2>
              <p className="text-xs sm:text-sm text-[#5A625B] mt-1">
                Everything looks great! You can tap Edit on any section below or click "Start Using Zestiquee" to enter your kitchen.
              </p>
            </div>

            <div className="space-y-3">
              {/* Section 1 */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Name & Household</div>
                  <div className="text-sm font-bold text-[#1F2421]">
                    {name} • Household of {householdSize} {householdSize === 1 ? 'person' : 'people'}
                  </div>
                  {country && <div className="text-xs text-[#5A625B]">Region: {country} {userRole ? `(${userRole})` : ''}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#2D5A43] font-bold underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 2 */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Dietary & Food Safety</div>
                  <div className="text-sm font-bold text-[#1F2421]">
                    {enableDietaryPreferences && selectedDiets.length > 0
                      ? selectedDiets.join(', ')
                      : 'No special restrictions (Unrestricted)'}
                  </div>
                  <div className="text-xs text-rose-700 font-medium">
                    Allergies: {selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'None specified'}
                  </div>
                  {dislikedFoods.length > 0 && (
                    <div className="text-xs text-gray-500">Dislikes: {dislikedFoods.join(', ')}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-[#2D5A43] font-bold underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 3 */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Cooking & Formats</div>
                  <div className="text-sm font-bold text-[#1F2421]">
                    {cookingSkill.toUpperCase()} • {preferredCuisines.slice(0, 3).join(', ')}
                  </div>
                  <div className="text-xs text-[#5A625B]">
                    {measurementUnit === 'metric' ? 'Metric Units' : 'Imperial Units'} • Currency: {currency}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs text-[#2D5A43] font-bold underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Section 4 */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E6DFD5] flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Meal Planning & Alerts</div>
                  <div className="text-sm font-bold text-[#1F2421]">
                    {enableMealPlanning ? 'Meal Planner Active' : 'On-demand meals'} • Budget:{' '}
                    {budgetPeriod !== 'none' && budgetAmount ? `${currency}${budgetAmount} (${budgetPeriod})` : 'No budget set'}
                  </div>
                  <div className="text-xs text-[#5A625B]">
                    Restock, Expiry & Cooking Timer alerts enabled
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="text-xs text-[#2D5A43] font-bold underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-[#E6DFD5] flex items-center justify-between gap-3">
          {step > 1 && step <= 6 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <div className="flex items-center space-x-2">
              {step >= 3 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-900 transition cursor-pointer"
                >
                  Skip for Now
                </button>
              )}
              <button
                type="button"
                disabled={step === 1 && !canProceedStep1}
                onClick={() => setStep((s) => s + 1)}
                className="px-7 py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : step === 6 ? (
            <button
              type="button"
              onClick={() => setStep(7)}
              className="px-7 py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <span>Review Preferences</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            /* Step 7: Final Submit */
            <button
              type="button"
              disabled={isSaving}
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-bold text-sm shadow-lg shadow-[#2D5A43]/25 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Your Kitchen Profile...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Using Zestiquee</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
