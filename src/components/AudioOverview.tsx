import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Mic2, FileText, ChevronRight, Volume2 } from 'lucide-react';
import { Source } from '../types';
import { generatePodcastScript, generatePodcastAudio } from '../services/geminiService';
import { base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { useStory } from '../context/StoryContext';
import { cn } from '../lib/utils';

interface AudioOverviewProps {
  sources: Source[];
}

const AudioOverview: React.FC<AudioOverviewProps> = ({ sources }) => {
  const { theme } = useStory();
  const [status, setStatus] = useState<'idle' | 'scripting' | 'reviewing' | 'synthesizing' | 'ready' | 'error'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [script, setScript] = useState<string>('');
  const [audioData, setAudioData] = useState<string>('');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      audioSource?.stop();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  const handleGenerateScript = async () => {
    if (sources.length === 0) {
      alert("Your story bible is empty.");
      return;
    }

    try {
      setStatus('scripting');
      setScript('');
      
      const generatedScript = await generatePodcastScript(sources);
      if (!generatedScript) throw new Error("Failed to generate script");
      setScript(generatedScript);
      setStatus('reviewing');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleSynthesize = async () => {
    try {
      setStatus('synthesizing');
      const base64Audio = await generatePodcastAudio(script);
      
      if (!base64Audio) throw new Error("Failed to generate audio");

      setAudioData(base64Audio);
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      audioSource?.stop();
      setIsPlaying(false);
    } else {
      if (!audioData) return;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      setAudioContext(ctx);

      try {
        let bytes = base64ToUint8Array(audioData);
        try {
          const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0)); 
          playBuffer(ctx, audioBuffer);
        } catch(e) {
          bytes = base64ToUint8Array(audioData); 
          const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
          playBuffer(ctx, audioBuffer);
        }
      } catch (e) {
        console.error("Playback failed completely", e);
        setStatus('error');
      }
    }
  };

  const playBuffer = (ctx: AudioContext, buffer: AudioBuffer) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => setIsPlaying(false);
    source.start();
    setAudioSource(source);
    setIsPlaying(true);
  };

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl shadow-subtle border overflow-hidden",
      theme === 'dark'
        ? 'bg-stone-900 border-stone-800'
        : 'bg-white border-stone-200/60'
    )}>
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        
        {status !== 'reviewing' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-elevated",
              theme === 'dark' ? 'bg-white' : 'bg-stone-900'
            )}>
              <Mic2 className={theme === 'dark' ? 'text-stone-900' : 'text-white'} size={32} strokeWidth={1.5} />
            </div>
            
            <h2 className={cn(
              "text-2xl font-semibold mb-2 tracking-tight",
              theme === 'dark' ? 'text-white' : 'text-stone-900'
            )}>Table Read</h2>
            <p className={cn(
              "mb-10 max-w-md text-sm leading-relaxed",
              theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
            )}>
              Generate a multi-voice audio performance of your script or story content.
            </p>
          </div>
        )}

        {status === 'idle' && (
          <button
            onClick={handleGenerateScript}
            className={cn(
              "h-12 px-8 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] shadow-subtle flex items-center gap-3 text-sm",
              theme === 'dark'
                ? 'bg-white text-stone-900 hover:bg-stone-100'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            )}
          >
            <Volume2 size={18} strokeWidth={1.75} />
            Generate Performance
          </button>
        )}

        {(status === 'scripting' || status === 'synthesizing') && (
          <div className="flex flex-col items-center gap-5">
            <RefreshCw className={cn(
              "animate-spin",
              theme === 'dark' ? 'text-stone-400' : 'text-stone-400'
            )} size={32} strokeWidth={1.5} />
            <p className={cn(
              "font-medium text-sm",
              theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
            )}>
              {status === 'scripting' ? 'Writing script...' : 'Synthesizing voices...'}
            </p>
          </div>
        )}

        {status === 'reviewing' && (
          <div className="w-full max-w-3xl flex flex-col h-full animate-slide-up">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className={cn(
                "font-semibold text-lg flex items-center gap-2.5",
                theme === 'dark' ? 'text-white' : 'text-stone-900'
              )}>
                <FileText size={18} className={theme === 'dark' ? 'text-stone-400' : 'text-stone-400'} strokeWidth={1.75} />
                Review Script
              </h3>
              <span className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-lg",
                theme === 'dark' ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
              )}>
                Editable
              </span>
            </div>
            
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className={cn(
                "flex-1 w-full p-6 border rounded-xl font-mono text-sm leading-relaxed resize-none outline-none shadow-subtle mb-5 transition-all",
                theme === 'dark'
                  ? 'bg-stone-800 border-stone-700 text-stone-200 focus:ring-2 focus:ring-white/10 focus:border-stone-600 hover:bg-stone-800/80'
                  : 'bg-stone-50 border-stone-200 text-stone-700 focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 hover:bg-white'
              )}
              placeholder="Script will appear here..."
              spellCheck={false}
            />

            <div className="flex gap-3 justify-end shrink-0">
              <button
                onClick={() => setStatus('idle')}
                className={cn(
                  "h-11 px-5 font-medium rounded-xl text-sm transition-colors",
                  theme === 'dark'
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSynthesize}
                className={cn(
                  "h-11 px-6 rounded-xl font-medium transition-all shadow-subtle flex items-center gap-2 text-sm",
                  theme === 'dark'
                    ? 'bg-white text-stone-900 hover:bg-stone-100'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                Generate Audio
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className={cn(
            "p-8 rounded-2xl w-full max-w-md border animate-fade-in",
            theme === 'dark'
              ? 'bg-stone-800 border-stone-700'
              : 'bg-stone-50 border-stone-200/60'
          )}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-xs font-medium uppercase tracking-wide mb-1",
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                )}>Ready</span>
                <span className={cn(
                  "font-semibold text-xl",
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                )}>Audio Performance</span>
              </div>
              <button 
                onClick={togglePlayback}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-elevated",
                  theme === 'dark'
                    ? 'bg-white text-stone-900 hover:bg-stone-100'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                {isPlaying ? <Pause size={24} strokeWidth={1.75} /> : <Play size={24} className="ml-0.5" strokeWidth={1.75} />}
              </button>
            </div>
            
            {/* Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-16">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1 rounded-full transition-all duration-100",
                    isPlaying 
                      ? theme === 'dark' ? "bg-white animate-pulse" : "bg-stone-900 animate-pulse"
                      : theme === 'dark' ? "h-1.5 bg-stone-600" : "h-1.5 bg-stone-300"
                  )}
                  style={{ 
                    height: isPlaying ? `${Math.max(8, Math.random() * 100)}%` : '6px',
                    animationDelay: `${i * 40}ms`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className={cn(
            "p-5 rounded-xl flex flex-col items-center",
            theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
          )}>
            <p className="font-medium mb-2">Something went wrong</p>
            <button 
              onClick={() => setStatus('idle')} 
              className={cn(
                "text-sm font-medium hover:underline",
                theme === 'dark' ? 'text-white' : 'text-stone-900'
              )}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioOverview;
