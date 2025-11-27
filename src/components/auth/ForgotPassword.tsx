import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await forgotPassword(email);
    
    if (result.success) {
      setIsSubmitted(true);
    } else {
      setError(result.error || 'Something went wrong');
    }
    
    setIsLoading(false);
  };

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
          {isSubmitted ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h1 className="text-[28px] font-bold tracking-tight mb-3 text-stone-900">
                Check your email
              </h1>
              <p className="text-[15px] mb-8 text-stone-500">
                We sent a reset link to<br />
                <span className="font-medium text-stone-900">{email}</span>
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-stone-900 text-white hover:bg-stone-800"
                >
                  Back to Sign In
                </Link>
                <button
                  onClick={() => { setIsSubmitted(false); setEmail(''); }}
                  className="w-full h-[52px] rounded-xl font-medium transition-all active:scale-[0.98] border border-stone-200 text-stone-600 hover:bg-stone-100"
                >
                  Try different email
                </button>
              </div>
              
              <p className="text-xs mt-8 text-stone-400">
                Didn't receive the email?{' '}
                <button 
                  onClick={handleSubmit}
                  className="underline hover:text-stone-600 transition-colors"
                >
                  Resend
                </button>
              </p>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 bg-stone-100">
                  <Mail size={24} className="text-stone-500" />
                </div>
                <h1 className="text-[28px] font-bold tracking-tight mb-2 text-stone-900">
                  Reset your password
                </h1>
                <p className="text-stone-500">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl text-sm text-center bg-red-50 border border-red-100 text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-stone-900">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full h-[52px] px-4 rounded-xl border outline-none transition-all bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 bg-stone-900 text-white hover:bg-stone-800"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
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

export default ForgotPassword;
