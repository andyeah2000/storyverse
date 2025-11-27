import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks';
import { cn } from '../lib/utils';

interface ThemeToggleButtonProps {
  className?: string;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ className }) => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const nextTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: nextTheme }));
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 dark:focus-visible:ring-white/20",
        isDark ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-500 hover:bg-stone-100',
        className
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggleButton;
