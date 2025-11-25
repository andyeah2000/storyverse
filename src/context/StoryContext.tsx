import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Source,
  Project,
  Script,
  ScriptVersion,
  StoryNode,
  BeatSheet,
  OutlineNode,
  Note,
  MoodBoardItem,
  AppSettings,
  ChatMessage,
  SaveStatus,
  DEFAULT_SETTINGS,
  DEFAULT_BEAT_SHEET,
} from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ============================================
// CONTEXT TYPE
// ============================================

interface StoryContextType {
  // Project Management
  projects: Project[];
  currentProject: Project | null;
  createProject: (name: string, description?: string) => void;
  selectProject: (id: string) => void;
  updateProject: (updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;

  // Sources
  sources: Source[];
  addSource: (source: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  deleteSource: (id: string) => void;

  // Scripts
  scripts: Script[];
  activeScript: Script | null;
  setActiveScript: (id: string | null) => void;
  createScript: (title: string) => void;
  updateScript: (id: string, content: string) => void;
  deleteScript: (id: string) => void;
  saveScriptVersion: (scriptId: string, label?: string) => void;
  restoreScriptVersion: (scriptId: string, versionId: string) => void;

  // Story Map
  storyMap: StoryNode[];
  addStoryNode: (node: Omit<StoryNode, 'id'>) => void;
  updateStoryNode: (id: string, updates: Partial<StoryNode>) => void;
  deleteStoryNode: (id: string) => void;

  // Beat Sheet
  beatSheet: BeatSheet;
  updateBeatSheet: (updates: Partial<BeatSheet>) => void;

  // Outline
  outline: OutlineNode[];
  addOutlineNode: (node: Omit<OutlineNode, 'id' | 'children'>, parentId?: string) => void;
  updateOutlineNode: (id: string, updates: Partial<OutlineNode>) => void;
  deleteOutlineNode: (id: string) => void;
  moveOutlineNode: (id: string, newParentId: string | null, index: number) => void;

  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Mood Board
  moodBoard: MoodBoardItem[];
  addMoodBoardItem: (item: Omit<MoodBoardItem, 'id'>) => void;
  updateMoodBoardItem: (id: string, updates: Partial<MoodBoardItem>) => void;
  deleteMoodBoardItem: (id: string) => void;

  // Chat History
  chatHistory: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // UI State
  theme: 'light' | 'dark';
  saveStatus: SaveStatus;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Search
  searchResults: Source[];

  // Export
  exportProject: (format: 'json' | 'fountain' | 'pdf') => void;
  importProject: (data: string) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PROJECTS: 'storyverse_projects',
  CURRENT_PROJECT_ID: 'storyverse_current_project',
  SETTINGS: 'storyverse_settings',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = () => crypto.randomUUID();

const createDefaultProject = (name: string, description?: string): Project => ({
  id: generateId(),
  name,
  description,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sources: [],
  scripts: [],
  storyMap: [{ id: 'root', title: 'Final Climax', description: 'The story reaches its peak.', type: 'outcome' }],
  beatSheet: { ...DEFAULT_BEAT_SHEET },
  outline: [],
  notes: [],
  moodBoard: [],
  chatHistory: [],
});

// ============================================
// PROVIDER
// ============================================

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isSupabaseMode } = useAuth();
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // STATE
  // ============================================

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [_isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Undo/Redo history
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  // ============================================
  // LOAD DATA ON AUTH CHANGE
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      if (isSupabaseMode && isAuthenticated && user) {
        // SUPABASE MODE - Load from cloud
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            const loadedProjects = data.map(p => ({
              ...p.data,
              id: p.id,
            } as Project));
            setProjects(loadedProjects);
            const firstProject = loadedProjects[0];
            if (firstProject) {
              setCurrentProjectId(firstProject.id);
            }
          } else {
            // No projects - create default
            const defaultProject = createDefaultProject('My First Story', 'A new storytelling adventure');
            setProjects([defaultProject]);
            setCurrentProjectId(defaultProject.id);
            
            // Save to Supabase
            await supabase.from('projects').insert({
              id: defaultProject.id,
              user_id: user.id,
              name: defaultProject.name,
              data: defaultProject,
            });
          }

          // Load settings from Supabase
          const { data: settingsData } = await supabase
            .from('user_settings')
            .select('settings')
            .eq('user_id', user.id)
            .single();

          if (settingsData?.settings) {
            setSettings({ ...DEFAULT_SETTINGS, ...settingsData.settings });
          }
        } catch (error) {
          console.error('Failed to load from Supabase:', error);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // LOCAL MODE - Load from localStorage
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
      isInitialized.current = true;
    };

    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (saved) {
          const parsed = JSON.parse(saved);
          setProjects(parsed);
          const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
          setCurrentProjectId(savedId || parsed[0]?.id || '');
        } else {
          const defaultProject = createDefaultProject('My First Story', 'A new storytelling adventure');
          setProjects([defaultProject]);
          setCurrentProjectId(defaultProject.id);
        }
      } catch (e) {
        console.error('Failed to load from localStorage:', e);
        const defaultProject = createDefaultProject('My First Story');
        setProjects([defaultProject]);
        setCurrentProjectId(defaultProject.id);
      }
    };

    loadData();
  }, [isSupabaseMode, isAuthenticated, user]);

  // ============================================
  // DERIVED STATE
  // ============================================

  const currentProject = useMemo(
    () => projects.find(p => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  const sources = currentProject?.sources || [];
  const scripts = currentProject?.scripts || [];
  const storyMap = currentProject?.storyMap || [];
  const beatSheet = currentProject?.beatSheet || DEFAULT_BEAT_SHEET;
  const outline = currentProject?.outline || [];
  const notes = currentProject?.notes || [];
  const moodBoard = currentProject?.moodBoard || [];
  const chatHistory = currentProject?.chatHistory || [];

  const activeScript = useMemo(
    () => scripts.find(s => s.id === activeScriptId) || null,
    [scripts, activeScriptId]
  );

  const theme = useMemo(() => {
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme;
  }, [settings.theme]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const query = searchQuery.toLowerCase();
    return sources.filter(
      s =>
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query) ||
        s.tags?.some(t => t.toLowerCase().includes(query))
    );
  }, [sources, searchQuery]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  // ============================================
  // PERSISTENCE
  // ============================================

  useEffect(() => {
    // Don't save during initial load
    if (!isInitialized.current || projects.length === 0) return;

    setSaveStatus('saving');
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (isSupabaseMode && isAuthenticated && user) {
          // SUPABASE MODE - Save to cloud
          const currentProj = projects.find(p => p.id === currentProjectId);
          if (currentProj) {
            const { error } = await supabase
              .from('projects')
              .upsert({
                id: currentProj.id,
                user_id: user.id,
                name: currentProj.name,
                data: currentProj,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'id' });

            if (error) throw error;
          }
          
          // Also save to localStorage as backup
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
          localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, currentProjectId);
        } else {
          // LOCAL MODE
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
          localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, currentProjectId);
        }
        setSaveStatus('saved');
      } catch (e) {
        console.error('Failed to save:', e);
        setSaveStatus('error');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projects, currentProjectId, isSupabaseMode, isAuthenticated, user]);

  // Save settings
  useEffect(() => {
    if (!isInitialized.current) return;

    const saveSettings = async () => {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      if (isSupabaseMode && isAuthenticated && user) {
        try {
          await supabase.from('user_settings').upsert({
            user_id: user.id,
            settings,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        } catch (e) {
          console.error('Failed to save settings to cloud:', e);
        }
      }
    };

    saveSettings();
  }, [settings, isSupabaseMode, isAuthenticated, user]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ============================================
  // UNDO/REDO HELPERS
  // ============================================

  const pushUndo = useCallback(() => {
    if (currentProject) {
      setUndoStack(prev => [...prev.slice(-49), currentProject]);
      setRedoStack([]);
    }
  }, [currentProject]);

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  const updateCurrentProject = useCallback((updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === currentProjectId
          ? { ...p, ...updates, updatedAt: Date.now() }
          : p
      )
    );
  }, [currentProjectId]);

  const createProject = useCallback((name: string, description?: string) => {
    const newProject = createDefaultProject(name, description);
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
  }, []);

  const selectProject = useCallback((id: string) => {
    setCurrentProjectId(id);
    setActiveScriptId(null);
  }, []);

  const updateProject = useCallback((updates: Partial<Project>) => {
    pushUndo();
    updateCurrentProject(updates);
  }, [pushUndo, updateCurrentProject]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length === 0) {
        return [createDefaultProject('Untitled Project')];
      }
      return filtered;
    });
    if (currentProjectId === id) {
      setCurrentProjectId(projects.find(p => p.id !== id)?.id || '');
    }
  }, [currentProjectId, projects]);

  const duplicateProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      const newProject: Project = {
        ...project,
        id: generateId(),
        name: `${project.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProjects(prev => [...prev, newProject]);
    }
  }, [projects]);

  // ============================================
  // SOURCES
  // ============================================

  const addSource = useCallback((source: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>) => {
    pushUndo();
    const newSource: Source = {
      ...source,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateCurrentProject({ sources: [...sources, newSource] });
  }, [sources, pushUndo, updateCurrentProject]);

  const updateSource = useCallback((id: string, updates: Partial<Source>) => {
    pushUndo();
    updateCurrentProject({
      sources: sources.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ),
    });
  }, [sources, pushUndo, updateCurrentProject]);

  const deleteSource = useCallback((id: string) => {
    pushUndo();
    updateCurrentProject({ sources: sources.filter(s => s.id !== id) });
  }, [sources, pushUndo, updateCurrentProject]);

  // ============================================
  // SCRIPTS
  // ============================================

  const setActiveScript = useCallback((id: string | null) => {
    setActiveScriptId(id);
  }, []);

  const createScript = useCallback((title: string) => {
    pushUndo();
    const newScript: Script = {
      id: generateId(),
      title,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      versions: [],
    };
    updateCurrentProject({ scripts: [...scripts, newScript] });
    setActiveScriptId(newScript.id);
  }, [scripts, pushUndo, updateCurrentProject]);

  const updateScript = useCallback((id: string, content: string) => {
    updateCurrentProject({
      scripts: scripts.map(s =>
        s.id === id ? { ...s, content, updatedAt: Date.now() } : s
      ),
    });
  }, [scripts, updateCurrentProject]);

  const deleteScript = useCallback((id: string) => {
    pushUndo();
    updateCurrentProject({ scripts: scripts.filter(s => s.id !== id) });
    if (activeScriptId === id) {
      setActiveScriptId(null);
    }
  }, [scripts, activeScriptId, pushUndo, updateCurrentProject]);

  const saveScriptVersion = useCallback((scriptId: string, label?: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    const version: ScriptVersion = {
      id: generateId(),
      content: script.content,
      createdAt: Date.now(),
      label,
    };

    updateCurrentProject({
      scripts: scripts.map(s =>
        s.id === scriptId
          ? { ...s, versions: [...s.versions, version] }
          : s
      ),
    });
  }, [scripts, updateCurrentProject]);

  const restoreScriptVersion = useCallback((scriptId: string, versionId: string) => {
    pushUndo();
    const script = scripts.find(s => s.id === scriptId);
    const version = script?.versions.find(v => v.id === versionId);
    if (!version) return;

    updateCurrentProject({
      scripts: scripts.map(s =>
        s.id === scriptId
          ? { ...s, content: version.content, updatedAt: Date.now() }
          : s
      ),
    });
  }, [scripts, pushUndo, updateCurrentProject]);

  // ============================================
  // STORY MAP
  // ============================================

  const addStoryNode = useCallback((node: Omit<StoryNode, 'id'>) => {
    pushUndo();
    const newNode: StoryNode = { ...node, id: generateId() };
    updateCurrentProject({ storyMap: [...storyMap, newNode] });
  }, [storyMap, pushUndo, updateCurrentProject]);

  const updateStoryNode = useCallback((id: string, updates: Partial<StoryNode>) => {
    pushUndo();
    updateCurrentProject({
      storyMap: storyMap.map(n => (n.id === id ? { ...n, ...updates } : n)),
    });
  }, [storyMap, pushUndo, updateCurrentProject]);

  const deleteStoryNode = useCallback((id: string) => {
    pushUndo();
    updateCurrentProject({ storyMap: storyMap.filter(n => n.id !== id) });
  }, [storyMap, pushUndo, updateCurrentProject]);

  // ============================================
  // BEAT SHEET
  // ============================================

  const updateBeatSheet = useCallback((updates: Partial<BeatSheet>) => {
    pushUndo();
    updateCurrentProject({ beatSheet: { ...beatSheet, ...updates } });
  }, [beatSheet, pushUndo, updateCurrentProject]);

  // ============================================
  // OUTLINE
  // ============================================

  const addOutlineNode = useCallback((node: Omit<OutlineNode, 'id' | 'children'>, parentId?: string) => {
    pushUndo();
    const newNode: OutlineNode = { ...node, id: generateId(), children: [] };
    
    if (!parentId) {
      updateCurrentProject({ outline: [...outline, newNode] });
    } else {
      const addToParent = (nodes: OutlineNode[]): OutlineNode[] =>
        nodes.map(n => {
          if (n.id === parentId) {
            return { ...n, children: [...n.children, newNode] };
          }
          return { ...n, children: addToParent(n.children) };
        });
      updateCurrentProject({ outline: addToParent(outline) });
    }
  }, [outline, pushUndo, updateCurrentProject]);

  const updateOutlineNode = useCallback((id: string, updates: Partial<OutlineNode>) => {
    pushUndo();
    const updateNode = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.map(n => {
        if (n.id === id) {
          return { ...n, ...updates };
        }
        return { ...n, children: updateNode(n.children) };
      });
    updateCurrentProject({ outline: updateNode(outline) });
  }, [outline, pushUndo, updateCurrentProject]);

  const deleteOutlineNode = useCallback((id: string) => {
    pushUndo();
    const removeNode = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.filter(n => n.id !== id).map(n => ({ ...n, children: removeNode(n.children) }));
    updateCurrentProject({ outline: removeNode(outline) });
  }, [outline, pushUndo, updateCurrentProject]);

  const moveOutlineNode = useCallback((id: string, newParentId: string | null, index: number) => {
    pushUndo();
    // Find and remove the node
    let nodeToMove: OutlineNode | null = null;
    const removeNode = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.filter(n => {
        if (n.id === id) {
          nodeToMove = n;
          return false;
        }
        return true;
      }).map(n => ({ ...n, children: removeNode(n.children) }));
    
    let newOutline = removeNode(outline);
    
    if (!nodeToMove) return;

    // Add to new location
    if (!newParentId) {
      newOutline = [...newOutline.slice(0, index), nodeToMove, ...newOutline.slice(index)];
    } else {
      const addToParent = (nodes: OutlineNode[]): OutlineNode[] =>
        nodes.map(n => {
          if (n.id === newParentId) {
            const newChildren = [...n.children.slice(0, index), nodeToMove!, ...n.children.slice(index)];
            return { ...n, children: newChildren };
          }
          return { ...n, children: addToParent(n.children) };
        });
      newOutline = addToParent(newOutline);
    }

    updateCurrentProject({ outline: newOutline });
  }, [outline, pushUndo, updateCurrentProject]);

  // ============================================
  // NOTES
  // ============================================

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    pushUndo();
    const newNote: Note = {
      ...note,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateCurrentProject({ notes: [...notes, newNote] });
  }, [notes, pushUndo, updateCurrentProject]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    pushUndo();
    updateCurrentProject({
      notes: notes.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      ),
    });
  }, [notes, pushUndo, updateCurrentProject]);

  const deleteNote = useCallback((id: string) => {
    pushUndo();
    updateCurrentProject({ notes: notes.filter(n => n.id !== id) });
  }, [notes, pushUndo, updateCurrentProject]);

  // ============================================
  // MOOD BOARD
  // ============================================

  const addMoodBoardItem = useCallback((item: Omit<MoodBoardItem, 'id'>) => {
    pushUndo();
    const newItem: MoodBoardItem = { ...item, id: generateId() };
    updateCurrentProject({ moodBoard: [...moodBoard, newItem] });
  }, [moodBoard, pushUndo, updateCurrentProject]);

  const updateMoodBoardItem = useCallback((id: string, updates: Partial<MoodBoardItem>) => {
    pushUndo();
    updateCurrentProject({
      moodBoard: moodBoard.map(m => (m.id === id ? { ...m, ...updates } : m)),
    });
  }, [moodBoard, pushUndo, updateCurrentProject]);

  const deleteMoodBoardItem = useCallback((id: string) => {
    pushUndo();
    updateCurrentProject({ moodBoard: moodBoard.filter(m => m.id !== id) });
  }, [moodBoard, pushUndo, updateCurrentProject]);

  // ============================================
  // CHAT HISTORY
  // ============================================

  const addChatMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };
    updateCurrentProject({ chatHistory: [...chatHistory, newMessage] });
  }, [chatHistory, updateCurrentProject]);

  const clearChatHistory = useCallback(() => {
    pushUndo();
    updateCurrentProject({ chatHistory: [] });
  }, [pushUndo, updateCurrentProject]);

  // ============================================
  // SETTINGS
  // ============================================

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // ============================================
  // UNDO/REDO
  // ============================================

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !currentProject) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentProject]);
    
    setProjects(prev =>
      prev.map(p => (p.id === currentProjectId ? previousState : p)).filter((p): p is Project => p !== undefined)
    );
  }, [undoStack, currentProject, currentProjectId]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !currentProject) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, currentProject]);
    
    setProjects(prev =>
      prev.map(p => (p.id === currentProjectId ? nextState : p)).filter((p): p is Project => p !== undefined)
    );
  }, [redoStack, currentProject, currentProjectId]);

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  const exportProject = useCallback((format: 'json' | 'fountain' | 'pdf') => {
    if (!currentProject) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(currentProject, null, 2);
        filename = `${currentProject.name}.json`;
        mimeType = 'application/json';
        break;
      case 'fountain':
        // Convert to Fountain format
        const script = activeScript?.content || '';
        content = `Title: ${currentProject.name}\nAuthor: StoryVerse Export\n\n${script}`;
        filename = `${currentProject.name}.fountain`;
        mimeType = 'text/plain';
        break;
      case 'pdf':
        // For PDF we'd need a proper library - for now, create printable HTML
        content = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Courier, monospace; max-width: 8.5in; margin: 1in auto; }
    h1 { text-align: center; }
    .scene-heading { margin-top: 2em; font-weight: bold; }
    .action { margin: 1em 0; }
    .character { margin-top: 1em; margin-left: 2in; font-weight: bold; }
    .dialogue { margin-left: 1in; margin-right: 1in; }
  </style>
</head>
<body>
  <h1>${currentProject.name}</h1>
  <pre>${activeScript?.content || ''}</pre>
</body>
</html>`;
        filename = `${currentProject.name}.html`;
        mimeType = 'text/html';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentProject, activeScript]);

  const importProject = useCallback((data: string) => {
    try {
      const imported = JSON.parse(data) as Project;
      imported.id = generateId(); // Generate new ID to avoid conflicts
      imported.name = `${imported.name} (Imported)`;
      imported.createdAt = Date.now();
      imported.updatedAt = Date.now();
      setProjects(prev => [...prev, imported]);
      setCurrentProjectId(imported.id);
    } catch (e) {
      console.error('Failed to import project:', e);
    }
  }, []);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (modKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (modKey && e.key === 'k') {
        e.preventDefault();
        // Focus search - would need ref
      } else if (modKey && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: StoryContextType = {
    // Project Management
    projects,
    currentProject,
    createProject,
    selectProject,
    updateProject,
    deleteProject,
    duplicateProject,

    // Sources
    sources,
    addSource,
    updateSource,
    deleteSource,

    // Scripts
    scripts,
    activeScript,
    setActiveScript,
    createScript,
    updateScript,
    deleteScript,
    saveScriptVersion,
    restoreScriptVersion,

    // Story Map
    storyMap,
    addStoryNode,
    updateStoryNode,
    deleteStoryNode,

    // Beat Sheet
    beatSheet,
    updateBeatSheet,

    // Outline
    outline,
    addOutlineNode,
    updateOutlineNode,
    deleteOutlineNode,
    moveOutlineNode,

    // Notes
    notes,
    addNote,
    updateNote,
    deleteNote,

    // Mood Board
    moodBoard,
    addMoodBoardItem,
    updateMoodBoardItem,
    deleteMoodBoardItem,

    // Chat History
    chatHistory,
    addChatMessage,
    clearChatHistory,

    // Settings
    settings,
    updateSettings,

    // UI State
    theme,
    saveStatus,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    settingsOpen,
    setSettingsOpen,

    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,

    // Search
    searchResults,

    // Export
    exportProject,
    importProject,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};

// ============================================
// HOOK
// ============================================

export const useStory = () => {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
