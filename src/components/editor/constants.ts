import { ScriptElement, ElementStyle, RevisionColor, RevisionColorConfig } from './types';

// ============================================
// ELEMENT STYLES - Final Draft Formatting
// ============================================

export const ELEMENT_STYLES: Record<ScriptElement, ElementStyle> = {
  scene: {
    label: 'Scene Heading',
    icon: 'Film',
    shortcut: '⌘1',
    className: 'uppercase font-bold tracking-wide',
    prefix: 'INT. ',
    uppercase: true,
    nextElement: 'action',
    tabBehavior: 'next'
  },
  action: {
    label: 'Action',
    icon: 'Type',
    shortcut: '⌘2',
    className: '',
    nextElement: 'action',
    tabBehavior: 'cycle'
  },
  character: {
    label: 'Character',
    icon: 'User',
    shortcut: '⌘3',
    className: 'uppercase',
    marginLeft: '37%',
    uppercase: true,
    nextElement: 'dialogue',
    tabBehavior: 'next'
  },
  dialogue: {
    label: 'Dialogue',
    icon: 'MessageSquare',
    shortcut: '⌘4',
    className: '',
    marginLeft: '17%',
    marginRight: '25%',
    nextElement: 'character',
    tabBehavior: 'next'
  },
  parenthetical: {
    label: 'Parenthetical',
    icon: 'AlignCenter',
    shortcut: '⌘5',
    className: 'italic',
    marginLeft: '27%',
    marginRight: '35%',
    nextElement: 'dialogue',
    tabBehavior: 'next'
  },
  transition: {
    label: 'Transition',
    icon: 'ArrowRight',
    shortcut: '⌘6',
    className: 'uppercase',
    align: 'right',
    uppercase: true,
    nextElement: 'scene',
    tabBehavior: 'next'
  },
  shot: {
    label: 'Shot',
    icon: 'Eye',
    shortcut: '⌘7',
    className: 'uppercase',
    uppercase: true,
    nextElement: 'action',
    tabBehavior: 'next'
  },
  general: {
    label: 'General',
    icon: 'AlignLeft',
    shortcut: '⌘8',
    className: '',
    nextElement: 'general',
    tabBehavior: 'indent'
  }
};

// ============================================
// TRANSITIONS & SCENE PREFIXES
// ============================================

export const TRANSITIONS = [
  'CUT TO:',
  'DISSOLVE TO:',
  'FADE IN:',
  'FADE OUT.',
  'FADE TO BLACK.',
  'SMASH CUT TO:',
  'MATCH CUT TO:',
  'JUMP CUT TO:',
  'TIME CUT:',
  'IRIS IN:',
  'IRIS OUT:',
  'WIPE TO:',
  'FLASH CUT TO:',
  'INTERCUT WITH:',
  'BACK TO:',
  'CONTINUOUS:',
  'LATER:',
  'MOMENTS LATER:',
  'THE END.'
] as const;

export const SCENE_PREFIXES = [
  'INT. ',
  'EXT. ',
  'INT./EXT. ',
  'EXT./INT. ',
  'I/E. ',
  'E/I. ',
  'INT ',
  'EXT '
] as const;

export const SCENE_TIMES = [
  '- DAY',
  '- NIGHT',
  '- MORNING',
  '- EVENING',
  '- AFTERNOON',
  '- DAWN',
  '- DUSK',
  '- LATER',
  '- CONTINUOUS',
  '- SAME',
  '- MOMENTS LATER'
] as const;

export const SHOT_TYPES = [
  'ANGLE ON',
  'CLOSE ON',
  'CLOSE UP',
  'EXTREME CLOSE UP',
  'ECU',
  'CU',
  'MEDIUM SHOT',
  'MS',
  'WIDE SHOT',
  'WS',
  'ESTABLISHING SHOT',
  'POV',
  'INSERT',
  'FLASHBACK',
  'FLASH FORWARD',
  'DREAM SEQUENCE',
  'MONTAGE',
  'SERIES OF SHOTS',
  'INTERCUT',
  'SPLIT SCREEN',
  'FREEZE FRAME',
  'STOCK SHOT',
  'ARCHIVAL FOOTAGE',
  'SUPER:',
  'TITLE:',
  'CHYRON:',
  'CARD:'
] as const;

