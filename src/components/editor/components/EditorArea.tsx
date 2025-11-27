import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bookmark,
  StickyNote,
  Film,
  User,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { 
  ScriptElement, 
  RevisionColor, 
  ScriptNote, 
  AutoCompleteType,
  LineInfo 
} from '../types';
import { REVISION_COLORS, LINES_PER_PAGE } from '../constants';

// ============================================
// TYPES
// ============================================

interface EditorAreaProps {
  content: string;
  cursorPosition: number;
  currentElement: ScriptElement;
  currentLineInfo: LineInfo;
  fontSize: 'small' | 'medium' | 'large';
  notes: ScriptNote[];
  bookmarks: Set<number>;
  revisionMarks: Map<number, RevisionColor>;
  showAutoComplete: boolean;
  autoCompleteOptions: string[];
  autoCompleteIndex: number;
  autoCompleteType: AutoCompleteType;
  onContentChange: (content: string) => void;
  onCursorChange: (position: number) => void;
  onSelectionChange: (start: number, end: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAutoCompleteSelect: (option: string) => void;
}

// ============================================
// EDITOR AREA COMPONENT
// ============================================

const EditorArea: React.FC<EditorAreaProps> = ({
  content,
  currentLineInfo,
  fontSize,
  notes,
  bookmarks,
  revisionMarks,
  showAutoComplete,
  autoCompleteOptions,
  autoCompleteIndex,
  autoCompleteType,
  onContentChange,
  onCursorChange,
  onSelectionChange,
  onKeyDown,
  onAutoCompleteSelect,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = content.split('\n');

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle selection changes
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    onCursorChange(target.selectionStart);
    onSelectionChange(target.selectionStart, target.selectionEnd);
  }, [onCursorChange, onSelectionChange]);

  // Get font size class
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-[12px] leading-[22px]';
      case 'large': return 'text-[15px] leading-[28px]';
      default: return 'text-[13px] leading-[24px]';
    }
  };

  const getLineHeight = () => {
    switch (fontSize) {
      case 'small': return 22;
      case 'large': return 28;
      default: return 24;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex overflow-auto relative"
    >
      {/* Line Numbers Column */}
      <div 
        className="w-16 shrink-0 select-none border-r sticky left-0 z-10 bg-stone-50 text-stone-400 border-stone-200"
      >
        <div className="pt-3">
          {lines.map((_, i) => {
            const hasNote = notes.some(n => n.lineNumber === i + 1);
            const hasBookmark = bookmarks.has(i);
            const revColor = revisionMarks.get(i);
            const isPageBreak = (i + 1) % LINES_PER_PAGE === 0;
            const isCurrentLine = i === currentLineInfo.lineIndex;

            return (
              <div 
                key={i} 
                className={cn(
                  "font-mono flex items-center justify-end pr-2 gap-1.5 relative transition-colors",
                  getFontSizeClass(),
                  isPageBreak && 'border-b border-dashed border-stone-300',
                  revColor && REVISION_COLORS[revColor].bg,
                  isCurrentLine && 'bg-blue-50/50'
                )}
                style={{ height: `${getLineHeight()}px` }}
              >
                {/* Bookmark indicator */}
                {hasBookmark && (
                  <Bookmark 
                    size={9} 
                    className="text-blue-500 absolute left-1.5" 
                    fill="currentColor" 
                  />
                )}
                
                {/* Note indicator */}
                {hasNote && (
                  <StickyNote size={9} className="text-amber-500" />
                )}
                
                {/* Line number */}
                <span className={cn(
                  "text-[11px]",
                  isCurrentLine && 'text-stone-600'
                )}>
                  {i + 1}
                </span>
                
                {/* Revision asterisk */}
                {revColor && (
                  <span className="text-[8px] text-red-500">*</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-w-0 relative bg-white">
        <textarea
          ref={textareaRef}
          id="script-editor-textarea"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={handleSelect}
          onClick={handleSelect}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full min-h-full py-3 px-6 resize-none outline-none font-mono",
            getFontSizeClass(),
            "bg-transparent text-stone-800 placeholder:text-stone-400 caret-stone-900",
            "selection:bg-blue-500/30"
          )}
          style={{ 
            minHeight: `${Math.max(lines.length + 10, 30) * getLineHeight()}px`,
            tabSize: 4
          }}
          placeholder={`FADE IN:

INT. LOCATION - DAY

Description of the scene...

                    CHARACTER
          Dialogue goes here.

Press TAB to cycle through elements.
Type character names in CAPS for auto-complete.`}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />

        {/* Auto-complete Popup */}
        {showAutoComplete && autoCompleteOptions.length > 0 && (
          <div
            className="absolute z-50 w-64 rounded-xl shadow-2xl border overflow-hidden bg-white border-stone-200"
            style={{
              top: `${(currentLineInfo.lineIndex + 1) * getLineHeight() + 12}px`,
              left: '24px'
            }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border-b text-stone-400 border-stone-100 bg-stone-50">
              {autoCompleteType === 'character' && 'Characters'}
              {autoCompleteType === 'scene' && 'Scene Headings'}
              {autoCompleteType === 'transition' && 'Transitions'}
            </div>
            {autoCompleteOptions.slice(0, 8).map((option, i) => (
              <button
                key={option}
                onClick={() => onAutoCompleteSelect(option)}
                className={cn(
                  "w-full px-4 py-2.5 text-[13px] text-left transition-all flex items-center gap-3",
                  i === autoCompleteIndex
                    ? 'bg-blue-500 text-white'
                    : 'text-stone-700 hover:bg-stone-50'
                )}
              >
                {autoCompleteType === 'character' && <User size={14} />}
                {autoCompleteType === 'scene' && <Film size={14} />}
                {autoCompleteType === 'transition' && <ArrowRight size={14} />}
                <span className="font-mono">{option}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorArea;
