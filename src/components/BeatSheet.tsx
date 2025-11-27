import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Sparkles, Info, Wand2, Loader2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { BeatSheet as BeatSheetType } from '../types';
import { getGeminiClient } from '../services/geminiService';

interface Beat {
  key: keyof BeatSheetType;
  title: string;
  subtitle: string;
  hint: string;
  percentage: string;
}

const BEATS: Beat[] = [
  {
    key: 'openingImage',
    title: 'Opening Image',
    subtitle: 'Page 1',
    hint: 'A visual snapshot of the protagonist\'s world before the journey begins.',
    percentage: '1%'
  },
  {
    key: 'themeStated',
    title: 'Theme Stated',
    subtitle: 'Page 5',
    hint: 'Someone states the theme, but the protagonist doesn\'t understand it yet.',
    percentage: '5%'
  },
  {
    key: 'setup',
    title: 'Setup',
    subtitle: 'Pages 1-10',
    hint: 'Establish the protagonist\'s life, wants, needs, and what\'s missing.',
    percentage: '1-10%'
  },
  {
    key: 'catalyst',
    title: 'Catalyst',
    subtitle: 'Page 12',
    hint: 'Life-changing event that sets the story in motion. No going back.',
    percentage: '12%'
  },
  {
    key: 'debate',
    title: 'Debate',
    subtitle: 'Pages 12-25',
    hint: 'The protagonist resists the call. Fear, doubt, reluctance.',
    percentage: '12-25%'
  },
  {
    key: 'breakIntoTwo',
    title: 'Break Into Two',
    subtitle: 'Page 25',
    hint: 'The protagonist makes a choice and enters the new world (Act 2).',
    percentage: '25%'
  },
  {
    key: 'bStory',
    title: 'B Story',
    subtitle: 'Page 30',
    hint: 'The love story or helper character. Often carries the theme.',
    percentage: '30%'
  },
  {
    key: 'funAndGames',
    title: 'Fun & Games',
    subtitle: 'Pages 30-55',
    hint: 'The "promise of the premise." What the audience came to see.',
    percentage: '30-55%'
  },
  {
    key: 'midpoint',
    title: 'Midpoint',
    subtitle: 'Page 55',
    hint: 'A false victory or false defeat. Stakes are raised. No more fun.',
    percentage: '55%'
  },
  {
    key: 'badGuysCloseIn',
    title: 'Bad Guys Close In',
    subtitle: 'Pages 55-75',
    hint: 'Things fall apart. External bad guys and internal doubts converge.',
    percentage: '55-75%'
  },
  {
    key: 'allIsLost',
    title: 'All Is Lost',
    subtitle: 'Page 75',
    hint: 'The opposite of the Midpoint. Death of the old self or mentor.',
    percentage: '75%'
  },
  {
    key: 'darkNightOfSoul',
    title: 'Dark Night of the Soul',
    subtitle: 'Pages 75-85',
    hint: 'The protagonist hits rock bottom. Hopelessness before the breakthrough.',
    percentage: '75-85%'
  },
  {
    key: 'breakIntoThree',
    title: 'Break Into Three',
    subtitle: 'Page 85',
    hint: 'The "aha" moment. Synthesis of A and B stories. New plan.',
    percentage: '85%'
  },
  {
    key: 'finale',
    title: 'Finale',
    subtitle: 'Pages 85-110',
    hint: 'The protagonist proves transformation by taking action.',
    percentage: '85-99%'
  },
  {
    key: 'finalImage',
    title: 'Final Image',
    subtitle: 'Page 110',
    hint: 'The opposite of the Opening Image, proving change has occurred.',
    percentage: '100%'
  },
];

