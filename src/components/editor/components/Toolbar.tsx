import React, { useState } from 'react';
import {
  Film,
  Type,
  User,
  MessageSquare,
  ArrowRight,
  Eye,
  AlignLeft,
  AlignCenter,
  ChevronDown,
  Search,
  StickyNote,
  Play,
  Pause,
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2,
  Download,
  List,
  FileEdit,
  PenLine,
  Wand2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ScriptElement, RevisionColor, ScriptStats } from '../types';
import { ELEMENT_STYLES, REVISION_COLORS } from '../constants';

// ============================================
// ICON MAP
// ============================================

const ICONS: Record<string, React.ReactNode> = {
  Film: <Film size={14} />,
  Type: <Type size={14} />,
  User: <User size={14} />,
  MessageSquare: <MessageSquare size={14} />,
  ArrowRight: <ArrowRight size={14} />,
  Eye: <Eye size={14} />,
  AlignLeft: <AlignLeft size={14} />,
  AlignCenter: <AlignCenter size={14} />,
};

// ============================================
// TYPES
// ============================================

interface ToolbarProps {
  isDark: boolean;
  currentElement: ScriptElement;
  stats: ScriptStats;
  showNavigator: boolean;
  revisionMode: boolean;
  currentRevisionColor: RevisionColor;
  isTableReading: boolean;
  isAIWorking: boolean;
  focusMode: boolean;
  hasSelection: boolean;
  onToggleNavigator: () => void;
  onElementChange: (element: ScriptElement) => void;
  onToggleRevision: () => void;
  onRevisionColorChange: (color: RevisionColor) => void;
  onToggleFindReplace: () => void;
  onToggleNoteInput: () => void;
  onToggleTableRead: () => void;
  onAIContinue: () => void;
  onAIRewrite: () => void;
  onAIDialogue: () => void;
  onToggleFocus: () => void;
  onExport: () => void;
}

// ============================================
// TOOLBAR COMPONENT
// ============================================

