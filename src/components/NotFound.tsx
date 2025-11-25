import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks';
import { Home, ArrowLeft, Moon, Sun } from 'lucide-react';

const NotFound: React.FC = () => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Header */}
      <header className="px-6 py-5 shrink-0 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-white' : 'bg-stone-900'
          }`}>
            <span className={`text-sm font-bold ${isDark ? 'text-stone-900' : 'text-white'}`}>S</span>
          </div>
          <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
            StoryVerse
          </span>
        </Link>
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
          }`}
        >
          {isDark ? <Sun size={18} className="text-stone-400" /> : <Moon size={18} className="text-stone-500" />}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <div className={`text-[120px] font-bold leading-none mb-2 ${
            isDark ? 'text-stone-800' : 'text-stone-200'
          }`}>404</div>
          <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Page not found
          </h1>
          <p className={`mb-10 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className={`w-full sm:w-auto h-12 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isDark 
                  ? 'bg-white text-stone-900 hover:bg-stone-100' 
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              }`}
            >
              <Home size={18} />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className={`w-full sm:w-auto h-12 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isDark 
                  ? 'border border-stone-800 text-stone-300 hover:bg-stone-800' 
                  : 'border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 shrink-0">
        <div className={`max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm ${
          isDark ? 'text-stone-500' : 'text-stone-400'
        }`}>
          <span>© 2025 StoryVerse</span>
          <div className="flex gap-6">
            <Link to="/" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Home</Link>
            <Link to="/contact" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-stone-900'}`}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
