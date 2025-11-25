import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAgent } from '../context/AgentContext';
import { useStory } from '../context/StoryContext';
import { 
  Mic, 
  MicOff, 
  Minimize2, 
  Maximize2,
  Loader2,
  ChevronDown,
  Wrench,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Brain,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

const VoiceAgent: React.FC = () => {
  const { state, startAgent, stopAgent, isAvailable } = useAgent();
  const { theme, setSettingsOpen } = useStory();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showRetryHint, setShowRetryHint] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [state.transcript]);

  // Show retry hint when there's an error
  useEffect(() => {
    if (state.error) {
      setShowRetryHint(true);
      const timer = setTimeout(() => setShowRetryHint(false), 5000);
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

  // Retry handler
  const handleRetry = useCallback(() => {
    if (!state.isConnecting && isAvailable) {
      startAgent();
    }
  }, [state.isConnecting, isAvailable, startAgent]);

  // Clear error
  const handleClearError = useCallback(() => {
    setShowRetryHint(false);
  }, []);

  // Minimized bubble view
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 rounded-full z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 touch-target safe-area-inset",
          state.isActive
            ? state.isSpeaking
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_30px_rgba(59,130,246,0.5)]'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
            : state.error
              ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : theme === 'dark' 
                ? 'bg-stone-800 shadow-xl hover:shadow-2xl' 
                : 'bg-white shadow-xl hover:shadow-2xl border border-stone-200'
        )}
        aria-label="Open Voice Agent"
      >
        {state.isConnecting ? (
          <Loader2 size={24} className="text-white animate-spin" />
        ) : state.isActive ? (
          <div className="relative">
            {state.isSpeaking ? (
              <Volume2 size={24} className="text-white animate-pulse" />
            ) : (
              <>
                <Mic size={24} className="text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
              </>
            )}
          </div>
        ) : state.error ? (
          <AlertCircle size={24} className="text-white" />
        ) : (
          <Brain size={24} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-500'} />
        )}
      </button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 rounded-3xl overflow-hidden transition-all duration-300 safe-area-inset",
        isExpanded 
          ? 'bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 md:w-[400px]' 
          : 'bottom-4 right-4 left-4 md:left-auto md:bottom-6 md:right-6 md:w-80',
        theme === 'dark' 
          ? 'bg-stone-900/95 backdrop-blur-xl border border-stone-800 shadow-2xl shadow-black/50' 
          : 'bg-white/95 backdrop-blur-xl border border-stone-200 shadow-2xl shadow-stone-900/10'
      )}
      role="region"
      aria-label="Voice Agent"
    >
      {/* Active state gradient overlay */}
      {state.isActive && (
        <div className={cn(
          "absolute inset-0 opacity-20 pointer-events-none transition-all duration-500",
          state.isSpeaking
            ? 'bg-gradient-to-br from-blue-500 via-transparent to-indigo-500'
            : 'bg-gradient-to-br from-emerald-500 via-transparent to-teal-500'
        )} />
      )}

      {/* Header */}
      <div className={cn(
        "relative z-10 h-14 px-4 flex items-center justify-between border-b",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
      )}>
        <div className="flex items-center gap-3">
          {/* Status indicator orb */}
          <div className={cn(
            "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            state.isActive
              ? state.isSpeaking
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
              : state.error
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                : theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'
          )}>
            {state.isConnecting ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : state.isActive ? (
              <>
                {state.isSpeaking ? (
                  <Volume2 size={18} className="text-white animate-pulse" />
                ) : (
                  <Mic size={18} className="text-white" />
                )}
                {state.isListening && !state.isSpeaking && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                )}
              </>
            ) : state.error ? (
              <AlertCircle size={18} className="text-white" />
            ) : (
              <Brain size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-500'} />
            )}
          </div>

          {/* Title and status */}
          <div>
            <h3 className={cn(
              "text-sm font-semibold",
              theme === 'dark' ? 'text-white' : 'text-stone-900'
            )}>
              AI Agent
            </h3>
            <p className={cn(
              "text-[11px] transition-colors",
              state.isActive
                ? state.isSpeaking
                  ? 'text-blue-400'
                  : state.currentAction
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                : state.isConnecting
                  ? theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                  : state.error
                    ? 'text-red-400'
                    : theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>
              {state.isConnecting 
                ? state.connectionAttempts > 1 
                  ? `Retry ${state.connectionAttempts}...` 
                  : 'Connecting...'
                : state.isActive 
                  ? (state.currentAction?.replace(/_/g, ' ') || (state.isSpeaking ? 'Speaking' : 'Listening'))
                  : state.error
                    ? 'Connection failed'
                    : '⌘⇧A to start'}
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110",
              theme === 'dark' 
                ? 'text-stone-400 hover:text-white hover:bg-stone-800' 
                : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
            )}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110",
              theme === 'dark' 
                ? 'text-stone-400 hover:text-white hover:bg-stone-800' 
                : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
            )}
            aria-label="Minimize"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Current tool execution indicator */}
      {state.currentAction && (
        <div className={cn(
          "relative z-10 px-4 py-2.5 flex items-center gap-2 border-b",
          theme === 'dark' 
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
            : 'bg-amber-50 border-amber-100 text-amber-700'
        )}>
          <Wrench size={12} className="animate-spin" style={{ animationDuration: '2s' }} />
          <span className="text-xs font-medium truncate">
            {state.currentAction.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Transcript (expanded view) */}
      {isExpanded && (
        <div 
          ref={transcriptRef}
          className="relative z-10 h-[280px] overflow-y-auto p-4 space-y-3 scroll-smooth"
        >
          {state.transcript.length === 0 ? (
            <div className={cn(
              "h-full flex flex-col items-center justify-center text-center",
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>
              <MessageSquare size={24} className="mb-3 opacity-40" />
              <p className="text-xs font-medium">
                {state.isActive ? 'Say something...' : 'Start the agent to begin'}
              </p>
              <p className="text-[10px] mt-1 opacity-70 max-w-[180px]">
                Try "Create a character named John" or "Write a scene"
              </p>
            </div>
          ) : (
            state.transcript.slice(-20).map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "animate-fade-in",
                  msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed",
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-stone-800 to-stone-900 text-white rounded-tr-sm'
                    : msg.role === 'tool'
                      ? theme === 'dark'
                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/20 rounded-tl-sm'
                        : 'bg-amber-50 text-amber-800 border border-amber-100 rounded-tl-sm'
                      : msg.role === 'system'
                        ? theme === 'dark'
                          ? 'bg-stone-800/50 text-stone-400 italic'
                          : 'bg-stone-100 text-stone-500 italic'
                        : theme === 'dark'
                          ? 'bg-stone-800 text-stone-200 rounded-tl-sm'
                          : 'bg-stone-100 text-stone-700 rounded-tl-sm'
                )}>
                  {msg.role === 'tool' && msg.toolCall && (
                    <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                      {msg.toolCall.result?.success ? (
                        <CheckCircle2 size={10} className="text-emerald-400" />
                      ) : (
                        <Wrench size={10} />
                      )}
                      <span className="font-mono text-[9px]">
                        {msg.toolCall.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Error display */}
      {state.error && showRetryHint && (
        <div className={cn(
          "relative z-10 mx-3 mb-2 p-3 rounded-xl flex items-start gap-2 text-xs",
          theme === 'dark' 
            ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
            : 'bg-red-50 text-red-600 border border-red-100'
        )}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="truncate">{state.error}</p>
            <button
              onClick={handleRetry}
              className="mt-1.5 flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity"
            >
              <RefreshCw size={10} />
              Click to retry
            </button>
          </div>
          <button
            onClick={handleClearError}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={cn(
        "relative z-10 p-3 border-t",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
      )}>
        {!isAvailable ? (
          <button
            onClick={() => setSettingsOpen(true)}
            className={cn(
              "w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
              theme === 'dark'
                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
            )}
          >
            <AlertCircle size={16} />
            Add API Key
          </button>
        ) : state.isActive ? (
          <button
            onClick={stopAgent}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]",
              theme === 'dark'
                ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30'
                : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
            )}
          >
            <MicOff size={16} />
            Stop Agent
          </button>
        ) : (
          <button
            onClick={startAgent}
            disabled={state.isConnecting}
            className={cn(
              "w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              state.isConnecting
                ? 'opacity-70 cursor-not-allowed'
                : 'hover:scale-[1.02] active:scale-[0.98]',
              theme === 'dark'
                ? 'bg-gradient-to-r from-stone-100 to-white text-stone-900 shadow-lg shadow-white/10'
                : 'bg-gradient-to-r from-stone-800 to-stone-900 text-white shadow-lg shadow-stone-900/20'
            )}
          >
            {state.isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {state.connectionAttempts > 1 ? `Retry ${state.connectionAttempts}...` : 'Connecting...'}
              </>
            ) : (
              <>
                <Mic size={16} />
                Start Agent
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAgent;
