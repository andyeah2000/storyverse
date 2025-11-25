import { useState, useEffect } from 'react';

export function useTheme(): 'light' | 'dark' {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      try {
        const stored = localStorage.getItem('storyverse_settings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.theme === 'dark') return true;
          if (settings.theme === 'light') return false;
        }
      } catch {}
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    
    setIsDark(checkDark());
    
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(checkDark());
    mq.addEventListener('change', handler);
    
    // Also listen for storage changes
    const storageHandler = () => setIsDark(checkDark());
    window.addEventListener('storage', storageHandler);
    
    return () => {
      mq.removeEventListener('change', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  return isDark ? 'dark' : 'light';
}

