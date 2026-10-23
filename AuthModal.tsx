import React, { useState } from 'react';
import { AppTranslations } from '../i18n/translations';
import { UserProfile } from '../types';
import { ChefHat, ShieldCheck, Mail, ArrowRight, UserCheck, Lock, User, Sparkles, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  t: AppTranslations;
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (profile: Partial<UserProfile>) => void;
  initialMode?: 'login' | 'signup' | 'onboarding';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  t,
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'login',
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'signup' | 'onboarding'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [householdMembers, setHouseholdMembers] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');

  // Onboarding preferences state (Optional)
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    // Authenticate with Google account
    onAuthenticated({
      name: 'Google User',
      email: 'user@gmail.com',
      householdSize: 3,
      dietaryPreferences: [], // Unrestricted
      allergies: [],
      isOnboarded: true,
    });
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    // Simulate login and restore user household state
    const userName = loginEmail.split('@')[0] || 'Home Cook';
    onAuthenticated({
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: loginEmail.trim(),
      isOnboarded: true,
    });
    onClose();
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Move to optional onboarding preferences
    setAuthTab('onboarding');
    setErrorMsg('');
  };

  const handleSkipOnboarding = () => {
    // Explicit user requirement:
    // "Optional onboarding preferences with visible 'Skip for Now' button (skipping sets preferences to unspecified and must never restrict recipe categories like meat, chicken, seafood, etc.)."
    onAuthenticated({
      name: signupName.trim() || 'Home Cook',
      email: signupEmail.trim(),
      householdSize: Number(householdMembers) || 3,
      dietaryPreferences: [], // Unrestricted - allows chicken, seafood, beef, veg, etc.
      allergies: [],
      isOnboarded: true,
    });
    onClose();
  };

  const handleCompleteOnboarding = () => {
    onAuthenticated({
      name: signupName.trim() || 'Home Cook',
      email: signupEmail.trim(),
      householdSize: Number(householdMembers) || 3,
      dietaryPreferences: selectedDiets,
      allergies: selectedAllergens,
      isOnboarded: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E6DFD5] overflow-hidden">
        {/* Top visual banner */}
        <div className="bg-[#2D5A43] text-white p-7 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
            <ChefHat className="w-7 h-7 text-[#EBF3EE]" />
          </div>
          <h2 className="text-2xl font-serif font-bold">
            {authTab === 'onboarding' ? 'Culinary Personalization' : 'Welcome to Zestiquee'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {authTab === 'onboarding'
              ? 'Tailor your preferences, or skip to enjoy all cuisines freely.'
              : 'Your voice kitchen assistant with synchronized pantry & shopping.'}
          </p>
        </div>

        {/* Tab switchers if not in onboarding */}
        {authTab !== 'onboarding' && (
          <div className="flex border-b border-[#E6DFD5] bg-white">
            <button
              onClick={() => {
                setAuthTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-xs font-bold transition text-center cursor-pointer ${
                authTab === 'login'
                  ? 'border-b-2 border-[#2D5A43] text-[#2D5A43] bg-[#EBF3EE]/50'
                  : 'text-[#5A625B] hover:text-[#1F2421]'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setAuthTab('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-xs font-bold transition text-center cursor-pointer ${
                authTab === 'signup'
                  ? 'border-b-2 border-[#2D5A43] text-[#2D5A43] bg-[#EBF3EE]/50'
                  : 'text-[#5A625B] hover:text-[#1F2421]'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        <div className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {authTab === 'login' && (
            <>
              {/* Sign In With Google */}
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-2xl bg-white border border-[#D5CCC0] hover:border-[#2D5A43] text-[#1F2421] text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                <div className="flex-1 h-px bg-[#E6DFD5]" />
                <span>OR EMAIL</span>
                <div className="flex-1 h-px bg-[#E6DFD5]" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Log In to Kitchen
                </button>
              </form>
            </>
          )}

          {authTab === 'signup' && (
            <>
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-2xl bg-white border border-[#D5CCC0] hover:border-[#2D5A43] text-[#1F2421] text-xs font-semibold shadow-xs hover:shadow-md transition cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign Up with Google</span>
              </button>

              <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                <div className="flex-1 h-px bg-[#E6DFD5]" />
                <span>OR EMAIL & PASSWORD</span>
                <div className="flex-1 h-px bg-[#E6DFD5]" />
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Snikitha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm
                    </label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-[#2D5A43] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Household Members
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={householdMembers}
                    onChange={(e) => setHouseholdMembers(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Continue to Preferences →
                </button>
              </form>
            </>
          )}

          {authTab === 'onboarding' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5">
                <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Optional Culinary Preferences</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Setting preferences is completely optional. If you skip, all recipes (chicken, seafood, meat, veg) remain fully accessible and unrestricted.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1.5">
                  Dietary Habits (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Vegetarian',
                    'Non-Vegetarian',
                    'Halal',
                    'Kosher',
                    'Vegan',
                    'Jain (No Root Veggies)',
                  ].map((diet) => {
                    const isSelected = selectedDiets.includes(diet);
                    return (
                      <button
                        type="button"
                        key={diet}
                        onClick={() =>
                          setSelectedDiets((prev) =>
                            isSelected ? prev.filter((d) => d !== diet) : [...prev, diet]
                          )
                        }
                        className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1.5">
                  Allergies (Strict Safety Rule)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Peanuts', 'Tree Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Shellfish'].map(
                    (alg) => {
                      const isSelected = selectedAllergens.includes(alg);
                      return (
                        <button
                          type="button"
                          key={alg}
                          onClick={() =>
                            setSelectedAllergens((prev) =>
                              isSelected ? prev.filter((a) => a !== alg) : [...prev, alg]
                            )
                          }
                          className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-700 text-white border-rose-700'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {alg}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Action Buttons: Visible Skip for Now Button */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleSkipOnboarding}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  Skip for Now
                </button>
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex-1 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Save &amp; Enter Kitchen
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#5A625B] text-center pt-2 border-t border-[#E6DFD5]">
            Pantry inventory, shopping lists, and timers persist across sessions in your household account.
          </p>
        </div>
      </div>
    </div>
  );
};
