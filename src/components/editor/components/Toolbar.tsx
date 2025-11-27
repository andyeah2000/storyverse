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
      "h-11 flex items-center justify-between px-3 border-b shrink-0 gap-2",
      isDark ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white'
    )}>
      {/* Left Section: Navigator + Element Selector */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Navigator Toggle */}
        <button
          onClick={onToggleNavigator}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            showNavigator
              ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
              : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Toggle Navigator (⌘\\)"
        >
          <List size={15} />
        </button>

        {/* Element Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowElementMenu(!showElementMenu)}
            className={cn(
              "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors w-[120px]",
              isDark 
                ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' 
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            )}
          >
            {ICONS[currentStyle.icon]}
            <span className="flex-1 text-left truncate">{currentStyle.label}</span>
            <ChevronDown size={12} className={cn(
              "transition-transform shrink-0",
              showElementMenu && "rotate-180"
            )} />
          </button>
          
          {showElementMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowElementMenu(false)} />
              <div className={cn(
                "absolute top-full left-0 mt-1.5 w-52 rounded-lg shadow-xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <div className={cn(
                  "px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider",
                  isDark ? 'text-stone-500 bg-stone-800/50' : 'text-stone-400 bg-stone-50'
                )}>
                  Elements
                </div>
                {(Object.entries(ELEMENT_STYLES) as [ScriptElement, typeof ELEMENT_STYLES[ScriptElement]][]).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onElementChange(key);
                      setShowElementMenu(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-xs flex items-center justify-between transition-colors",
                      isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-600',
                      currentElement === key && (isDark ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-900')
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {ICONS[style.icon]}
                      {style.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-mono",
                      isDark ? 'text-stone-600' : 'text-stone-400'
                    )}>
                      {style.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Revision Mode */}
        <div className="relative">
          <button
            onClick={() => setShowRevisionMenu(!showRevisionMenu)}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              revisionMode
                ? `${REVISION_COLORS[currentRevisionColor].bg} ${REVISION_COLORS[currentRevisionColor].text}`
                : isDark 
                  ? 'hover:bg-stone-800 text-stone-400' 
                  : 'hover:bg-stone-100 text-stone-500'
            )}
            title="Revision Mode"
          >
            <FileEdit size={14} />
          </button>
          
          {showRevisionMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRevisionMenu(false)} />
              <div className={cn(
                "absolute top-full left-0 mt-1.5 w-48 rounded-lg shadow-xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <div className={cn(
                  "px-3 py-2 border-b flex items-center justify-between",
                  isDark ? 'border-stone-800' : 'border-stone-100'
                )}>
                  <span className={cn("text-xs font-medium", isDark ? 'text-white' : 'text-stone-900')}>
                    Revision
                  </span>
                  <label className="relative inline-flex cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revisionMode}
                      onChange={onToggleRevision}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-8 h-5 rounded-full peer transition-colors",
                      isDark 
                        ? 'bg-stone-700 peer-checked:bg-blue-600' 
                        : 'bg-stone-200 peer-checked:bg-blue-600',
                      "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                      "after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all",
                      "peer-checked:after:translate-x-3"
                    )} />
                  </label>
                </div>
                <div className="p-1.5">
                  {(Object.entries(REVISION_COLORS) as [RevisionColor, typeof REVISION_COLORS[RevisionColor]][]).map(([color, config]) => (
                    <button
                      key={color}
                      onClick={() => {
                        onRevisionColorChange(color);
                        setShowRevisionMenu(false);
                      }}
                      className={cn(
                        "w-full px-2.5 py-1.5 rounded text-xs flex items-center gap-2 transition-colors",
                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50',
                        currentRevisionColor === color && revisionMode && (isDark ? 'bg-stone-800' : 'bg-stone-100')
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border",
                        config.bg,
                        config.border
                      )} />
                      <span className={isDark ? 'text-stone-300' : 'text-stone-600'}>
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
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Find & Replace (⌘F)"
        >
          <Search size={14} />
        </button>

        {/* Add Note */}
        <button
          onClick={onToggleNoteInput}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Add Note (⌘M)"
        >
          <StickyNote size={14} />
        </button>
      </div>

      {/* Center Section: Stats */}
      <div className={cn(
        "hidden lg:flex items-center gap-4 text-[11px] font-mono shrink-0",
        isDark ? 'text-stone-500' : 'text-stone-400'
      )}>
        <div className="flex items-center gap-1.5">
          <span className="opacity-60">Scenes</span>
          <span className={cn("font-semibold", isDark ? 'text-stone-300' : 'text-stone-700')}>
            {stats.sceneCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="opacity-60">Pages</span>
          <span className={cn("font-semibold", isDark ? 'text-stone-300' : 'text-stone-700')}>
            {stats.pages}
          </span>
        </div>
        <span className="opacity-60">~{stats.readTime}min</span>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Table Read */}
        <button
          onClick={onToggleTableRead}
          className={cn(
            "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
            isTableReading
              ? 'bg-green-500 text-white hover:bg-green-400'
              : isDark 
                ? 'hover:bg-stone-800 text-stone-400' 
                : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Table Read"
        >
          {isTableReading ? <Pause size={13} /> : <Play size={13} />}
          <span className="hidden sm:inline">{isTableReading ? 'Stop' : 'Read'}</span>
        </button>

        {/* AI Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            disabled={isAIWorking}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
              isDark 
                ? 'bg-white text-stone-900 hover:bg-stone-100' 
                : 'bg-stone-900 text-white hover:bg-stone-800',
              isAIWorking && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isAIWorking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            AI
          </button>
          
          {showAIMenu && !isAIWorking && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
              <div className={cn(
                "absolute top-full right-0 mt-1.5 w-48 rounded-lg shadow-xl z-50 border overflow-hidden",
                isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
              )}>
                <button
                  onClick={() => { onAIContinue(); setShowAIMenu(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                    isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-600'
                  )}
                >
                  <PenLine size={13} />
                  Continue Writing
                </button>
                {hasSelection && (
                  <button
                    onClick={() => { onAIRewrite(); setShowAIMenu(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                      isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-600'
                    )}
                  >
                    <Wand2 size={13} />
                    Rewrite Selection
                  </button>
                )}
                <button
                  onClick={() => { onAIDialogue(); setShowAIMenu(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors",
                    isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-600'
                  )}
                >
                  <MessageSquare size={13} />
                  Generate Dialogue
                </button>
              </div>
            </>
          )}
        </div>

        {/* Focus Mode */}
        <button
          onClick={onToggleFocus}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            focusMode
              ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
              : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Focus Mode (⌘↵)"
        >
          {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
          )}
          title="Export (⌘E)"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;

