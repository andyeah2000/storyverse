import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Plus, Trash2, StickyNote, Search, Loader2, Sparkles, ArrowUpRight, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { Note } from '../types';
import { getGeminiClient } from '../services/geminiService';

const COLOR_OPTIONS = ['default', 'yellow', 'green', 'blue', 'red'] as const;

const COLOR_STYLES: Record<typeof COLOR_OPTIONS[number], { bg: string; border: string; text: string }> = {
  default: { 
    bg: 'bg-stone-50 dark:bg-stone-800', 
    border: 'border-stone-200 dark:border-stone-700',
    text: 'text-stone-600 dark:text-stone-300'
  },
  yellow: { 
    bg: 'bg-amber-50 dark:bg-amber-900/20', 
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200'
  },
  green: { 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200'
  },
  blue: { 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200'
  },
  red: { 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200'
  },
};

const NotesComponent: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useStory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<typeof COLOR_OPTIONS[number]>('default');

  const filteredNotes = notes.filter(note => 
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNote = () => {
    addNote({
      title: '',
      content: '',
      color: selectedColor,
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-stone-900 rounded-2xl shadow-subtle border border-stone-200/60 dark:border-stone-800 overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <StickyNote size={18} className="text-stone-400" strokeWidth={1.75} />
          <div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-white">Notes</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">{notes.length} notes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Color selector */}
          <div className="flex gap-1 mr-2">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "w-5 h-5 rounded-full transition-all border-2",
                  COLOR_STYLES[color].bg,
                  selectedColor === color 
                    ? 'border-stone-900 dark:border-white scale-110' 
                    : 'border-transparent hover:scale-110'
                )}
              />
            ))}
          </div>
          <button
            onClick={handleAddNote}
            className="h-8 px-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-lg font-medium text-xs hover:bg-stone-800 dark:hover:bg-stone-100 transition-all flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2} />
            Add Note
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-9 pl-9 pr-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-900/10 dark:focus:ring-white/10 transition-all placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <StickyNote size={32} className="text-stone-300 dark:text-stone-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">
              {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs">
              {notes.length === 0 
                ? 'Add notes to capture ideas, feedback, and reminders'
                : 'Try a different search term'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onUpdate={(updates) => updateNote(note.id, updates)}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface NoteCardProps {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onUpdate, onDelete }) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  
  const colorStyle = COLOR_STYLES[note.color || 'default'] ?? COLOR_STYLES['default']!;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleExpand = async () => {
    if (!note.content.trim()) return;
    setIsExpanding(true);
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Expand this note with more detail, examples, or ideas. Keep the same style and topic.

NOTE:
${note.title ? `Title: ${note.title}\n` : ''}${note.content}

Write an expanded version (2-3x longer). Only output the expanded content.` }]
        }]
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) onUpdate({ content: text });
    } catch (e) {
      console.error('Expand failed:', e);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleSummarize = async () => {
    if (!note.content.trim()) return;
    setIsSummarizing(true);
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Summarize this note into key bullet points.

NOTE:
${note.title ? `Title: ${note.title}\n` : ''}${note.content}

Write a concise bullet-point summary. Only output the summary.` }]
        }]
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) onUpdate({ content: text });
    } catch (e) {
      console.error('Summarize failed:', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Based on this note, generate 5 creative ideas or directions to explore.

NOTE:
${note.title ? `Title: ${note.title}\n` : ''}${note.content || 'Empty note - generate general story ideas'}

Write 5 bullet points with creative ideas. Be specific and actionable.` }]
        }]
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) onUpdate({ content: note.content + '\n\n---\nAI IDEAS:\n' + text });
    } catch (e) {
      console.error('Ideas failed:', e);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const isProcessing = isExpanding || isSummarizing || isGeneratingIdeas;

  return (
    <div 
      className={cn(
        "group p-4 rounded-xl border transition-all hover:shadow-md relative",
        colorStyle.bg,
        colorStyle.border,
        isProcessing && 'ring-2 ring-purple-500/50'
      )}
    >
      {/* AI Actions */}
      <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleExpand}
          disabled={isProcessing}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current/50 hover:text-purple-500 transition-colors"
          title="AI Expand"
        >
          {isExpanding ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
        </button>
        <button
          onClick={handleSummarize}
          disabled={isProcessing}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current/50 hover:text-blue-500 transition-colors"
          title="AI Summarize"
        >
          {isSummarizing ? <Loader2 size={12} className="animate-spin" /> : <List size={12} />}
        </button>
        <button
          onClick={handleGenerateIdeas}
          disabled={isProcessing}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current/50 hover:text-amber-500 transition-colors"
          title="AI Ideas"
        >
          {isGeneratingIdeas ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        </button>
      </div>

      {/* Title */}
      <input
        value={note.title || ''}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder="Note title..."
        className={cn(
          "w-full font-semibold text-sm mb-2 bg-transparent outline-none placeholder:opacity-50",
          colorStyle.text
        )}
      />

      {/* Content */}
      <textarea
        value={note.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Write your note..."
        className={cn(
          "w-full h-24 text-sm leading-relaxed resize-none bg-transparent outline-none placeholder:opacity-50",
          colorStyle.text
        )}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
        <span className="text-[10px] opacity-50 font-medium">
          {formatDate(note.updatedAt)}
        </span>

        <div className="flex items-center gap-1">
          {/* Color picker */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ color })}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  COLOR_STYLES[color].bg,
                  note.color === color && 'ring-1 ring-current'
                )}
              />
            ))}
          </div>
          
          <button
            onClick={onDelete}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-current/50 hover:text-red-500 rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesComponent;