const Toolbar: React.FC<ToolbarProps> = ({
  isDark,
  currentElement,
  stats,
  showNavigator,
  revisionMode,
  currentRevisionColor,
  isTableReading,
  isAIWorking,
  focusMode,
  hasSelection,
  onToggleNavigator,
  onElementChange,
  onToggleRevision,
  onRevisionColorChange,
  onToggleFindReplace,
  onToggleNoteInput,
  onToggleTableRead,
  onAIContinue,
  onAIRewrite,
  onAIDialogue,
  onToggleFocus,
  onExport,
}) => {
  const [showElementMenu, setShowElementMenu] = useState(false);
  const [showRevisionMenu, setShowRevisionMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);

  const currentStyle = ELEMENT_STYLES[currentElement];

  return (
    <div className={cn(
      "h-12 flex items-center justify-between px-4 border-b shrink-0 gap-3",
      isDark ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'
    )}>
      {/* Left Section: Navigator + Element Selector */}
      <div className="flex items-center gap-2">
        {/* Navigator Toggle */}
        <button
          onClick={onToggleNavigator}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            showNavigator
              ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
              : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Toggle Navigator (⌘\\)"
        >
          <List size={16} />
        </button>

        <div className={cn("w-px h-6", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

        {/* Element Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowElementMenu(!showElementMenu)}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all min-w-[140px]",
              isDark 
                ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700' 
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200'
            )}
          >
            {ICONS[currentStyle.icon]}
            <span className="flex-1 text-left">{currentStyle.label}</span>
            <ChevronDown size={14} className={cn(
              "transition-transform",
              showElementMenu && "rotate-180"
            )} />
          </button>
          
          {showElementMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowElementMenu(false)} />
              <div className={cn(
                "absolute top-full left-0 mt-2 w-60 rounded-xl shadow-2xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <div className={cn(
                  "px-3 py-2 text-[10px] font-semibold uppercase tracking-wider",
                  isDark ? 'text-stone-500 bg-stone-800/50' : 'text-stone-400 bg-stone-50'
                )}>
                  Script Elements
                </div>
                {(Object.entries(ELEMENT_STYLES) as [ScriptElement, typeof ELEMENT_STYLES[ScriptElement]][]).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onElementChange(key);
                      setShowElementMenu(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-sm flex items-center justify-between transition-all",
                      isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700',
                      currentElement === key && (isDark ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-900')
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {ICONS[style.icon]}
                      {style.label}
                    </span>
                    <span className={cn(
                      "text-[11px] font-mono px-2 py-0.5 rounded",
                      isDark ? 'text-stone-500 bg-stone-800' : 'text-stone-400 bg-stone-100'
                    )}>
                      {style.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={cn("w-px h-6", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

        {/* Revision Mode */}
        <div className="relative">
          <button
            onClick={() => setShowRevisionMenu(!showRevisionMenu)}
            className={cn(
              "h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
              revisionMode
                ? `${REVISION_COLORS[currentRevisionColor].bg} ${REVISION_COLORS[currentRevisionColor].text} ${REVISION_COLORS[currentRevisionColor].border} border`
                : isDark 
                  ? 'hover:bg-stone-800 text-stone-400' 
                  : 'hover:bg-stone-100 text-stone-500'
            )}
            title="Revision Mode"
          >
            <FileEdit size={15} />
            {revisionMode && <span className="hidden sm:inline">Rev</span>}
          </button>
          
          {showRevisionMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRevisionMenu(false)} />
              <div className={cn(
                "absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <div className={cn(
                  "px-4 py-3 border-b flex items-center justify-between",
                  isDark ? 'border-stone-800' : 'border-stone-100'
                )}>
                  <span className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-stone-900')}>
                    Revision Mode
                  </span>
                  <label className="relative inline-flex cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revisionMode}
                      onChange={onToggleRevision}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-10 h-6 rounded-full peer transition-colors",
                      isDark 
                        ? 'bg-stone-700 peer-checked:bg-blue-600' 
                        : 'bg-stone-200 peer-checked:bg-blue-600',
                      "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                      "after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
                      "peer-checked:after:translate-x-4"
                    )} />
                  </label>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {(Object.entries(REVISION_COLORS) as [RevisionColor, typeof REVISION_COLORS[RevisionColor]][]).map(([color, config]) => (
                    <button
                      key={color}
                      onClick={() => {
                        onRevisionColorChange(color);
                        setShowRevisionMenu(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all",
                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50',
                        currentRevisionColor === color && revisionMode && 'ring-2 ring-blue-500 ring-offset-2',
                        isDark && currentRevisionColor === color && revisionMode && 'ring-offset-stone-900'
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border",
                        config.bg,
                        config.border
                      )} />
                      <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Find/Replace */}
        <button
          onClick={onToggleFindReplace}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Find & Replace (⌘F)"
        >
          <Search size={15} />
        </button>

        {/* Add Note */}
        <button
          onClick={onToggleNoteInput}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Add Note (⌘M)"
        >
          <StickyNote size={15} />
        </button>
      </div>

      {/* Center Section: Stats */}
      <div className={cn(
        "hidden lg:flex items-center gap-6 text-[12px] font-mono",
        isDark ? 'text-stone-500' : 'text-stone-400'
      )}>
        <div className="flex items-center gap-2">
          <span className="opacity-70">Scenes</span>
          <span className={cn("font-semibold", isDark ? 'text-white' : 'text-stone-900')}>
            {stats.sceneCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-70">Pages</span>
          <span className={cn("font-semibold", isDark ? 'text-white' : 'text-stone-900')}>
            {stats.pages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-70">~{stats.readTime}min</span>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2">
        {/* Table Read */}
        <button
          onClick={onToggleTableRead}
          className={cn(
            "h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
            isTableReading
              ? 'bg-green-500 text-white hover:bg-green-400'
              : isDark 
                ? 'hover:bg-stone-800 text-stone-400' 
                : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Table Read"
        >
          {isTableReading ? <Pause size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{isTableReading ? 'Stop' : 'Read'}</span>
        </button>

        {/* AI Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            disabled={isAIWorking}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all",
              isDark 
                ? 'bg-white text-stone-900 hover:bg-stone-100' 
                : 'bg-stone-900 text-white hover:bg-stone-800',
              isAIWorking && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isAIWorking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            AI
          </button>
          
          {showAIMenu && !isAIWorking && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
              <div className={cn(
                "absolute top-full right-0 mt-2 w-60 rounded-xl shadow-2xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <button
                  onClick={() => { onAIContinue(); setShowAIMenu(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-sm flex items-center gap-3 transition-all",
                    isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                  )}
                >
                  <PenLine size={15} />
                  Continue Writing
                </button>
                {hasSelection && (
                  <button
                    onClick={() => { onAIRewrite(); setShowAIMenu(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-sm flex items-center gap-3 transition-all",
                      isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                    )}
                  >
                    <Wand2 size={15} />
                    Rewrite Selection
                  </button>
                )}
                <button
                  onClick={() => { onAIDialogue(); setShowAIMenu(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-sm flex items-center gap-3 transition-all",
                    isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                  )}
                >
                  <MessageSquare size={15} />
                  Generate Dialogue
                </button>
              </div>
            </>
          )}
        </div>

        <div className={cn("w-px h-6 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

        {/* Focus Mode */}
        <button
          onClick={onToggleFocus}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            focusMode
              ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
              : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Focus Mode (⌘↵)"
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Export (⌘E)"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;

