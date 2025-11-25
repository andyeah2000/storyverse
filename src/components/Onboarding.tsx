import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useTheme } from '../hooks';
import { 
  ArrowRight, 
  ArrowLeft,
  Mic, 
  BookOpen,
  Check,
  Key,
  ExternalLink,
  Moon,
  Sun
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { updateSettings, addSource, updateProject } = useStory();
  const theme = useTheme();
  const isDark = theme === 'dark';
  
  const [currentStep, setCurrentStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [createdCharacter, setCreatedCharacter] = useState(false);

  const toggleTheme = () => {
    const current = localStorage.getItem('storyverse_settings');
    const settings = current ? JSON.parse(current) : {};
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('storyverse_settings', JSON.stringify({ ...settings, theme: newTheme }));
    window.location.reload();
  };

  const genres = [
    { id: 'scifi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'drama', label: 'Drama', emoji: '🎭' },
    { id: 'thriller', label: 'Thriller', emoji: '🔍' },
    { id: 'comedy', label: 'Comedy', emoji: '😂' },
    { id: 'fantasy', label: 'Fantasy', emoji: '⚔️' },
    { id: 'horror', label: 'Horror', emoji: '👻' },
    { id: 'romance', label: 'Romance', emoji: '💕' },
    { id: 'action', label: 'Action', emoji: '💥' },
  ];

  const handleComplete = () => {
    if (apiKey) updateSettings({ apiKey });
    if (projectName) updateProject({ name: projectName });

    if (createdCharacter && selectedGenre) {
      const chars: Record<string, { name: string; description: string }> = {
        scifi: { name: 'Commander Nova', description: 'A fearless space explorer searching for humanity\'s new home.' },
        drama: { name: 'Elena Martinez', description: 'A single mother fighting to save her family\'s restaurant.' },
        thriller: { name: 'Detective Cole', description: 'A burned-out cop with one last case to solve.' },
        comedy: { name: 'Jake Wilson', description: 'An unemployed actor who accidentally becomes a life coach.' },
        fantasy: { name: 'Aria Windwhisper', description: 'A young mage discovering forbidden powers.' },
        horror: { name: 'Dr. Sarah Blake', description: 'A psychologist whose patients share the same nightmare.' },
        romance: { name: 'Oliver & Maya', description: 'Two strangers connected by a series of missed connections.' },
        action: { name: 'Marcus Stone', description: 'An ex-special forces soldier seeking redemption.' },
      };
      const char = chars[selectedGenre as keyof typeof chars];
      if (char) {
        addSource({ title: char.name, content: char.description, type: 'character', tags: [selectedGenre] });
      }
    }

    localStorage.setItem('storyverse_onboarded', 'true');
    navigate('/app');
  };

  const steps = [
    // Welcome
    {
      content: (
        <div className="text-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl ${
            isDark ? 'bg-white shadow-white/5' : 'bg-stone-900 shadow-black/10'
          }`}>
            <span className={`text-3xl font-bold ${isDark ? 'text-stone-900' : 'text-white'}`}>S</span>
          </div>
          <h1 className={`text-[32px] font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            Welcome to StoryVerse
          </h1>
          <p className={`text-lg max-w-md mx-auto leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Your AI-powered screenwriting companion.<br />Let's set up your workspace in 30 seconds.
          </p>
        </div>
      )
    },
    // Project Name
    {
      content: (
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <p className={`text-sm uppercase tracking-widest font-medium mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Step 1 of 4
            </p>
            <h1 className={`text-[28px] font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Name your project
            </h1>
            <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>What story are you working on?</p>
          </div>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., The Last Horizon"
            className={`w-full h-14 px-5 rounded-xl border outline-none transition-all text-lg ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-white placeholder:text-stone-600 focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
            }`}
            autoFocus
          />
        </div>
      )
    },
    // Genre
    {
      content: (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <p className={`text-sm uppercase tracking-widest font-medium mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Step 2 of 4
            </p>
            <h1 className={`text-[28px] font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Choose a genre
            </h1>
            <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>This helps the AI understand your story's tone</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  selectedGenre === genre.id
                    ? isDark 
                      ? 'bg-white text-stone-900 shadow-lg shadow-white/5'
                      : 'bg-stone-900 text-white shadow-lg shadow-black/10'
                    : isDark
                      ? 'bg-stone-800 border border-stone-700 text-stone-300 hover:bg-stone-700'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <span className="text-lg">{genre.emoji}</span>
                <span>{genre.label}</span>
              </button>
            ))}
          </div>
          {selectedGenre && (
            <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
              isDark 
                ? 'bg-stone-800 border border-stone-700 hover:border-stone-600' 
                : 'bg-white border border-stone-200 hover:border-stone-300'
            }`}>
              <input
                type="checkbox"
                checked={createdCharacter}
                onChange={(e) => setCreatedCharacter(e.target.checked)}
                className="w-5 h-5 rounded border-stone-300 dark:border-stone-600 text-stone-900 dark:text-white focus:ring-stone-900/10 focus:ring-offset-0"
              />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Create a starter character
                </p>
                <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                  We'll add a sample to get you started
                </p>
              </div>
            </label>
          )}
        </div>
      )
    },
    // API Key
    {
      content: (
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <p className={`text-sm uppercase tracking-widest font-medium mb-3 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
              Step 3 of 4
            </p>
            <h1 className={`text-[28px] font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>
              Connect your AI
            </h1>
            <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>Add your Gemini API key for AI features</p>
          </div>
          <div className={`flex items-center gap-3 mb-5 p-3 rounded-xl ${
            isDark ? 'bg-stone-800' : 'bg-stone-100'
          }`}>
            <Key size={18} className={`shrink-0 ${isDark ? 'text-stone-500' : 'text-stone-400'}`} />
            <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Optional — you can add this later in settings
            </span>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className={`w-full h-14 px-5 rounded-xl border outline-none transition-all font-mono ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-white placeholder:text-stone-600 focus:border-stone-600 focus:ring-2 focus:ring-white/5'
                : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/5'
            }`}
          />
          <a 
            href="https://aistudio.google.com/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 mt-4 text-sm transition-colors ${
              isDark ? 'text-stone-500 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Get a free API key
            <ExternalLink size={14} />
          </a>
        </div>
      )
    },
    // Done
    {
      content: (
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 ${
            isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'
          }`}>
            <Check size={36} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />
          </div>
          <h1 className={`text-[32px] font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            You're all set!
          </h1>
          <p className={`text-lg max-w-md mx-auto mb-10 ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
            Your project <span className={`font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              "{projectName || 'Untitled'}"
            </span> is ready.
          </p>
          <div className="flex justify-center gap-4">
            <div className={`p-5 rounded-xl text-center w-36 ${
              isDark ? 'bg-stone-800 border border-stone-700' : 'bg-white border border-stone-200'
            }`}>
              <Mic size={22} className={`mx-auto mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>Voice Agent</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>⌘⇧A to start</p>
            </div>
            <div className={`p-5 rounded-xl text-center w-36 ${
              isDark ? 'bg-stone-800 border border-stone-700' : 'bg-white border border-stone-200'
            }`}>
              <BookOpen size={22} className={`mx-auto mb-3 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>Story Bible</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>Left sidebar</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStep === 0 || 
                     (currentStep === 1 && projectName.length > 0) ||
                     currentStep >= 2;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    }`}>
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-white' : 'bg-stone-900'
            }`}>
              <span className={`text-sm font-bold ${isDark ? 'text-stone-900' : 'text-white'}`}>S</span>
            </div>
            <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-stone-900'}`}>
              StoryVerse
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              }`}
            >
              {isDark ? <Sun size={18} className="text-stone-400" /> : <Moon size={18} className="text-stone-500" />}
            </button>
            
            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStep 
                      ? `w-6 h-2 ${isDark ? 'bg-white' : 'bg-stone-900'}`
                      : i < currentStep 
                        ? `w-2 h-2 ${isDark ? 'bg-white' : 'bg-stone-900'}`
                        : `w-2 h-2 ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          {steps[currentStep]?.content}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className={`h-12 px-6 rounded-xl flex items-center gap-2 font-medium transition-all active:scale-[0.98] ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : isDark 
                  ? 'text-stone-400 hover:bg-stone-800' 
                  : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={handleComplete}
              className={`h-12 px-8 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg ${
                isDark 
                  ? 'bg-white text-stone-900 hover:bg-stone-100 shadow-white/5' 
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-black/10'
              }`}
            >
              Open StoryVerse
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed}
              className={`h-12 px-8 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                canProceed
                  ? isDark
                    ? 'bg-white text-stone-900 hover:bg-stone-100 active:scale-[0.98] shadow-lg shadow-white/5'
                    : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] shadow-lg shadow-black/10'
                  : isDark
                    ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {currentStep === 0 ? 'Get Started' : 'Continue'}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;
