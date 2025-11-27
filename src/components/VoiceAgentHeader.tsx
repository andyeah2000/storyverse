import React, { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { useStory } from '../context/StoryContext';
import { 
  Mic, 
  Loader2,
  AlertCircle,
  Volume2,
  Brain,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const VoiceAgentHeader: React.FC = () => {
  const { state, startAgent, stopAgent, isAvailable } = useAgent();
  const { setSettingsOpen } = useStory();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (state.error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (state.isActive) {
          stopAgent();
        } else if (isAvailable && !state.isConnecting) {
          startAgent();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, state.isConnecting, isAvailable, startAgent, stopAgent]);

  const handleClick = () => {
    if (!isAvailable) {
      setSettingsOpen(true);
      return;
    }
    
    if (state.isActive) {
      stopAgent();
    } else if (!state.isConnecting) {
      startAgent();
    }
  };

  return (
    <div className="flex items-center relative">
      <button
        onClick={handleClick}
        disabled={isAvailable && state.isConnecting}
        className={cn(
          "h-8 pl-2 pr-3 rounded-lg flex items-center gap-2 transition-all border w-full",
          state.isActive
            ? state.isSpeaking
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : state.error
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
        )}
        title={isAvailable ? (state.isActive ? "Stop Agent (⌘⇧A)" : "Start Voice Agent (⌘⇧A)") : "Setup API Key"}
      >
        {/* Icon Area */}
        <div className="relative flex items-center justify-center w-4 h-4">
          {state.isConnecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : state.isActive ? (
            state.isSpeaking ? (
              <Volume2 size={14} className="animate-pulse" />
            ) : (
              <>
                <Mic size={14} />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-current rounded-full animate-ping opacity-75" />
              </>
            )
          ) : state.error ? (
            <AlertCircle size={14} />
          ) : (
            <Brain size={14} />
          )}
        </div>

        {/* Text Label */}
        <span className="text-xs font-medium truncate max-w-[100px] text-left">
          {state.isConnecting 
            ? 'Connecting...' 
            : state.isActive 
              ? (state.isSpeaking ? 'Speaking' : 'Listening')
              : 'AI Agent'}
        </span>
      </button>

      {/* Error Toast */}
      {showError && state.error && (
        <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 shadow-lg z-50 animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div className="flex-1">{state.error}</div>
            <button onClick={() => setShowError(false)} className="opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgentHeader;

