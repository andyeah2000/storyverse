import React from 'react';
import {
  Film,
  Type,
  User,
  MessageSquare,
  ArrowRight,
  Eye,
  AlignLeft,
  AlignCenter,
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ScriptElement, RevisionColor, LineInfo, ScriptStats } from '../types';
import { ELEMENT_STYLES, REVISION_COLORS } from '../constants';

// ============================================
// ICON MAP
// ============================================

const ICONS: Record<string, React.ReactNode> = {
  Film: <Film size={12} />,
  Type: <Type size={12} />,
  User: <User size={12} />,
  MessageSquare: <MessageSquare size={12} />,
  ArrowRight: <ArrowRight size={12} />,
  Eye: <Eye size={12} />,
  AlignLeft: <AlignLeft size={12} />,
  AlignCenter: <AlignCenter size={12} />,
};

// ============================================
// TYPES
// ============================================

interface StatusBarProps {
  currentElement: ScriptElement;
  currentLineInfo: LineInfo;
  stats: ScriptStats;
  revisionMode: boolean;
  currentRevisionColor: RevisionColor;
  isAIWorking: boolean;
  aiAction: string | null;
  isDirty: boolean;
  isSaving: boolean;
}

// ============================================
// STATUS BAR COMPONENT
// ============================================

const StatusBar: React.FC<StatusBarProps> = ({
  currentElement,
  currentLineInfo,
  stats,
  revisionMode,
  currentRevisionColor,
  isAIWorking,
  aiAction,
  isDirty,
  isSaving,
}) => {
  const elementStyle = ELEMENT_STYLES[currentElement];

  return (
    <div className="h-7 flex items-center justify-between px-3 border-t shrink-0 text-[10px] font-mono border-stone-200 bg-stone-50 text-stone-400">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Line:Column */}
        <span className="flex items-center gap-1">
          <span className="opacity-60">Ln</span>
          <span className="text-stone-600">
            {currentLineInfo.lineIndex + 1}
          </span>
          <span className="opacity-40">:</span>
          <span className="opacity-60">Col</span>
          <span className="text-stone-600">
            {currentLineInfo.column}
          </span>
        </span>

        {/* Separator */}
        <span className="opacity-30">•</span>

        {/* Current Element */}
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-200">
          {ICONS[elementStyle.icon]}
          <span className="text-stone-600">
            {elementStyle.label}
          </span>
        </span>

        {/* Revision Mode Badge */}
        {revisionMode && (
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide",
            REVISION_COLORS[currentRevisionColor].bg,
            REVISION_COLORS[currentRevisionColor].text
          )}>
            Rev
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Character Count */}
        <span className="flex items-center gap-1">
          <span className="opacity-60">Chars</span>
          <span className="text-stone-600">
            {stats.characterCount}
          </span>
        </span>

        {/* Word Count */}
        <span className="flex items-center gap-1">
          <span className="opacity-60">Words</span>
          <span className="text-stone-600">
            {stats.words.toLocaleString()}
          </span>
        </span>

        {/* Dialogue Percentage */}
        <span className="flex items-center gap-1">
          <span className="opacity-60">Dialog</span>
          <span className="text-stone-600">
            {stats.dialoguePercent}%
          </span>
        </span>

        {/* Separator */}
        <span className="opacity-30">•</span>

        {/* Save Status */}
        {isSaving ? (
          <span className="flex items-center gap-1 text-blue-500">
            <Loader2 size={10} className="animate-spin" />
            Saving
          </span>
        ) : isDirty ? (
          <span className="flex items-center gap-1 text-amber-600">
            <Save size={10} />
            Unsaved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-green-500">
            <Save size={10} />
            Saved
          </span>
        )}

        {/* AI Status */}
        {isAIWorking && (
          <span className="flex items-center gap-1 text-blue-500">
            <Loader2 size={10} className="animate-spin" />
            AI {aiAction}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
