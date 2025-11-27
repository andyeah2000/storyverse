import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check, CheckCircle, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const { resetPassword, isSupabaseMode } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [linkValid, setLinkValid] = useState(!isSupabaseMode);
  const [isCheckingLink, setIsCheckingLink] = useState(isSupabaseMode);

  const passwordRequirements = [
    { met: password.length >= 8, text: '8+ chars' },
    { met: /[A-Z]/.test(password), text: 'Uppercase' },
    { met: /[0-9]/.test(password), text: 'Number' },
  ];

  const allRequirementsMet = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    const verifyRecoverySession = async () => {
      if (!isSupabaseMode) {
        setLinkValid(true);
        setIsCheckingLink(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setLinkValid(Boolean(session));
      } catch (error) {
        console.error('Failed to verify recovery session:', error);
        setLinkValid(false);
      } finally {
        setIsCheckingLink(false);
      }
    };

    verifyRecoverySession();
  }, [isSupabaseMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSupabaseMode && isCheckingLink) {
      setError('Verifying reset link. Please try again in a moment.');
      return;
    }

    if (isSupabaseMode && !linkValid) {
      setError('Invalid reset link');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(password);
    
    if (result.success) {
      setIsSuccess(true);
      setIsLoading(false);
    } else {
      setError(result.error || 'Reset failed');
      setIsLoading(false);
    }
  };

  // Invalid Supabase link state
  if (!isCheckingLink && isSupabaseMode && !linkValid) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300 bg-stone-50">
        <header className="px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-stone-900">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-stone-900">
              StoryVerse
            </span>
          </Link>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="text-center max-w-[360px]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-100">
              <AlertTriangle size={32} className="text-amber-600" />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight mb-3 text-stone-900">
              Invalid Reset Link
            </h1>
            <p className="text-[15px] mb-8 text-stone-500">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800"
            >
              Request New Link
              <ArrowRight size={18} />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-stone-50">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-stone-900">
            <span className="text-xs font-bold text-white">S</span>
          </div>
          <span className="text-sm font-semibold text-stone-900">
            StoryVerse
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[360px]">
          {isSuccess ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-100">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h1 className="text-[28px] font-bold tracking-tight mb-3 text-stone-900">
                Password reset!
              </h1>
              <p className="text-[15px] mb-8 text-stone-500">
                Your password has been successfully reset.
              </p>
              <Link
                to="/login"
                className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800"
              >
                Sign In
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 bg-stone-100">
                  <Lock size={24} className="text-stone-500" />
                </div>
                <h1 className="text-[28px] font-bold tracking-tight mb-2 text-stone-900">
                  Set new password
                </h1>
                <p className="text-stone-500">
                  Create a strong password for your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl text-sm text-center bg-red-50 border border-red-100 text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2 text-stone-900">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      autoComplete="new-password"
                      autoFocus
                      className="w-full h-[52px] px-4 pr-12 rounded-xl border outline-none transition-all bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors text-stone-400 hover:text-stone-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-4 mt-3">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                            req.met ? 'bg-emerald-500' : 'bg-stone-200'
                          }`}>
                            {req.met && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-xs ${
                            req.met ? 'text-emerald-500' : 'text-stone-400'
                          }`}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium mb-2 text-stone-900">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                    className={`w-full h-[52px] px-4 rounded-xl border outline-none transition-all ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          : 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'bg-white border-stone-200 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
                    } ${
                      'bg-white text-stone-900 placeholder:text-stone-400'
                    }`}
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-2 text-xs text-red-500">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                  className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 bg-stone-900 text-white hover:bg-stone-800"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
              
              <Link
                to="/login"
                className="mt-6 inline-flex w-full h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border border-stone-200 text-stone-700 hover:bg-stone-100"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
              
              <p className="text-center text-[15px] mt-8 text-stone-500">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold hover:underline text-stone-900">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
