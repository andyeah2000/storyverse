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
  FileEdit,
  PenLine,
  Wand2,
  Undo2,
  Redo2
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
  currentElement: ScriptElement;
  stats: ScriptStats;
  revisionMode: boolean;
  currentRevisionColor: RevisionColor;
  isTableReading: boolean;
  isAIWorking: boolean;
  focusMode: boolean;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
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
  onUndo: () => void;
  onRedo: () => void;
}

// ============================================
// TOOLBAR COMPONENT
// ============================================

const Toolbar: React.FC<ToolbarProps> = ({
  currentElement,
  stats,
  revisionMode,
  currentRevisionColor,
  isTableReading,
  isAIWorking,
  focusMode,
  hasSelection,
  canUndo,
  canRedo,
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
  onUndo,
  onRedo,
}) => {
  const [showElementMenu, setShowElementMenu] = useState(false);
  const [showRevisionMenu, setShowRevisionMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);

  const currentStyle = ELEMENT_STYLES[currentElement];

  const Divider = () => (
    <div className="w-px h-5 bg-stone-200 mx-1" />
  );

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b shrink-0 gap-2 border-stone-200 bg-white/80 backdrop-blur-sm z-20 relative">
      {/* Left Section: Writing Tools */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30"
            title="Undo (⌘Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30"
            title="Redo (⌘⇧Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        <Divider />

        {/* Element Type Selector */}
        <div className="relative">
          <button
            onClick={() => setShowElementMenu(!showElementMenu)}
            className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all w-[140px] bg-stone-100 text-stone-700 hover:bg-stone-200 border border-transparent hover:border-stone-300/50"
          >
            <span className="opacity-70">{ICONS[currentStyle.icon]}</span>
            <span className="flex-1 text-left truncate font-semibold">{currentStyle.label}</span>
            <ChevronDown size={12} className={cn(
              "transition-transform shrink-0 opacity-50",
              showElementMenu && "rotate-180"
            )} />
          </button>
          
          {showElementMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowElementMenu(false)} />
              <div className="absolute top-full left-0 mt-1.5 w-60 rounded-xl shadow-xl z-50 border overflow-hidden bg-white border-stone-200 p-1.5">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
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
                      "w-full px-3 py-2 text-xs flex items-center justify-between rounded-lg transition-colors",
                      currentElement === key 
                        ? 'bg-stone-100 text-stone-900 font-medium' 
                        : 'text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="opacity-70">{ICONS[style.icon]}</span>
                      {style.label}
                    </span>
                    <kbd className="text-[10px] font-sans text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                      {style.shortcut}
                    </kbd>
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
              "h-8 px-2 rounded-lg flex items-center gap-2 transition-colors border border-transparent",
              revisionMode
                ? `${REVISION_COLORS[currentRevisionColor].bg} ${REVISION_COLORS[currentRevisionColor].text} border-${currentRevisionColor}-200`
                : 'hover:bg-stone-100 text-stone-500 hover:text-stone-900'
            )}
            title="Revision Mode"
          >
            <FileEdit size={15} />
            {revisionMode && (
              <span className="text-[10px] font-medium uppercase tracking-wide hidden sm:inline">
                Rev
              </span>
            )}
          </button>
          
          {showRevisionMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRevisionMenu(false)} />
              <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl shadow-xl z-50 border overflow-hidden bg-white border-stone-200">
                <div className="px-4 py-3 border-b flex items-center justify-between border-stone-100 bg-stone-50/50">
                  <span className="text-xs font-semibold text-stone-900">
                    Revision Mode
                  </span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={revisionMode}
                      onChange={onToggleRevision}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-9 h-5 rounded-full peer transition-all bg-stone-200 peer-checked:bg-stone-900",
                      "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
                      "after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all",
                      "peer-checked:after:translate-x-4"
                    )} />
                  </label>
                </div>
                <div className="p-2 grid grid-cols-1 gap-1">
                  {(Object.entries(REVISION_COLORS) as [RevisionColor, typeof REVISION_COLORS[RevisionColor]][]).map(([color, config]) => (
                    <button
                      key={color}
                      onClick={() => {
                        onRevisionColorChange(color);
                        setShowRevisionMenu(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-xs flex items-center gap-3 transition-all",
                        currentRevisionColor === color && revisionMode 
                          ? 'bg-stone-100 ring-1 ring-stone-200' 
                          : 'hover:bg-stone-50'
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full ring-2 ring-offset-1 ring-transparent",
                        config.bg.replace('bg-', 'bg-'), // keep bg color
                        config.border.replace('border-', 'border-'), // keep border
                        currentRevisionColor === color && "ring-stone-300"
                      )} style={{ backgroundColor: color === 'white' ? '#ffffff' : undefined }} />
                      <span className="text-stone-700 font-medium">
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Tools Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFindReplace}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title="Find & Replace (⌘F)"
          >
            <Search size={15} />
          </button>

          <button
            onClick={onToggleNoteInput}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title="Add Note (⌘M)"
          >
            <StickyNote size={15} />
          </button>
        </div>
      </div>

      {/* Center Section: Stats */}
      <div className="hidden lg:flex items-center gap-6 text-[10px] font-medium tracking-wide uppercase shrink-0 text-stone-400 select-none">
        <div className="flex items-center gap-2">
          <span>Scenes</span>
          <span className="text-stone-700 font-bold text-xs">
            {stats.sceneCount}
          </span>
        </div>
        <div className="w-px h-3 bg-stone-200" />
        <div className="flex items-center gap-2">
          <span>Pages</span>
          <span className="text-stone-700 font-bold text-xs">
            {stats.pages}
          </span>
        </div>
        <div className="w-px h-3 bg-stone-200" />
        <div className="flex items-center gap-2">
          <span>Time</span>
          <span className="text-stone-700 font-bold text-xs">
            ~{stats.readTime}m
          </span>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Table Read */}
        <button
          onClick={onToggleTableRead}
          className={cn(
            "h-8 pl-2.5 pr-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border",
            isTableReading
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          )}
          title="Table Read"
        >
          {isTableReading ? (
            <Pause size={12} className="fill-current" />
          ) : (
            <Play size={12} className="fill-current" />
          )}
          <span className="hidden xl:inline">Read</span>
        </button>

        <Divider />

        {/* AI Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            disabled={isAIWorking}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm",
              isAIWorking 
                ? 'bg-amber-100 text-amber-700 cursor-wait' 
                : 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow'
            )}
          >
            {isAIWorking ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span className="hidden sm:inline">AI Tools</span>
          </button>
          
          {showAIMenu && !isAIWorking && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
              <div className="absolute top-full right-0 mt-1.5 w-52 rounded-xl shadow-xl z-50 border overflow-hidden bg-white border-stone-200 p-1.5">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  AI Assistant
                </div>
                <button
                  onClick={() => { onAIContinue(); setShowAIMenu(false); }}
                  className="w-full px-3 py-2 text-xs flex items-center gap-3 rounded-lg transition-colors hover:bg-stone-50 text-stone-700"
                >
                  <PenLine size={14} className="text-stone-400" />
                  Continue Writing
                </button>
                {hasSelection && (
                  <button
                    onClick={() => { onAIRewrite(); setShowAIMenu(false); }}
                    className="w-full px-3 py-2 text-xs flex items-center gap-3 rounded-lg transition-colors hover:bg-stone-50 text-stone-700"
                  >
                    <Wand2 size={14} className="text-purple-500" />
                    Rewrite Selection
                  </button>
                )}
                <button
                  onClick={() => { onAIDialogue(); setShowAIMenu(false); }}
                  className="w-full px-3 py-2 text-xs flex items-center gap-3 rounded-lg transition-colors hover:bg-stone-50 text-stone-700"
                >
                  <MessageSquare size={14} className="text-blue-500" />
                  Generate Dialogue
                </button>
              </div>
            </>
          )}
        </div>

        <Divider />

        {/* Focus & Export Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFocus}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              focusMode
                ? 'bg-stone-100 text-stone-900'
                : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
            )}
            title="Focus Mode (⌘↵)"
          >
            {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            onClick={onExport}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            title="Export (⌘E)"
          >
            <Download size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;