export const CHARACTER_EXTENSIONS = [
  '(V.O.)',
  '(O.S.)',
  '(O.C.)',
  '(CONT\'D)',
  '(PRE-LAP)',
  '(FILTER)',
  '(PHONE)',
  '(TEXT)',
  '(SUBTITLE)',
  '(CAPTION)'
] as const;

// ============================================
// REVISION COLORS - Industry Standard
// ============================================

export const REVISION_COLORS: Record<RevisionColor, RevisionColorConfig> = {
  white: { 
    bg: 'bg-white dark:bg-stone-900', 
    text: 'text-stone-900 dark:text-stone-100', 
    label: 'White (Original)',
    border: 'border-stone-200 dark:border-stone-800'
  },
  blue: { 
    bg: 'bg-blue-50 dark:bg-blue-950/30', 
    text: 'text-blue-900 dark:text-blue-100', 
    label: 'Blue (1st Revision)',
    border: 'border-blue-200 dark:border-blue-800'
  },
  pink: { 
    bg: 'bg-pink-50 dark:bg-pink-950/30', 
    text: 'text-pink-900 dark:text-pink-100', 
    label: 'Pink (2nd Revision)',
    border: 'border-pink-200 dark:border-pink-800'
  },
  yellow: { 
    bg: 'bg-yellow-50 dark:bg-yellow-950/30', 
    text: 'text-yellow-900 dark:text-yellow-100', 
    label: 'Yellow (3rd Revision)',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  green: { 
    bg: 'bg-green-50 dark:bg-green-950/30', 
    text: 'text-green-900 dark:text-green-100', 
    label: 'Green (4th Revision)',
    border: 'border-green-200 dark:border-green-800'
  },
  goldenrod: { 
    bg: 'bg-amber-50 dark:bg-amber-950/30', 
    text: 'text-amber-900 dark:text-amber-100', 
    label: 'Goldenrod (5th Revision)',
    border: 'border-amber-200 dark:border-amber-800'
  },
  buff: { 
    bg: 'bg-orange-50 dark:bg-orange-950/30', 
    text: 'text-orange-900 dark:text-orange-100', 
    label: 'Buff (6th Revision)',
    border: 'border-orange-200 dark:border-orange-800'
  },
  salmon: { 
    bg: 'bg-red-50 dark:bg-red-950/30', 
    text: 'text-red-900 dark:text-red-100', 
    label: 'Salmon (7th Revision)',
    border: 'border-red-200 dark:border-red-800'
  },
  cherry: { 
    bg: 'bg-rose-100 dark:bg-rose-950/40', 
    text: 'text-rose-900 dark:text-rose-100', 
    label: 'Cherry (8th Revision)',
    border: 'border-rose-200 dark:border-rose-800'
  },
};

// ============================================
// FORMATTING CONSTANTS
// ============================================

export const LINES_PER_PAGE = 56;
export const CHARS_PER_LINE = 60;
export const DIALOGUE_MARGIN_LEFT = 2.5; // inches
export const DIALOGUE_MARGIN_RIGHT = 2.5; // inches
export const CHARACTER_MARGIN = 3.7; // inches from left
export const PARENTHETICAL_MARGIN_LEFT = 3.1; // inches
export const PARENTHETICAL_MARGIN_RIGHT = 2.9; // inches
export const TRANSITION_MIN_MARGIN = 6.0; // inches from left

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

export const KEYBOARD_SHORTCUTS = {
  // Element shortcuts
  SCENE: { key: '1', meta: true, label: '⌘1' },
  ACTION: { key: '2', meta: true, label: '⌘2' },
  CHARACTER: { key: '3', meta: true, label: '⌘3' },
  DIALOGUE: { key: '4', meta: true, label: '⌘4' },
  PARENTHETICAL: { key: '5', meta: true, label: '⌘5' },
  TRANSITION: { key: '6', meta: true, label: '⌘6' },
  SHOT: { key: '7', meta: true, label: '⌘7' },
  GENERAL: { key: '8', meta: true, label: '⌘8' },
  
  // Actions
  SAVE: { key: 's', meta: true, label: '⌘S' },
  FIND: { key: 'f', meta: true, label: '⌘F' },
  REPLACE: { key: 'h', meta: true, label: '⌘H' },
  BOOKMARK: { key: 'b', meta: true, label: '⌘B' },
  NOTE: { key: 'm', meta: true, label: '⌘M' },
  FOCUS: { key: 'Enter', meta: true, label: '⌘↵' },
  EXPORT: { key: 'e', meta: true, label: '⌘E' },
  
  // Navigation
  NEXT_SCENE: { key: 'ArrowDown', meta: true, alt: true, label: '⌘⌥↓' },
  PREV_SCENE: { key: 'ArrowUp', meta: true, alt: true, label: '⌘⌥↑' },
  GOTO_LINE: { key: 'g', meta: true, label: '⌘G' },
  
  // View
  TOGGLE_NAVIGATOR: { key: '\\', meta: true, label: '⌘\\' },
  TOGGLE_INDEX_CARDS: { key: 'i', meta: true, shift: true, label: '⌘⇧I' },
  ZOOM_IN: { key: '=', meta: true, label: '⌘+' },
  ZOOM_OUT: { key: '-', meta: true, label: '⌘-' },
} as const;

// ============================================
// INDEX CARD COLORS
// ============================================

export const INDEX_CARD_COLORS = [
  { value: 'white', label: 'White', bg: 'bg-white', border: 'border-stone-200' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300' },
  { value: 'green', label: 'Green', bg: 'bg-green-100', border: 'border-green-300' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-100', border: 'border-pink-300' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', border: 'border-orange-300' },
] as const;

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_EDITOR_SETTINGS = {
  fontSize: 'medium' as const,
  fontFamily: 'courier-prime' as const,
  showLineNumbers: true,
  showPageBreaks: true,
  autoSave: true,
  autoSaveInterval: 30,
  spellCheck: false,
  autoCapitalize: true,
  smartQuotes: true,
  showInvisibles: false,
  highlightCurrentLine: true,
  wrapLines: true,
};

export const DEFAULT_TITLE_PAGE = {
  title: 'Untitled Screenplay',
  credit: 'Written by',
  author: '',
  source: '',
  draftDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  contact: '',
  copyright: '',
  notes: '',
};

// ============================================
// REGEX PATTERNS
// ============================================

export const PATTERNS = {
  // Scene heading: optional number, INT./EXT., location, optional time
  SCENE_HEADING: /^(?:(\d+[A-Z]?)\.?\s+)?(?:INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.|I\/E\.|E\/I\.)[\s]+.+$/i,
  
  // Character name: ALL CAPS, optional extension
  CHARACTER_NAME: /^([A-Z][A-Z\s.'-]+)(?:\s*\((?:V\.O\.|O\.S\.|O\.C\.|CONT'D|PRE-LAP|FILTER|PHONE|TEXT|SUBTITLE|CAPTION)\))?$/,
  
  // Parenthetical: wrapped in parentheses
  PARENTHETICAL: /^\s*\([^)]+\)\s*$/,
  
  // Transition: ends with colon or specific phrases
  TRANSITION: /^(?:CUT TO|DISSOLVE TO|FADE (?:IN|OUT|TO)|SMASH CUT TO|MATCH CUT TO|JUMP CUT TO|TIME CUT|IRIS (?:IN|OUT)|WIPE TO|FLASH CUT TO|INTERCUT|BACK TO|CONTINUOUS|LATER|MOMENTS LATER|THE END)[.:]?$/i,
  
  // Shot: starts with specific keywords
  SHOT: /^(?:ANGLE ON|CLOSE ON|CLOSE UP|EXTREME CLOSE UP|ECU|CU|MEDIUM SHOT|MS|WIDE SHOT|WS|ESTABLISHING SHOT|POV|INSERT|FLASHBACK|FLASH FORWARD|DREAM SEQUENCE|MONTAGE|SERIES OF SHOTS|INTERCUT|SPLIT SCREEN|FREEZE FRAME|STOCK SHOT|ARCHIVAL FOOTAGE|SUPER:|TITLE:|CHYRON:|CARD:)/i,
  
  // Page break marker
  PAGE_BREAK: /^={3,}$/,
  
  // Note marker: [[text]]
  NOTE: /\[\[([^\]]+)\]\]/g,
  
  // Centered text: >text<
  CENTERED: /^>(.+)<$/,
  
  // Bold: **text**
  BOLD: /\*\*([^*]+)\*\*/g,
  
  // Italic: *text*
  ITALIC: /(?<!\*)\*([^*]+)\*(?!\*)/g,
  
  // Underline: _text_
  UNDERLINE: /_([^_]+)_/g,
};

