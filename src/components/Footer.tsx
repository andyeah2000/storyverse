import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-6 border-t border-stone-200 bg-stone-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-stone-900">
            <span className="text-xs font-bold text-white">S</span>
          </div>
          <span className="text-sm font-medium text-stone-900">StoryVerse</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-stone-500">
          <Link to="/about" className="transition-colors hover:text-stone-900">About</Link>
          <Link to="/contact" className="transition-colors hover:text-stone-900">Contact</Link>
          <Link to="/privacy" className="transition-colors hover:text-stone-900">Privacy</Link>
          <Link to="/terms" className="transition-colors hover:text-stone-900">Terms</Link>
        </div>
        <p className="text-sm text-stone-400">© {new Date().getFullYear()} StoryVerse</p>
      </div>
    </footer>
  );
};

export default Footer;

