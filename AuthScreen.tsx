import React, { useState, useEffect, useRef } from 'react';
import { AppTranslations } from '../i18n/translations';
import { getLanguage } from '../i18n/languages';
import { UserProfile } from '../types';
import { api, authStorage } from '../services/api';
import {
  ChefHat,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Globe,
  Loader2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface AuthScreenProps {
  t: AppTranslations;
  currentLang: string;
  onBackToLanguage: () => void;
  onAuthenticated: (user: UserProfile, isNewUser: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  t,
  currentLang,
  onBackToLanguage,
  onAuthenticated,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup inputs
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Password reset flow
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Google OAuth configuration & GIS state
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const langObj = getLanguage(currentLang);

  // Check backend for Google OAuth credentials
  useEffect(() => {
    api.getAuthConfig().then((cfg) => {
      if (cfg && cfg.googleClientId) {
        setGoogleClientId(cfg.googleClientId);
        initGoogleIdentityServices(cfg.googleClientId);
      }
    }).catch((err) => {
      console.warn('Could not fetch auth config:', err);
    });
  }, []);

  const initGoogleIdentityServices = (clientId: string) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnRef.current) {
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular',
          });
        }
      } catch (err) {
        console.warn('Google Identity Services init error:', err);
      }
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.googleAuth({
        credential: response.credential,
        language: currentLang,
      });

      if (res.success && res.token && res.user) {
        authStorage.setToken(res.token);
        onAuthenticated(res.user, res.isNewUser || false);
      } else {
        setErrorMessage(res.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication encountered a network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      setErrorMessage('Please enter a valid Google account email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.googleAuth({
        email: googleEmailInput.trim().toLowerCase(),
        name: googleEmailInput.split('@')[0],
        googleId: 'g_' + Math.random().toString(36).substring(2, 10),
        language: currentLang,
      });

      if (res.success && res.token && res.user) {
        authStorage.setToken(res.token);
        setIsGoogleModalOpen(false);
        onAuthenticated(res.user, res.isNewUser || false);
      } else {
        setErrorMessage(res.error || 'Google authentication failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (res.success && res.token && res.user) {
        authStorage.setToken(res.token);
        onAuthenticated(res.user, res.isNewUser || false);
      } else {
        setErrorMessage(res.error || 'Invalid email address or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to log in. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signupName.trim()) {
      setErrorMessage('Please enter your preferred name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@') || !signupEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        language: currentLang,
      });

      if (res.success && res.token && res.user) {
        authStorage.setToken(res.token);
        // New user created -> proceed to comprehensive multi-step onboarding
        onAuthenticated(res.user, true);
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to register account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setErrorMessage('Please provide a valid registered email address.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        email: resetEmail.trim(),
        newPassword: newPassword || undefined,
      });

      if (res.success) {
        setSuccessMessage(res.message);
        if (newPassword) {
          setTimeout(() => {
            setIsResettingPassword(false);
            setTab('login');
            setLoginEmail(resetEmail);
            setSuccessMessage('Password successfully updated! Please log in with your new password.');
          }, 1500);
        }
      } else {
        setErrorMessage(res.error || 'Failed to process password reset request.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with password recovery service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F2421] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#E6DFD5] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#2D5A43] text-white p-6 sm:p-8 text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-xs">
            <ChefHat className="w-7 h-7 text-[#EBF3EE]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            {tab === 'login' ? 'Sign in to Zestiquee' : 'Create Your Kitchen Account'}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-sm mx-auto">
            Your personal, voice-first kitchen assistant with isolated pantry, shopping list, and culinary plans.
          </p>

          {/* Change language pill */}
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={onBackToLanguage}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/20 hover:bg-black/30 text-white/90 text-xs transition border border-white/10 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-200" />
              <span>Language: <strong>{langObj.name} ({langObj.nativeName})</strong></span>
              <span className="text-emerald-200 underline ml-1">Change</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        {!isResettingPassword && (
          <div className="flex border-b border-[#E6DFD5] bg-[#FAF7F2]">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                tab === 'login'
                  ? 'bg-white border-b-2 border-[#2D5A43] text-[#2D5A43]'
                  : 'text-[#5A625B] hover:text-[#1F2421]'
              }`}
            >
              Log In (Existing Account)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition text-center cursor-pointer ${
                tab === 'signup'
                  ? 'bg-white border-b-2 border-[#2D5A43] text-[#2D5A43]'
                  : 'text-[#5A625B] hover:text-[#1F2421]'
              }`}
            >
              Sign Up (New Cook)
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Status Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {/* Option 1: Continue with Google */}
          {!isResettingPassword && (
            <div>
              <div className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                Option 1: Google Authentication
              </div>

              {googleClientId ? (
                <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-3 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E6DFD5]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-[#5A625B] font-semibold">
                    Or Continue with Email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Option 2: Email Authentication */}
          {isResettingPassword ? (
            /* Password Reset Sub-flow */
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#1F2421]">Reset Password</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingPassword(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-[#2D5A43] hover:underline"
                >
                  ← Back to Log In
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    minLength={6}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Set New Password & Complete Reset</span>
                  </>
                )}
              </button>
            </form>
          ) : tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setResetEmail(loginEmail);
                      setErrorMessage('');
                    }}
                    className="text-xs text-[#2D5A43] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#2D5A43]/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to My Kitchen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Snikitha, Alex, Priya"
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password (min 6 chars) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#2D5A43]/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Footnote */}
          <div className="pt-4 border-t border-[#E6DFD5] text-center text-[11px] text-[#5A625B]">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[#2D5A43]" />
            Strict data separation: Your pantry, shopping list, and saved recipes are securely isolated to your account.
          </div>
        </div>
      </div>

      {/* Google OAuth Modal Dialog for environments without GIS Client ID configured */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E6DFD5] shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F2421]">Continue with Google</h3>
                <p className="text-xs text-[#5A625B]">Google Identity Services Authentication</p>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-relaxed">
              <strong>OAuth Setup Note:</strong> To enable one-tap Google popups on custom domains, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code> in your environment or <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env.example</code>.
              <br /><br />
              Enter your Google account email below to authenticate and establish your isolated user account:
            </div>

            <form onSubmit={handleManualGoogleAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#2D5A43] text-white text-xs font-semibold hover:bg-[#234734] transition shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
