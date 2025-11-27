import React from 'react';
import {
  Film,
  Users,
  StickyNote,
  Bookmark,
  Lock,
  Plus,
  X,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { NavigatorTab, SceneData, CharacterStats, ScriptNote } from '../types';

// ============================================
// TYPES
// ============================================

interface NavigatorProps {
  activeTab: NavigatorTab;
  scenes: SceneData[];
  characterStats: CharacterStats[];
  notes: ScriptNote[];
  bookmarks: Set<number>;
  content: string;
  onTabChange: (tab: NavigatorTab) => void;
  onSceneClick: (lineNumber: number) => void;
  onCharacterClick: (name: string) => void;
  onNoteClick: (lineNumber: number) => void;
  onBookmarkClick: (lineNumber: number) => void;
  onAddNote: () => void;
  onToggleNoteResolved: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

// ============================================
// TAB BUTTON COMPONENT
// ============================================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}> = ({ active, onClick, icon, title }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 h-full flex items-center justify-center transition-all relative",
      active
        ? 'text-stone-900'
        : 'text-stone-400 hover:text-stone-600'
    )}
    title={title}
  >
    {icon}
    {active && (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-stone-900" />
    )}
  </button>
);

// ============================================
// NAVIGATOR COMPONENT
// ============================================

const Navigator: React.FC<NavigatorProps> = ({
  activeTab,
  scenes,
  characterStats,
  notes,
  bookmarks,
  content,
  onTabChange,
  onSceneClick,
  onCharacterClick,
  onNoteClick,
  onBookmarkClick,
  onAddNote,
  onToggleNoteResolved,
  onDeleteNote,
}) => {
  const lines = content.split('\n');

  return (
    <div className="w-56 min-w-56 max-w-56 flex flex-col h-full rounded-xl border overflow-hidden bg-white border-stone-200">
      {/* Tabs */}
      <div className="h-11 flex items-center border-b shrink-0 border-stone-200">
        <TabButton
          active={activeTab === 'scenes'}
          onClick={() => onTabChange('scenes')}
          icon={<Film size={15} />}
          title="Scenes"
        />
        <TabButton
          active={activeTab === 'characters'}
          onClick={() => onTabChange('characters')}
          icon={<Users size={15} />}
          title="Characters"
        />
        <TabButton
          active={activeTab === 'notes'}
          onClick={() => onTabChange('notes')}
          icon={<StickyNote size={15} />}
          title="Notes"
        />
        <TabButton
          active={activeTab === 'bookmarks'}
          onClick={() => onTabChange('bookmarks')}
          icon={<Bookmark size={15} />}
          title="Bookmarks"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Scenes Tab */}
        {activeTab === 'scenes' && (
          <div className="space-y-1">
            {scenes.length === 0 ? (
              <EmptyState
                icon={<Film size={28} strokeWidth={1.5} />}
                title="No scenes yet"
                subtitle="Start with INT. or EXT."
              />
            ) : (
              scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onSceneClick(scene.lineNumber)}
                  className={cn(
                    "w-full text-left px-2 py-2 rounded-lg transition-colors group hover:bg-stone-50",
                    scene.omitted && 'opacity-40'
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-[10px] font-mono w-5 shrink-0 font-semibold pt-0.5 text-stone-400">
                      {scene.sceneNumber}
                    </span>
                    {scene.locked && (
                      <Lock size={10} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <span className={cn(
                      "text-[11px] font-medium leading-tight break-words transition-colors text-stone-600 group-hover:text-stone-900",
                      scene.omitted && 'line-through'
                    )} style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
                      {scene.text}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div className="space-y-1.5">
            {characterStats.length === 0 ? (
              <EmptyState
                icon={<Users size={28} strokeWidth={1.5} />}
                title="No characters yet"
                subtitle="Type names in CAPS"
              />
            ) : (
              characterStats.map((char, i) => (
                <button
                  key={i}
                  onClick={() => onCharacterClick(char.name)}
                  className="w-full p-3 rounded-lg text-left transition-all bg-stone-50 hover:bg-stone-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-stone-900">
                      {char.name}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-600">
                      {char.dialogueCount} lines
                    </span>
                  </div>
                  <div className="text-[11px] mt-1.5 flex items-center gap-3 text-stone-400">
                    <span>{char.wordCount} words</span>
                    <span>•</span>
                    <span>First: L{char.firstAppearance}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-1.5">
            <button
              onClick={onAddNote}
              className="w-full p-2.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 transition-all bg-amber-100 text-amber-700 hover:bg-amber-200"
            >
              <Plus size={14} />
              Add Note
            </button>
            
            {notes.length === 0 ? (
              <EmptyState
                icon={<StickyNote size={28} strokeWidth={1.5} />}
                title="No notes yet"
                subtitle="Press ⌘M to add"
              />
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  className={cn(
                    "p-3 rounded-lg group transition-all bg-amber-50",
                    note.resolved ? 'opacity-50' : ''
                  )}
                >
                  <div className="flex items-start gap-2">
                    <button 
                      onClick={() => onToggleNoteResolved(note.id)}
                      className="mt-0.5 shrink-0"
                    >
                      {note.resolved ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-600" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[12px] leading-relaxed text-stone-700",
                        note.resolved && 'line-through'
                      )}>
                        {note.text}
                      </p>
                      <button
                        onClick={() => onNoteClick(note.lineNumber)}
                        className="text-[11px] mt-1.5 transition-colors text-stone-400 hover:text-stone-900"
                      >
                        Line {note.lineNumber}
                      </button>
                    </div>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-1">
            {bookmarks.size === 0 ? (
              <EmptyState
                icon={<Bookmark size={28} strokeWidth={1.5} />}
                title="No bookmarks"
                subtitle="Press ⌘B to bookmark"
              />
            ) : (
              Array.from(bookmarks).sort((a, b) => a - b).map(lineNum => {
                const lineText = lines[lineNum] || '';
                return (
                  <button
                    key={lineNum}
                    onClick={() => onBookmarkClick(lineNum + 1)}
                    className="w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2.5 hover:bg-stone-50"
                  >
                    <Bookmark 
                      size={13} 
                      className="text-blue-500 shrink-0" 
                      fill="currentColor" 
                    />
                    <span className="text-[12px] truncate flex-1 text-stone-700">
                      {lineText.trim() || `Line ${lineNum + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {lineNum + 1}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-stone-300">
    {icon}
    <p className="text-[13px] font-medium mt-3 text-stone-500">
      {title}
    </p>
    <p className="text-[11px] mt-1 text-stone-400">
      {subtitle}
    </p>
  </div>
);

export default Navigator;
