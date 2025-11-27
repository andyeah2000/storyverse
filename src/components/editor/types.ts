// ============================================
// SCRIPT EDITOR TYPES - Final Draft Level
// ============================================

export type ScriptElement = 
  | 'scene' 
  | 'action' 
  | 'character' 
  | 'dialogue' 
  | 'parenthetical' 
  | 'transition' 
  | 'shot' 
  | 'general';

export type ViewMode = 'script' | 'index-cards' | 'outline' | 'split';

export type RevisionColor = 
  | 'white' 
  | 'blue' 
  | 'pink' 
  | 'yellow' 
  | 'green' 
  | 'goldenrod' 
  | 'buff' 
  | 'salmon' 
  | 'cherry';

export type NavigatorTab = 'scenes' | 'characters' | 'notes' | 'bookmarks';

export type AutoCompleteType = 'character' | 'scene' | 'transition';

// ============================================
// INTERFACES
// ============================================

export interface ScriptNote {
  id: string;
  lineNumber: number;
  text: string;
  resolved: boolean;
  createdAt: number;
  author?: string;
}

export interface SceneData {
  id: string;
  index: number;
  text: string;
  lineNumber: number;
  sceneNumber?: string;
  locked: boolean;
  omitted: boolean;
  color?: string;
  synopsis?: string;
  duration?: number; // estimated minutes
}

export interface CharacterStats {
  name: string;
  dialogueCount: number;
  wordCount: number;
  firstAppearance: number;
  lastAppearance: number;
  scenes: number[];
}

export interface LineInfo {
  lineIndex: number;
  lineText: string;
  lineStart: number;
  lineEnd: number;
  column: number;
  element?: ScriptElement;
}

export interface ElementStyle {
  label: string;
  icon: string; // icon name
  shortcut: string;
  className: string;
  prefix?: string;
  marginLeft?: string;
  marginRight?: string;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
  nextElement?: ScriptElement;
  tabBehavior?: 'cycle' | 'next' | 'indent';
}

export interface RevisionColorConfig {
  bg: string;
  text: string;
  label: string;
  border: string;
}

export interface ScriptStats {
  words: number;
  chars: number;
  pages: number;
  readTime: number;
  dialoguePercent: number;
  sceneCount: number;
  characterCount: number;
}

export interface ExportOptions {
  title: string;
  author: string;
  contact?: string;
  draftDate?: string;
  copyright?: string;
  includeTitlePage: boolean;
  format: 'pdf' | 'fountain' | 'fdx' | 'html';
  watermark?: string;
  revisionColor?: RevisionColor;
}

export interface TitlePageData {
  title: string;
  credit: string;
  author: string;
  source?: string;
  draftDate: string;
  contact?: string;
  copyright?: string;
  notes?: string;
}

export interface DualDialogueBlock {
  id: string;
  leftCharacter: string;
  leftDialogue: string;
  leftParenthetical?: string;
  rightCharacter: string;
  rightDialogue: string;
  rightParenthetical?: string;
  lineNumber: number;
}

export interface IndexCard {
  id: string;
  sceneId: string;
  title: string;
  synopsis: string;
  color: string;
  order: number;
  act?: number;
  sequence?: number;
}

export interface EditorSettings {
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'courier' | 'courier-prime' | 'system';
  showLineNumbers: boolean;
  showPageBreaks: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  autoCapitalize: boolean;
  smartQuotes: boolean;
  showInvisibles: boolean;
  highlightCurrentLine: boolean;
  wrapLines: boolean;
}

// ============================================
// STATE TYPES
// ============================================

export interface EditorState {
  content: string;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  currentElement: ScriptElement;
  currentLineInfo: LineInfo;
  isDirty: boolean;
  lastSaved: number | null;
}

export interface NavigatorState {
  isVisible: boolean;
  activeTab: NavigatorTab;
  searchQuery: string;
  collapsedSections: Set<string>;
}

export interface RevisionState {
  isEnabled: boolean;
  currentColor: RevisionColor;
  marks: Map<number, RevisionColor>;
  showChanges: boolean;
}

export interface AutoCompleteState {
  isVisible: boolean;
  options: string[];
  selectedIndex: number;
  type: AutoCompleteType;
  position: { top: number; left: number };
}

export interface UIState {
  viewMode: ViewMode;
  focusMode: boolean;
  showFindReplace: boolean;
  showNoteInput: boolean;
  showExportModal: boolean;
  showSettingsModal: boolean;
  showTitlePageModal: boolean;
  isTableReading: boolean;
  tableReadLine: number;
}

// ============================================
// ACTION TYPES
// ============================================

export type EditorAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'SET_CURSOR'; payload: number }
  | { type: 'SET_SELECTION'; payload: { start: number; end: number } }
  | { type: 'SET_ELEMENT'; payload: ScriptElement }
  | { type: 'INSERT_TEXT'; payload: { text: string; position: number } }
  | { type: 'DELETE_TEXT'; payload: { start: number; end: number } }
  | { type: 'REPLACE_TEXT'; payload: { start: number; end: number; text: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE' }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' };

// ============================================
// CALLBACK TYPES
// ============================================

export interface EditorCallbacks {
  onContentChange: (content: string) => void;
  onSave: (content: string) => void;
  onExport: (options: ExportOptions) => void;
  onSceneSelect: (sceneId: string) => void;
  onCharacterSelect: (name: string) => void;
  onNoteAdd: (note: Omit<ScriptNote, 'id' | 'createdAt'>) => void;
  onNoteUpdate: (id: string, updates: Partial<ScriptNote>) => void;
  onNoteDelete: (id: string) => void;
}

