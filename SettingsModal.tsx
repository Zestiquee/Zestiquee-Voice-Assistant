import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { SUPPORTED_LANGUAGES, getLanguage } from '../i18n/languages';
import { UserProfile } from '../types';
import { api } from '../services/api';
import {
  X,
  ShieldAlert,
  Globe,
  Sliders,
  Users,
  Utensils,
  Volume2,
  DollarSign,
  Ruler,
  Check,
  LogOut,
  Trash2,
  Bell,
  Lock,
  User,
  Heart,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface SettingsModalProps {
  t: AppTranslations;
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveUser: (updates: Partial<UserProfile>) => Promise<void>;
  onTestVoice: (voiceName: string, lang: string) => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onOpenLanguageSelector?: () => void;
}

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Gluten / Wheat',
  'Dairy / Lactose',
  'Eggs',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
];

const COMMON_DIETS = [
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'Non-vegetarian',
  'Pescatarian',
  'Jain',
  'Halal',
  'Kosher',
];

const COMMON_CUISINES = [
  'South Indian',
  'North Indian',
  'Italian',
  'Mexican',
  'East Asian / Thai',
  'Mediterranean',
  'American',
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  t,
  user,
  isOpen,
  onClose,
  onSaveUser,
  onTestVoice,
  onLogout,
  onDeleteAccount,
  onOpenLanguageSelector,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'language' | 'dietary' | 'kitchen' | 'notifications' | 'account'>('profile');
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Delete account confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Custom additions
  const [customAllergy, setCustomAllergy] = useState('');
  const [customDislike, setCustomDislike] = useState('');

  // Password reset inside settings
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  if (!isOpen) return null;

  const toggleAllergy = (allergy: string) => {
    const list = formData.allergies || [];
    const exists = list.includes(allergy);
    setFormData({
      ...formData,
      allergies: exists ? list.filter((a) => a !== allergy) : [...list, allergy],
    });
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !(formData.allergies || []).includes(customAllergy.trim())) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), customAllergy.trim()],
      });
      setCustomAllergy('');
    }
  };

  const addCustomDislike = () => {
    if (customDislike.trim() && !(formData.dislikedFoods || []).includes(customDislike.trim())) {
      setFormData({
        ...formData,
        dislikedFoods: [...(formData.dislikedFoods || []), customDislike.trim()],
      });
      setCustomDislike('');
    }
  };

  const removeDislike = (item: string) => {
    setFormData({
      ...formData,
      dislikedFoods: (formData.dislikedFoods || []).filter((d) => d !== item),
    });
  };

  const toggleDiet = (diet: string) => {
    const list = formData.dietaryPreferences || [];
    const exists = list.includes(diet);
    setFormData({
      ...formData,
      dietaryPreferences: exists ? list.filter((d) => d !== diet) : [...list, diet],
    });
  };

  const toggleCuisine = (cuisine: string) => {
    const list = formData.preferredCuisines || [];
    const exists = list.includes(cuisine);
    setFormData({
      ...formData,
      preferredCuisines: exists ? list.filter((c) => c !== cuisine) : [...list, cuisine],
    });
  };

  const toggleEquipment = (eq: string) => {
    const list = formData.equipment || [];
    const exists = list.includes(eq);
    setFormData({
      ...formData,
      equipment: exists ? list.filter((e) => e !== eq) : [...list, eq],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      await onSaveUser(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      onLogout();
    } catch (e) {
      console.warn('Logout error:', e);
      setIsLoggingOut(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setErrorMessage('Please type "DELETE" to confirm permanent account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteAccount();
      if (onDeleteAccount) {
        onDeleteAccount();
      } else {
        onLogout();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordNotice('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await api.resetPassword({
        email: formData.email || '',
        newPassword,
      });
      if (res.success) {
        setPasswordNotice('Password successfully changed!');
        setNewPassword('');
        setTimeout(() => setShowPasswordChange(false), 2000);
      } else {
        setPasswordNotice(res.error || 'Password update failed.');
      }
    } catch (e: any) {
      setPasswordNotice(e.message || 'Error updating password.');
    }
  };

  const currentLangObj = getLanguage(formData.displayLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E6DFD5] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#2D5A43] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sliders className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold">
                {t.settingsTitle || 'Settings & Household Preferences'}
              </h2>
              <p className="text-xs text-emerald-100/80">
                Logged in as <strong>{formData.name}</strong> ({formData.email || 'Email user'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto bg-white border-b border-[#E6DFD5] px-2 py-1 space-x-1">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'language', label: 'Language & Voice', icon: Globe },
            { id: 'dietary', label: 'Diet & Allergies', icon: Heart },
            { id: 'kitchen', label: 'Cooking & Formats', icon: Utensils },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'account', label: 'Account & Security', icon: Lock },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#EBF3EE] text-[#2D5A43] font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1F2421]">Personal Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t.householdSize || 'Household Size'} (Persons)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.householdSize}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          householdSize: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country / Region</label>
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. India, United States"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Description</label>
                    <input
                      type="text"
                      value={formData.userRole || ''}
                      onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                      placeholder="e.g. Working professional, Homemaker"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LANGUAGE & VOICE */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1F2421]">Display & Kitchen Language</h3>
                    <p className="text-xs text-gray-500">
                      Currently using: <strong>{currentLangObj.name} ({currentLangObj.nativeName})</strong>
                    </p>
                  </div>
                  {onOpenLanguageSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLanguageSelector();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#2D5A43] text-white text-xs font-semibold hover:bg-[#234734] transition cursor-pointer"
                    >
                      Browse All 38+ Languages
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t.displayLang || 'Interface Language'}
                    </label>
                    <select
                      value={formData.displayLanguage}
                      onChange={(e) => {
                        const newLang = e.target.value;
                        setFormData({
                          ...formData,
                          displayLanguage: newLang,
                          inputLanguage: newLang,
                          responseLanguage: newLang,
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name} ({l.nativeName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Speech / Voice Language
                    </label>
                    <select
                      value={formData.responseLanguage}
                      onChange={(e) => setFormData({ ...formData, responseLanguage: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name} ({l.speechLangCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Voice Model & Pronunciation Test */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-700">Assistant Voice Model</label>
                    <button
                      type="button"
                      onClick={() =>
                        onTestVoice(
                          formData.voicePreference || 'Kore',
                          getLanguage(formData.responseLanguage).speechLangCode
                        )
                      }
                      className="text-xs text-[#2D5A43] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test Pronunciation</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setFormData({ ...formData, voicePreference: v })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${
                          formData.voicePreference === v
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIETARY & ALLERGIES */}
          {activeTab === 'dietary' && (
            <div className="space-y-4">
              {/* Dietary Preferences */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1F2421]">Dietary Habits</h3>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIETS.map((diet) => {
                    const isSelected = (formData.dietaryPreferences || []).includes(diet);
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
              </div>

              {/* Strict Allergies */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Strict Allergies & Food Intolerances</span>
                </div>
                <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-relaxed">
                  Zestiquee strictly prevents suggesting recipes or substitutions with these ingredients. Always verify ingredient packages for cross-contamination.
                </div>

                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = (formData.allergies || []).includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-rose-400'
                        }`}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    placeholder="Add custom allergen"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergy}
                    className="px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Disliked Foods */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1F2421]">Disliked Ingredients</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customDislike}
                    onChange={(e) => setCustomDislike(e.target.value)}
                    placeholder="e.g. Bitter gourd, Cilantro, Olives"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={addCustomDislike}
                    className="px-3 py-1.5 rounded-xl bg-gray-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Add Dislike
                  </button>
                </div>

                {(formData.dislikedFoods || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(formData.dislikedFoods || []).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => removeDislike(item)}
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
          )}

          {/* TAB 4: COOKING & FORMATS */}
          {activeTab === 'kitchen' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cooking Experience</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({ ...formData, cookingSkill: lvl as any })}
                        className={`p-2.5 rounded-xl text-xs font-semibold capitalize border cursor-pointer ${
                          formData.cookingSkill === lvl
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Cuisines */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Favorite Cuisines</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CUISINES.map((c) => {
                      const isSelected = (formData.preferredCuisines || []).includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCuisine(c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                            isSelected
                              ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-[#2D5A43]'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Units & Currency */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Measurement Units</label>
                    <select
                      value={formData.measurementUnit}
                      onChange={(e) => setFormData({ ...formData, measurementUnit: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
                    >
                      <option value="metric">Metric (g, kg, ml, L)</option>
                      <option value="imperial">Imperial (oz, lb, cups)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Currency Symbol</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
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

                {/* Equipment */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kitchen Appliances</label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_EQUIPMENT.map((eq) => {
                      const isSelected = (formData.equipment || []).includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                            isSelected
                              ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                              : 'bg-white border-gray-200 text-gray-700'
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

          {/* TAB 5: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
                <h3 className="font-serif font-bold text-sm text-[#1F2421]">In-App & Cooking Reminders</h3>
                {[
                  { id: 'restock', title: 'Low Stock Restock Alerts', desc: 'Notify when pantry items are running low and sync to shopping list' },
                  { id: 'expiring', title: 'Perishable Expiry Warnings', desc: 'Warn when fresh ingredients are nearing expiration' },
                  { id: 'timers', title: 'Timer Sounds & Visual Countdowns', desc: 'Active audible chime and banner alerts for step timers' },
                  { id: 'mealPlans', title: 'Meal Plan Reminders', desc: 'Daily recommendations and grocery prep advice' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div>
                      <div className="text-xs font-bold text-gray-800">{item.title}</div>
                      <div className="text-[11px] text-gray-500">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.notificationPreferences?.[item.id as keyof typeof formData.notificationPreferences])}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationPreferences: {
                            ...(formData.notificationPreferences || { restock: true, expiring: true, timers: true, mealPlans: true }),
                            [item.id]: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 accent-[#2D5A43] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DFD5] space-y-4">
                <h3 className="font-serif font-bold text-sm text-[#1F2421]">Account Credentials</h3>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div><strong>Account Email:</strong> {formData.email || 'None'}</div>
                  <div className="mt-1"><strong>Auth Method:</strong> {formData.authMethod === 'google' ? 'Google Account' : 'Email & Password'}</div>
                </div>

                {/* Password Change Option */}
                {formData.authMethod !== 'google' && (
                  <div className="pt-2">
                    {!showPasswordChange ? (
                      <button
                        type="button"
                        onClick={() => setShowPasswordChange(true)}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#2D5A43]" />
                        <span>Change Password</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DFD5] space-y-3">
                        <label className="block text-xs font-semibold text-gray-700">Enter New Password (min 6 chars)</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            minLength={6}
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={handlePasswordChangeSubmit}
                            className="px-3 py-1.5 rounded-xl bg-[#2D5A43] text-white text-xs font-semibold cursor-pointer"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPasswordChange(false)}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        {passwordNotice && <div className="text-xs text-[#2D5A43] font-semibold">{passwordNotice}</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* Logout Button */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Session Management</div>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-amber-700" />
                    <span>Log Out of Zestiquee</span>
                  </button>
                  <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                    Logging out safely invalidates your session. Your pantry, recipes, and preferences will be preserved when you log in again.
                  </p>
                </div>

                {/* Delete Account Button */}
                <div className="pt-4 border-t border-rose-200">
                  <div className="text-xs font-semibold text-rose-800 mb-2">Danger Zone</div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Account & Erase All Kitchen Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E6DFD5]">
            <div className="text-xs text-emerald-800 font-semibold">
              {saveSuccess && 'Preferences saved successfully!'}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{t.saveSettings || 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-gray-200 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-bold text-lg text-[#1F2421]">Log Out?</h3>
                <p className="text-xs text-[#5A625B] mt-1 leading-relaxed">
                  Are you sure you want to log out? Your pantry ingredients, saved recipes, and meal plans remain safely preserved for your next login.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLoggingOut ? 'Logging out...' : 'Confirm Log Out'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE ACCOUNT CONFIRMATION MODAL */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-rose-300 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-bold text-lg text-rose-900">Permanent Account Deletion</h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  This action is permanent and cannot be undone. All your pantry items, shopping lists, meal plans, and saved recipes will be erased from the database.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Type <strong className="text-rose-700">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmationText('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
                  onClick={handleConfirmDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? 'Deleting...' : 'Erase Everything'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
