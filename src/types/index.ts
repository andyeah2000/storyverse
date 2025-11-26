// ============================================
// CORE TYPES
// ============================================

export interface Source {
  id: string;
  title: string;
  content: string;
  type: 'character' | 'location' | 'lore' | 'script' | 'faction' | 'concept' | 'event';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  // Extended data based on type
  characterDetails?: CharacterDetails;
  characterSheet?: CharacterSheet;
  locationDetails?: LocationDetails;
  factionDetails?: FactionDetails;
}

export interface CharacterSheet {
  name: string;
  role: string;
  age: string;
  appearance: string;
  personality: string;
  backstory: string;
  motivation: string;
  relationships: string;
  arc: string;
  quirks: string;
}

export interface LocationDetails {
  region?: string;
  climate?: string;
  population?: string;
  significance?: string;
  history?: string;
  connectedTo?: string[];
}

export interface FactionDetails {
  type?: 'organization' | 'species' | 'family' | 'nation' | 'religion' | 'other';
  leader?: string;
  members?: string[];
  goals?: string;
  allies?: string[];
  enemies?: string[];
  history?: string;
}

export interface CharacterDetails {
  age?: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  motivation?: string;
  flaw?: string;
  arc?: string;
  relationships?: string;
  backstory?: string;
  voiceNotes?: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AudioTranscript {
  role: 'user' | 'model';
  text: string;
}

// ============================================
// ANALYSIS & STATS
// ============================================

export interface AnalysisData {
  tensionArc: number[];
  pacingScore: number;
  sentiment: string;
  suggestions: string[];
}

export interface WordStat {
  word: string;
  count: number;
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  sources: Source[];
  scripts: Script[];
  storyMap: StoryNode[];
  beatSheet: BeatSheet;
  outline: OutlineNode[];
  notes: Note[];
  moodBoard: MoodBoardItem[];
  chatHistory: ChatMessage[];
  ownerId?: string;
  access?: ProjectAccess;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  versions: ScriptVersion[];
}

export interface ScriptVersion {
  id: string;
  content: string;
  createdAt: number;
  label?: string;
}

// ============================================
// STORY STRUCTURE
// ============================================

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  type: 'outcome' | 'cause' | 'scene';
  parentId?: string;
}

export interface BeatSheet {
  openingImage?: string;
  themeStated?: string;
  setup?: string;
  catalyst?: string;
  debate?: string;
  breakIntoTwo?: string;
  bStory?: string;
  funAndGames?: string;
  midpoint?: string;
  badGuysCloseIn?: string;
  allIsLost?: string;
  darkNightOfSoul?: string;
  breakIntoThree?: string;
  finale?: string;
  finalImage?: string;
}

export interface OutlineNode {
  id: string;
  title: string;
  content?: string;
  type: 'act' | 'sequence' | 'scene' | 'beat';
  children: OutlineNode[];
  collapsed?: boolean;
}

// ============================================
// NOTES & MOOD BOARD
// ============================================

export interface Note {
  id: string;
  title?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  linkedTo?: {
    type: 'source' | 'scene' | 'beat';
    id: string;
  };
  color?: 'default' | 'yellow' | 'green' | 'blue' | 'red';
}

export interface MoodBoardItem {
  id: string;
  type: 'image' | 'color' | 'text' | 'link';
  content: string;
  caption?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// ============================================
// SETTINGS & PREFERENCES
// ============================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  apiKey?: string;
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system' | 'serif' | 'mono';
  showWordCount: boolean;
  showPageCount: boolean;
  keyboardShortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  save: string;
  newScene: string;
  toggleSidebar: string;
  search: string;
  export: string;
  undo: string;
  redo: string;
}

// ============================================
// APP STATE
// ============================================

export enum AppMode {
  EDITOR = 'EDITOR',
  UNIVERSE = 'UNIVERSE',
  CO_WRITER = 'CO_WRITER',
  TABLE_READ = 'TABLE_READ',
  INTERVIEW = 'INTERVIEW',
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'conflict';

export type ProjectAccess = 'owner' | 'edit' | 'view';

export interface ProjectShareInfo {
  id: string;
  project_id: string;
  project_name: string;
  shared_with_email: string;
  shared_with_user_id?: string | null;
  permission: 'view' | 'edit';
  accepted: boolean;
  created_at: string;
}

export interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 30,
  fontSize: 'medium',
  fontFamily: 'system',
  showWordCount: true,
  showPageCount: true,
  keyboardShortcuts: {
    save: '⌘S',
    newScene: '⌘⇧N',
    toggleSidebar: '⌘\\',
    search: '⌘K',
    export: '⌘E',
    undo: '⌘Z',
    redo: '⌘⇧Z',
  },
};

export const DEFAULT_BEAT_SHEET: BeatSheet = {
  openingImage: '',
  themeStated: '',
  setup: '',
  catalyst: '',
  debate: '',
  breakIntoTwo: '',
  bStory: '',
  funAndGames: '',
  midpoint: '',
  badGuysCloseIn: '',
  allIsLost: '',
  darkNightOfSoul: '',
  breakIntoThree: '',
  finale: '',
  finalImage: '',
};

// ============================================
// RE-EXPORT AGENT TYPES
// ============================================

export * from './agent';
