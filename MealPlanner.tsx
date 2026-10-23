import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { MealPlan, UserProfile, PantryItem } from '../types';
import {
  Calendar,
  Sparkles,
  ShoppingBag,
  Plus,
  Coffee,
  Sun,
  Moon,
  Cookie,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface MealPlannerProps {
  t: AppTranslations;
  user: UserProfile;
  pantry: PantryItem[];
  mealPlans: MealPlan[];
  onSaveMealPlan: (plan: MealPlan) => Promise<void>;
  onGenerateShoppingList: (plan: MealPlan) => Promise<void>;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({
  t,
  user,
  pantry,
  mealPlans,
  onSaveMealPlan,
  onGenerateShoppingList,
}) => {
  const [currentPlan, setCurrentPlan] = useState<MealPlan>(
    mealPlans[0] || {
      id: 'mp_' + Date.now(),
      title: 'Weekly Household Plan',
      startDate: new Date().toISOString().split('T')[0],
      days: [
        {
          date: '2026-10-22',
          dayName: 'Thursday',
          breakfast: 'Warm Upma with fresh veggies',
          lunch: 'Dal Palak with Steamed Basmati Rice',
          dinner: 'Pantry Penne Pasta in light milk sauce',
          snack: 'Masala Chai & roasted nuts',
        },
        {
          date: '2026-10-23',
          dayName: 'Friday',
          breakfast: 'Soft Phulka Rotis with potato subzi',
          lunch: 'Vegetable Pulao with tomato raita',
          dinner: 'Crispy Dosa with fresh coconut chutney',
          snack: 'Filter Coffee & roasted chana',
        },
        {
          date: '2026-10-24',
          dayName: 'Saturday',
          breakfast: 'Idli Sambar with fresh coriander',
          lunch: 'Paneer Butter Masala with Jeera Rice',
          dinner: 'Vegetable Khichdi with roasted papad',
          snack: 'Ginger Tea & banana chips',
        },
      ],
    }
  );

  const [isGeneratingShopping, setIsGeneratingShopping] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const handleGenerateShopping = async () => {
    setIsGeneratingShopping(true);
    await onGenerateShoppingList(currentPlan);
    setIsGeneratingShopping(false);
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 4000);
  };

  const handleDayChange = (idx: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', val: string) => {
    const updatedDays = [...currentPlan.days];
    updatedDays[idx] = { ...updatedDays[idx], [mealType]: val };
    const updatedPlan = { ...currentPlan, days: updatedDays };
    setCurrentPlan(updatedPlan);
    onSaveMealPlan(updatedPlan);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Pantry-Connected Planning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {t.mealPlanTitle || 'Household Meal Planner'}
          </h2>
          <p className="text-sm text-[#5A625B] mt-1">
            {t.mealPlanSubtitle ||
              'Plan your weekly meals and automatically sync missing ingredients with your shopping list.'}
          </p>
        </div>

        <button
          onClick={handleGenerateShopping}
          disabled={isGeneratingShopping}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] disabled:bg-gray-400 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          {isGeneratingShopping ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          <span>{t.generateShoppingFromPlan || 'Generate Shopping List from Meal Plan'}</span>
        </button>
      </div>

      {generatedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Cross-referenced your meal plan with current pantry! Missing items added to shopping list.</span>
        </div>
      )}

      {/* Days Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentPlan.days.map((day, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs space-y-4"
          >
            <div className="border-b border-[#E6DFD5] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F2421]">
                  {day.dayName}
                </h3>
                <span className="text-xs text-[#5A625B]">{day.date}</span>
              </div>
              <span className="text-xs font-bold text-[#2D5A43] bg-[#EBF3EE] px-2.5 py-0.5 rounded-full">
                Day {idx + 1}
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Breakfast */}
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-bold text-[#5A625B] mb-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t.breakfast || 'Breakfast'}</span>
                </label>
                <input
                  type="text"
                  value={day.breakfast || ''}
                  onChange={(e) => handleDayChange(idx, 'breakfast', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#1F2421] bg-[#FAF7F2] focus:bg-white focus:ring-2 focus:ring-[#2D5A43]"
                  placeholder="e.g. Upma, Poha, Toast..."
                />
              </div>

              {/* Lunch */}
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-bold text-[#5A625B] mb-1">
                  <Sun className="w-3.5 h-3.5 text-orange-600" />
                  <span>{t.lunch || 'Lunch'}</span>
                </label>
                <input
                  type="text"
                  value={day.lunch || ''}
                  onChange={(e) => handleDayChange(idx, 'lunch', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#1F2421] bg-[#FAF7F2] focus:bg-white focus:ring-2 focus:ring-[#2D5A43]"
                  placeholder="e.g. Rice, Dal Palak, Salad..."
                />
              </div>

              {/* Snacks & Tea */}
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-bold text-[#5A625B] mb-1">
                  <Cookie className="w-3.5 h-3.5 text-yellow-700" />
                  <span>{t.snack || 'Snacks & Tea'}</span>
                </label>
                <input
                  type="text"
                  value={day.snack || ''}
                  onChange={(e) => handleDayChange(idx, 'snack', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#1F2421] bg-[#FAF7F2] focus:bg-white focus:ring-2 focus:ring-[#2D5A43]"
                  placeholder="e.g. Chai, roasted nuts..."
                />
              </div>

              {/* Dinner */}
              <div>
                <label className="flex items-center space-x-1.5 text-xs font-bold text-[#5A625B] mb-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-700" />
                  <span>{t.dinner || 'Dinner'}</span>
                </label>
                <input
                  type="text"
                  value={day.dinner || ''}
                  onChange={(e) => handleDayChange(idx, 'dinner', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-[#1F2421] bg-[#FAF7F2] focus:bg-white focus:ring-2 focus:ring-[#2D5A43]"
                  placeholder="e.g. Light pasta, Khichdi, Soup..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
