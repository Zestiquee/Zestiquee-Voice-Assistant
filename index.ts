export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  script?: string;
  speechLangCode: string;
  flag?: string;
}

export type StorageLocation = 'Fridge' | 'Freezer' | 'Pantry' | 'Countertop' | 'Spice Rack';

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate?: string;
  expiryDate?: string;
  storageLocation: StorageLocation;
  notes?: string;
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  notes?: string;
  purchased: boolean;
  createdAt: string;
  neededForRecipe?: string;
  isAutoRestock?: boolean;
  restockReason?: 'low_stock' | 'out_of_stock' | 'recipe';
  suggestedQuantity?: number;
  pantryQuantity?: number;
  pantryThreshold?: number;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | string;
  unit: string;
  notes?: string;
  isOptional?: boolean;
  isAvailableInPantry?: boolean;
  availableQuantity?: number | string;
  missingQuantity?: number | string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  timerMinutes?: number;
  tips?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  dietaryLabels: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  substitutions?: string[];
  cookingTips?: string[];
  commonMistakes?: string[];
  storageGuidance?: string;
  foodSafetyAdvice?: string;
  estimatedNutrition?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  youtubeQuery?: string;
  isAdapted?: boolean;
  adaptationNotes?: string;
}

export interface TwoOptionRecipePair {
  dishQuery: string;
  originalRecipe: Recipe;
  adaptedRecipe: Recipe | null;
  pantryMatchSummary: {
    totalIngredients: number;
    availableCount: number;
    missingCount: number;
    canMakeOriginal: boolean;
    canMakeAdapted: boolean;
  };
}

export interface Timer {
  id: string;
  label: string;
  durationSeconds: number;
  startTimestamp: number;
  endTimestamp: number;
  remainingSeconds: number;
  isPaused: boolean;
  pausedRemainingSeconds?: number;
  recipeId?: string;
  stepNumber?: number;
}

export interface MealPlanDay {
  date: string;
  dayName: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
}

export interface MealPlan {
  id: string;
  title: string;
  startDate: string;
  days: MealPlanDay[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  spokenAudioBase64?: string;
  recipePair?: TwoOptionRecipePair;
  toolCallsExecuted?: Array<{
    toolName: string;
    summary: string;
  }>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  displayLanguage: string;
  inputLanguage: string;
  responseLanguage: string;
  voicePreference: string;
  speechRate: number;
  householdSize: number;
  dietaryPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisines: string[];
  measurementUnit: 'metric' | 'imperial';
  currency: string;
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  budget?: number;
  isOnboarded: boolean;
  isAuthenticated?: boolean;
  country?: string;
  userRole?: string;
  spiceLevel?: string;
  cookingTimePreference?: 'quick' | 'moderate' | 'slow';
  equipment?: string[];
  budgetPeriod?: 'daily' | 'weekly' | 'none';
  mealPlanPriorities?: 'pantry' | 'time' | 'budget' | 'variety';
  mealPlanSlots?: string[];
  notificationPreferences?: {
    restock: boolean;
    expiring: boolean;
    timers: boolean;
    mealPlans: boolean;
  };
  authMethod?: 'google' | 'email' | 'guest';
}

export interface YouTubeRecommendation {
  title: string;
  channelName: string;
  searchUrl: string;
  directWatchUrl?: string;
  duration?: string;
  relevanceReason: string;
}
