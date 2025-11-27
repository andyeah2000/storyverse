import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
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
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[28px] font-bold tracking-tight mb-2 text-stone-900">
              Welcome back
            </h1>
            <p className="text-stone-500">
              Sign in to continue writing
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl text-sm text-center bg-red-50 border border-red-100 text-red-600">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-stone-900">
                Email
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-stone-900">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm transition-colors text-stone-500 hover:text-stone-900"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-[52px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 bg-stone-900 text-white hover:bg-stone-800"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <Link
            to="/"
            className="mt-6 inline-flex w-full h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] border border-stone-200 text-stone-700 hover:bg-stone-100"
          >
            <ArrowLeft size={16} />
            Back to landing
          </Link>

          {/* Secondary CTA */}
          <p className="text-center text-[15px] mt-8 text-stone-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold hover:underline text-stone-900">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-5 text-center">
        <p className="text-xs text-stone-400">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="underline transition-colors hover:text-stone-600">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="underline transition-colors hover:text-stone-600">Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
};

export default Login;
