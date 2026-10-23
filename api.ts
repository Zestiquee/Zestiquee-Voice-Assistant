import { UserProfile, PantryItem, ShoppingItem, Timer, Recipe, MealPlan, TwoOptionRecipePair } from '../types';

const TOKEN_KEY = 'zestiquee_session_token';

export const authStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to save session token to localStorage:', e);
    }
  },
  clearToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to clear session token:', e);
    }
  },
};

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers = {}, ...rest } = options;
  const token = authStorage.getToken();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
    reqHeaders['x-session-token'] = token;
  }

  const response = await fetch(endpoint, {
    ...rest,
    headers: reqHeaders,
  });

  if (response.status === 401 && !skipAuth) {
    // Session expired or unauthorized
    authStorage.clearToken();
    window.dispatchEvent(new CustomEvent('zestiquee_unauthorized'));
    throw new Error('Unauthorized session. Please authenticate.');
  }

  const data = await response.json();
  return data;
}

export const api = {
  // Auth endpoints
  getAuthConfig: async () => {
    return apiRequest<{ success: boolean; googleClientId: string }>('/api/auth/config', { skipAuth: true });
  },

  signup: async (payload: { name: string; email: string; password: string; language?: string }) => {
    return apiRequest<{ success: boolean; token: string; user: UserProfile; error?: string }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      }
    );
  },

  login: async (payload: { email: string; password: string }) => {
    return apiRequest<{ success: boolean; token: string; user: UserProfile; isNewUser?: boolean; error?: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      }
    );
  },

  googleAuth: async (payload: { credential?: string; email?: string; name?: string; googleId?: string; language?: string }) => {
    return apiRequest<{ success: boolean; token: string; user: UserProfile; isNewUser?: boolean; error?: string }>(
      '/api/auth/google',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      }
    );
  },

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clearToken();
    }
  },

  resetPassword: async (payload: { email: string; newPassword?: string }) => {
    return apiRequest<{ success: boolean; message: string; error?: string }>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      }
    );
  },

  deleteAccount: async () => {
    const res = await apiRequest<{ success: boolean; message: string }>('/api/auth/account', {
      method: 'DELETE',
    });
    authStorage.clearToken();
    return res;
  },

  getMe: async () => {
    return apiRequest<{ success: boolean; user: UserProfile }>('/api/auth/me');
  },

  // User profile
  getUserProfile: async () => {
    return apiRequest<{ success: boolean; user: UserProfile }>('/api/user');
  },

  saveUserProfile: async (updates: Partial<UserProfile>) => {
    return apiRequest<{ success: boolean; user: UserProfile }>('/api/user', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  saveOnboarding: async (profile: Partial<UserProfile>) => {
    return apiRequest<{ success: boolean; user: UserProfile }>('/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  // Pantry
  getPantry: async () => {
    return apiRequest<{ success: boolean; items: PantryItem[] }>('/api/pantry');
  },

  addPantryItem: async (item: Partial<PantryItem> | Partial<PantryItem>[]) => {
    return apiRequest<{ success: boolean; items: PantryItem[]; allPantry: PantryItem[] }>('/api/pantry', {
      method: 'POST',
      body: JSON.stringify(Array.isArray(item) ? { items: item } : item),
    });
  },

  updatePantryItem: async (id: string, updates: Partial<PantryItem>) => {
    return apiRequest<{ success: boolean; item: PantryItem }>(`/api/pantry/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deletePantryItem: async (id: string) => {
    return apiRequest<{ success: boolean; id: string }>(`/api/pantry/${id}`, {
      method: 'DELETE',
    });
  },

  consumePantryItem: async (id: string, consumeAmount: number) => {
    return apiRequest<{ success: boolean; item: PantryItem; depleted: boolean }>('/api/pantry/consume', {
      method: 'POST',
      body: JSON.stringify({ id, consumeAmount }),
    });
  },

  // Shopping list
  getShopping: async () => {
    return apiRequest<{ success: boolean; items: ShoppingItem[] }>('/api/shopping');
  },

  addShoppingItem: async (items: Partial<ShoppingItem>[]) => {
    return apiRequest<{ success: boolean; items: ShoppingItem[]; allShopping: ShoppingItem[] }>('/api/shopping', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  updateShoppingItem: async (id: string, updates: Partial<ShoppingItem>) => {
    return apiRequest<{ success: boolean; item: ShoppingItem }>(`/api/shopping/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteShoppingItem: async (id: string) => {
    return apiRequest<{ success: boolean; id: string }>(`/api/shopping/${id}`, {
      method: 'DELETE',
    });
  },

  transferPurchasedToPantry: async (itemIds?: string[]) => {
    return apiRequest<{
      success: boolean;
      transferredCount: number;
      pantry: PantryItem[];
      shopping: ShoppingItem[];
    }>('/api/shopping/transfer-to-pantry', {
      method: 'POST',
      body: JSON.stringify({ itemIds }),
    });
  },

  // Timers
  getTimers: async () => {
    return apiRequest<{ success: boolean; timers: Timer[] }>('/api/timers');
  },

  startTimer: async (label: string, durationSeconds: number, recipeId?: string, stepNumber?: number) => {
    return apiRequest<{ success: boolean; timer: Timer }>('/api/timers', {
      method: 'POST',
      body: JSON.stringify({ label, durationSeconds, recipeId, stepNumber }),
    });
  },

  togglePauseTimer: async (id: string, isPaused: boolean) => {
    return apiRequest<{ success: boolean; timer: Timer }>(`/api/timers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isPaused }),
    });
  },

  cancelTimer: async (id: string) => {
    return apiRequest<{ success: boolean; id: string }>(`/api/timers/${id}`, {
      method: 'DELETE',
    });
  },

  // Saved recipes
  getSavedRecipes: async () => {
    return apiRequest<{ success: boolean; recipes: Recipe[] }>('/api/recipes/saved');
  },

  saveRecipe: async (recipe: Recipe) => {
    return apiRequest<{ success: boolean; savedRecipes: Recipe[] }>('/api/recipes/save', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },

  removeSavedRecipe: async (id: string) => {
    return apiRequest<{ success: boolean; id: string; savedRecipes: Recipe[] }>(`/api/recipes/saved/${id}`, {
      method: 'DELETE',
    });
  },

  // Meal plans
  getMealPlans: async () => {
    return apiRequest<{ success: boolean; plans: MealPlan[] }>('/api/meal-plans');
  },

  saveMealPlan: async (plan: MealPlan) => {
    return apiRequest<{ success: boolean; plan: MealPlan }>('/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  },

  generateShoppingFromMealPlan: async (mealPlan: MealPlan) => {
    return apiRequest<{ success: boolean; addedCount: number; shoppingList: ShoppingItem[] }>(
      '/api/meal-plans/generate-shopping-list',
      {
        method: 'POST',
        body: JSON.stringify({ mealPlan }),
      }
    );
  },

  // Assistant & Chat
  sendChatMessage: async (message: string, conversationHistory: any[] = []) => {
    return apiRequest<{
      success: boolean;
      textResponse: string;
      spokenAudioBase64?: string;
      recipePair: TwoOptionRecipePair | null;
      toolExecutions: Array<{ toolName: string; summary: string }>;
      updatedPantry?: PantryItem[];
      updatedShopping?: ShoppingItem[];
      updatedTimers?: Timer[];
      error?: string;
    }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  },

  transcribeAudio: async (audioBase64: string, mimeType: string = 'audio/webm', language: string = 'en') => {
    return apiRequest<{
      success: boolean;
      transcript?: string;
      error?: string;
    }>('/api/assistant/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType, language }),
    });
  },

  textToSpeech: async (text: string, voiceName: string = 'Kore', languageCode: string = 'en') => {
    return apiRequest<{
      success: boolean;
      audioBase64?: string;
      audioMimeType?: string;
      fallbackToBrowser?: boolean;
      error?: string;
    }>('/api/assistant/tts', {
      method: 'POST',
      body: JSON.stringify({ text, voiceName, languageCode }),
    });
  },

  searchYouTube: async (dish: string, language: string = 'English', skillLevel: string = 'beginner') => {
    const params = new URLSearchParams({ dish, language, skillLevel });
    return apiRequest<{
      success: boolean;
      dish: string;
      searchQuery: string;
      recommendations: any[];
    }>(`/api/youtube/search?${params.toString()}`, { skipAuth: true });
  },
};