const BeatSheetComponent: React.FC = () => {
  const { beatSheet, updateBeatSheet, sources } = useStory();
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingBeat, setGeneratingBeat] = useState<string | null>(null);

  const completedBeats = BEATS.filter(beat => beatSheet[beat.key]?.trim()).length;
  const progress = Math.round((completedBeats / BEATS.length) * 100);

  // Get story context
  const getStoryContext = () => {
    const characters = sources.filter(s => s.type === 'character');
    const locations = sources.filter(s => s.type === 'location');
    const lore = sources.filter(s => s.type === 'lore');
    const script = sources.find(s => s.type === 'script');
    
    return `
STORY CONTEXT:
${characters.length > 0 ? `CHARACTERS:\n${characters.map(c => `- ${c.title}: ${c.content.slice(0, 200)}`).join('\n')}` : ''}
${locations.length > 0 ? `\nLOCATIONS:\n${locations.map(l => `- ${l.title}: ${l.content.slice(0, 150)}`).join('\n')}` : ''}
${lore.length > 0 ? `\nWORLD/LORE:\n${lore.map(l => `- ${l.title}: ${l.content.slice(0, 150)}`).join('\n')}` : ''}
${script ? `\nSCRIPT EXCERPT:\n${script.content.slice(0, 500)}` : ''}

EXISTING BEATS:
${BEATS.map(b => `${b.title}: ${beatSheet[b.key] || '(empty)'}`).join('\n')}
    `.trim();
  };

  // Generate single beat
  const generateBeat = async (beat: Beat) => {
    setGeneratingBeat(beat.key);
    try {
      const client = getGeminiClient();
      const context = getStoryContext();
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `${context}

Based on the story context above, write a compelling "${beat.title}" beat for a Save the Cat! beat sheet.

BEAT DEFINITION: ${beat.hint}
STORY POSITION: ${beat.percentage}

Write 2-3 sentences that capture this beat. Be specific to the characters and world. Be concise but evocative.
Only output the beat content, nothing else.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        updateBeatSheet({ [beat.key]: text });
      }
    } catch (error) {
      console.error('Beat generation failed:', error);
    } finally {
      setGeneratingBeat(null);
    }
  };

  // Generate all empty beats
  const generateAllBeats = async () => {
    setIsGeneratingAll(true);
    try {
      const client = getGeminiClient();
      const context = getStoryContext();
      const emptyBeats = BEATS.filter(b => !beatSheet[b.key]?.trim());
      
      if (emptyBeats.length === 0) {
        // Regenerate all if none empty
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `${context}

Based on the story context, generate ALL 15 Save the Cat! beats. For each beat, write 2-3 specific, evocative sentences.

Format your response EXACTLY like this (one beat per line):
OPENING_IMAGE: [content]
THEME_STATED: [content]
SETUP: [content]
CATALYST: [content]
DEBATE: [content]
BREAK_INTO_TWO: [content]
B_STORY: [content]
FUN_AND_GAMES: [content]
MIDPOINT: [content]
BAD_GUYS_CLOSE_IN: [content]
ALL_IS_LOST: [content]
DARK_NIGHT_OF_SOUL: [content]
BREAK_INTO_THREE: [content]
FINALE: [content]
FINAL_IMAGE: [content]` }]
          }]
        });

        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        parseAndUpdateBeats(text);
      } else {
        // Generate only empty beats
        for (const beat of emptyBeats) {
          await generateBeat(beat);
        }
      }
    } catch (error) {
      console.error('Generate all failed:', error);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const parseAndUpdateBeats = (text: string) => {
    const keyMap: Record<string, keyof BeatSheetType> = {
      'OPENING_IMAGE': 'openingImage',
      'THEME_STATED': 'themeStated',
      'SETUP': 'setup',
      'CATALYST': 'catalyst',
      'DEBATE': 'debate',
      'BREAK_INTO_TWO': 'breakIntoTwo',
      'B_STORY': 'bStory',
      'FUN_AND_GAMES': 'funAndGames',
      'MIDPOINT': 'midpoint',
      'BAD_GUYS_CLOSE_IN': 'badGuysCloseIn',
      'ALL_IS_LOST': 'allIsLost',
      'DARK_NIGHT_OF_SOUL': 'darkNightOfSoul',
      'BREAK_INTO_THREE': 'breakIntoThree',
      'FINALE': 'finale',
      'FINAL_IMAGE': 'finalImage'
    };

    const updates: Partial<BeatSheetType> = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      for (const [marker, key] of Object.entries(keyMap)) {
        if (line.toUpperCase().includes(marker)) {
          const content = line.split(':').slice(1).join(':').trim();
          if (content) updates[key] = content;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      updateBeatSheet(updates);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-subtle border border-stone-200/60 overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-stone-400" strokeWidth={1.75} />
          <div>
            <h2 className="text-base font-semibold text-stone-900">Save the Cat! Beat Sheet</h2>
            <p className="text-xs text-stone-500">15 beats to structure your story</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Generate All Button */}
          <button
            onClick={generateAllBeats}
            disabled={isGeneratingAll}
            className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={12} />
                AI Generate All
              </>
            )}
          </button>
          
          <div className="w-px h-6 bg-stone-200" />
          
          <span className="text-xs font-medium text-stone-500">
            {completedBeats}/{BEATS.length}
          </span>
          <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-stone-900 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Beats Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BEATS.map((beat, index) => (
            <BeatCard
              key={beat.key}
              beat={beat}
              index={index}
              value={beatSheet[beat.key] || ''}
              onChange={(value) => updateBeatSheet({ [beat.key]: value })}
              onGenerate={() => generateBeat(beat)}
              isGenerating={generatingBeat === beat.key}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface BeatCardProps {
  beat: Beat;
  index: number;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, index, value, onChange, onGenerate, isGenerating }) => {
  const [showHint, setShowHint] = React.useState(false);
  const isEmpty = !value.trim();

  return (
    <div 
      className={cn(
        "relative p-4 rounded-xl border transition-all group",
        isEmpty
          ? 'border-stone-200 bg-stone-50/50'
          : 'border-stone-300 bg-white',
        isGenerating && 'ring-2 ring-purple-500/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">{beat.title}</h3>
            <span className="text-[10px] text-stone-400 font-mono">{beat.percentage}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* AI Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              isGenerating
                ? 'text-purple-500'
                : 'text-stone-400 hover:text-purple-500 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100'
            )}
            title="AI Generate"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}
          </button>
          <button
            onClick={() => setShowHint(!showHint)}
            className="p-1 text-stone-400 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Hint */}
      {showHint && (
        <p className="text-xs text-stone-500 mb-3 p-2 bg-stone-100 rounded-lg italic">
          {beat.hint}
        </p>
      )}

      {/* Content */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={beat.hint}
        className={cn(
          "w-full h-20 text-sm leading-relaxed resize-none outline-none bg-transparent placeholder:text-stone-300",
          isEmpty ? 'text-stone-400' : 'text-stone-700'
        )}
      />

      {/* Completion indicator */}
      {!isEmpty && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
      )}
    </div>
  );
};

export default BeatSheetComponent;