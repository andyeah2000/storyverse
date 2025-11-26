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
  ProjectShareInfo,
  ProjectAccess,
} from '../types';
import {
  supabase,
  inviteProjectCollaborator,
  revokeProjectCollaborator,
  listProjectShares,
  acceptProjectShareInvite,
  declineProjectShareInvite,
  loadSharedProjectsByIds,
} from '../lib/supabase';
import { useAuth } from './AuthContext';

// ============================================
// CONTEXT TYPE
// ============================================

interface StoryContextType {
  // Project Management
  projects: Project[];
  currentProject: Project | null;
  currentProjectPermission: ProjectAccess;
  canEditCurrentProject: boolean;
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

  // Collaboration
  isShareModalOpen: boolean;
  openShareModal: () => void;
  closeShareModal: () => void;
  currentProjectShares: ProjectShareInfo[];
  incomingInvites: ProjectShareInfo[];
  inviteCollaborator: (email: string, permission: 'view' | 'edit') => Promise<{ success: boolean; error?: string }>;
  revokeShare: (shareId: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvite: (shareId: string) => Promise<{ success: boolean; error?: string }>;
  declineInvite: (shareId: string) => Promise<{ success: boolean; error?: string }>;

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

const createDefaultProject = (name: string, description?: string, ownerId?: string, access: ProjectAccess = 'owner'): Project => ({
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
  ownerId: ownerId || 'local',
  access,
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
  const [projectPermissions, setProjectPermissions] = useState<Record<string, ProjectAccess>>({});
  const [projectShares, setProjectShares] = useState<Record<string, ProjectShareInfo[]>>({});
  const [incomingInvites, setIncomingInvites] = useState<ProjectShareInfo[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Undo/Redo history
  const [undoStack, setUndoStack] = useState<Project[]>([]);
  const [redoStack, setRedoStack] = useState<Project[]>([]);

  const projectLimit = useMemo(() => {
    if (!isSupabaseMode) return Infinity;
    return user?.plan === 'pro' ? Infinity : 3;
  }, [isSupabaseMode, user?.plan]);

  const ensureProjectQuota = useCallback(() => {
    if (projectLimit === Infinity) return true;
    if (projects.length < projectLimit) return true;
    alert('You have reached the project limit for the Free plan. Upgrade to Pro in Settings → Billing for unlimited projects.');
    return false;
  }, [projectLimit, projects.length]);

  const hydrateShareState = useCallback((shares: ProjectShareInfo[], ownerIds: string[]) => {
    if (!shares || shares.length === 0) {
      setProjectShares({});
      setIncomingInvites([]);
      return;
    }

    const grouped: Record<string, ProjectShareInfo[]> = {};
    const invites: ProjectShareInfo[] = [];
    const normalizedEmail = user?.email?.toLowerCase();

    shares.forEach(share => {
      if (ownerIds.includes(share.project_id)) {
        if (!grouped[share.project_id]) {
          grouped[share.project_id] = [];
        }
        grouped[share.project_id]!.push(share);
      }

      if (!share.accepted && normalizedEmail && share.shared_with_email.toLowerCase() === normalizedEmail) {
        invites.push(share);
      }
    });

    setProjectShares(grouped);
    setIncomingInvites(invites);
  }, [user?.email]);

  // ============================================
  // LOAD DATA ON AUTH CHANGE
  // ============================================

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = (JSON.parse(saved) as Project[]).map(project => ({
          ...project,
          access: project.access || 'owner',
        }));
        setProjects(parsed);
        const permissions = parsed.reduce<Record<string, ProjectAccess>>((acc, project) => {
          acc[project.id] = project.access || 'owner';
          return acc;
        }, {});
        setProjectPermissions(permissions);
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
        setCurrentProjectId(savedId && parsed.some(p => p.id === savedId) ? savedId : parsed[0]?.id || '');
      } else {
        const defaultProject = createDefaultProject('My First Story', 'A new storytelling adventure');
        setProjects([defaultProject]);
        setProjectPermissions({ [defaultProject.id]: 'owner' });
        setCurrentProjectId(defaultProject.id);
      }
      setProjectShares({});
      setIncomingInvites([]);
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      const defaultProject = createDefaultProject('My First Story');
      setProjects([defaultProject]);
      setProjectPermissions({ [defaultProject.id]: 'owner' });
      setCurrentProjectId(defaultProject.id);
      setProjectShares({});
      setIncomingInvites([]);
    }
  }, []);

  const loadData = useCallback(async (options: { silent?: boolean } = {}) => {
    const { silent } = options;
    if (!silent) {
      setIsLoading(true);
    }

    if (isSupabaseMode && isAuthenticated && user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, data, user_id, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const ownedProjects: Array<Project & { ownerId: string; access: ProjectAccess }> = (data || []).map(row => {
          const projectPayload = (row.data as unknown) as Project | null;
          const payload = projectPayload ?? createDefaultProject(row.name || 'Untitled Project', undefined, user.id);
          return { ...payload, id: row.id, ownerId: user.id, access: 'owner' as ProjectAccess };
        });

        const ownedIds = ownedProjects.map(p => p.id);
        const { shares: shareRows, error: shareError } = await listProjectShares();
        if (shareError) {
          console.error('Failed to load project shares:', shareError);
        }

        const acceptedShares = shareRows.filter(share => share.accepted && share.shared_with_user_id === user.id);
        const shareMap = acceptedShares.reduce<Record<string, ProjectShareInfo>>((acc, share) => {
          acc[share.project_id] = share;
          return acc;
        }, {});
        const sharedIds = Object.keys(shareMap);

        let sharedProjects: Project[] = [];
        if (sharedIds.length > 0) {
          const { projects: sharedRows, error: sharedProjectsError } = await loadSharedProjectsByIds(sharedIds);
          if (sharedProjectsError) {
            console.error('Failed to load shared projects:', sharedProjectsError);
          } else {
            sharedProjects = (sharedRows || []).map(row => {
              const projectPayload = (row.data as unknown) as Project | null;
              const payload = projectPayload ?? createDefaultProject(row.name || 'Shared Project', row.user_id ?? undefined);
              const permission: ProjectAccess = shareMap[row.id]?.permission === 'edit' ? 'edit' : 'view';
              return {
                ...payload,
                id: row.id,
                ownerId: row.user_id || payload.ownerId || 'local',
                access: permission,
              };
            });
          }
        }

        if (ownedProjects.length === 0 && sharedProjects.length === 0) {
          const defaultProject = createDefaultProject('My First Story', 'A new storytelling adventure', user.id);
          const seededProject = { ...defaultProject, ownerId: user.id, access: 'owner' as ProjectAccess };
          ownedProjects.push(seededProject);
          try {
            await supabase.from('projects').insert({
              id: seededProject.id,
              user_id: user.id,
              name: seededProject.name,
              data: seededProject,
            });
          } catch (insertError) {
            console.error('Failed to seed default project:', insertError);
          }
        }

        const combinedProjects = [...ownedProjects, ...sharedProjects];
        setProjects(combinedProjects);

        const permissions = combinedProjects.reduce<Record<string, ProjectAccess>>((acc, project) => {
          acc[project.id] = project.access || 'owner';
          return acc;
        }, {});
        setProjectPermissions(permissions);

        hydrateShareState(shareRows, ownedIds);

        const savedProjectId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
        if (savedProjectId && combinedProjects.some(p => p.id === savedProjectId)) {
          setCurrentProjectId(savedProjectId);
        } else if (combinedProjects[0]) {
          setCurrentProjectId(combinedProjects[0].id);
        } else {
          setCurrentProjectId('');
        }

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
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }

    if (!silent) {
      setIsLoading(false);
    }
    isInitialized.current = true;
  }, [isSupabaseMode, isAuthenticated, user, hydrateShareState, loadFromLocalStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshShareData = useCallback(async () => {
    if (!isSupabaseMode || !isAuthenticated || !user) {
      setProjectShares({});
      setIncomingInvites([]);
      return;
    }

    const { shares, error } = await listProjectShares();
    if (error) {
      console.error('Failed to refresh share data:', error);
      return;
    }

    const ownedIds = projects
      .filter(project => (projectPermissions[project.id] || 'owner') === 'owner')
      .map(project => project.id);

    hydrateShareState(shares, ownedIds);
  }, [isSupabaseMode, isAuthenticated, user, projects, projectPermissions, hydrateShareState]);

  // ============================================
  // DERIVED STATE
  // ============================================

  const currentProject = useMemo(
    () => projects.find(p => p.id === currentProjectId) || null,
    [projects, currentProjectId]
  );

  const currentProjectPermission: ProjectAccess = useMemo(() => {
    return projectPermissions[currentProjectId] || 'owner';
  }, [projectPermissions, currentProjectId]);

  const canEditCurrentProject = currentProjectPermission !== 'view';

  const currentProjectShares = useMemo(() => {
    return projectShares[currentProjectId] || [];
  }, [projectShares, currentProjectId]);

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

  const inviteCollaborator = useCallback(async (email: string, permission: 'view' | 'edit') => {
    if (!isSupabaseMode || !isAuthenticated) {
      return { success: false, error: 'Collaboration requires Supabase mode' };
    }

    if (!currentProject) {
      return { success: false, error: 'Select a project first' };
    }

    if (currentProjectPermission !== 'owner') {
      return { success: false, error: 'Only project owners can invite collaborators' };
    }

    try {
      const { error } = await inviteProjectCollaborator(currentProject.id, currentProject.name, email, permission);
      if (error) throw error;
      await refreshShareData();
      return { success: true };
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
      return { success: false, error: (error as Error).message };
    }
  }, [isSupabaseMode, isAuthenticated, currentProject, currentProjectPermission, refreshShareData]);

  const revokeShare = useCallback(async (shareId: string) => {
    if (!isSupabaseMode || !isAuthenticated) {
      return { success: false, error: 'Collaboration requires Supabase mode' };
    }

    if (currentProjectPermission !== 'owner') {
      return { success: false, error: 'Only project owners can manage collaborators' };
    }

    try {
      const { error } = await revokeProjectCollaborator(shareId);
      if (error) throw error;
      await refreshShareData();
      return { success: true };
    } catch (error) {
      console.error('Failed to revoke collaborator:', error);
      return { success: false, error: (error as Error).message };
    }
  }, [isSupabaseMode, isAuthenticated, currentProjectPermission, refreshShareData]);

  const acceptInvite = useCallback(async (shareId: string) => {
    if (!isSupabaseMode || !isAuthenticated) {
      return { success: false, error: 'Collaboration requires Supabase mode' };
    }

    try {
      const { error } = await acceptProjectShareInvite(shareId);
      if (error) throw error;
      await loadData({ silent: true });
      return { success: true };
    } catch (error) {
      console.error('Failed to accept invite:', error);
      return { success: false, error: (error as Error).message };
    }
  }, [isSupabaseMode, isAuthenticated, loadData]);

  const declineInvite = useCallback(async (shareId: string) => {
    if (!isSupabaseMode || !isAuthenticated) {
      return { success: false, error: 'Collaboration requires Supabase mode' };
    }

    try {
      const { error } = await declineProjectShareInvite(shareId);
      if (error) throw error;
      await refreshShareData();
      return { success: true };
    } catch (error) {
      console.error('Failed to decline invite:', error);
      return { success: false, error: (error as Error).message };
    }
  }, [isSupabaseMode, isAuthenticated, refreshShareData]);

  const canEditProject = useCallback((projectId: string) => {
    if (!projectId) return false;
    return (projectPermissions[projectId] || 'owner') !== 'view';
  }, [projectPermissions]);

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const isProjectOwner = useCallback((projectId: string) => {
    if (!projectId) return false;
    return (projectPermissions[projectId] || 'owner') === 'owner';
  }, [projectPermissions]);

  // ============================================
  // PERSISTENCE
  // ============================================

  // Deep merge helper for conflict resolution
  const mergeOutlineNodes = useCallback((remote: OutlineNode[], local: OutlineNode[]): OutlineNode[] => {
    const allNodes = new Map<string, OutlineNode>();
    
    [...remote, ...local].forEach(node => {
      const existing = allNodes.get(node.id);
      if (!existing) {
        allNodes.set(node.id, { ...node, children: [] });
      } else {
        // Merge node properties, prefer remote if it's newer
        allNodes.set(node.id, { ...existing, ...node });
      }
    });

    // Rebuild tree structure (simplified - assumes parent relationships are preserved)
    return Array.from(allNodes.values());
  }, []);

  const deepMerge = useCallback((local: Project, remote: Project): Project => {
    // Merge strategy: prefer local changes for most fields, but combine arrays
    const merged: Project = {
      ...local,
      ...remote,
      // Merge arrays by combining unique items
      sources: [...new Map([...remote.sources, ...local.sources].map(s => [s.id, s])).values()],
      scripts: local.scripts.map(localScript => {
        const remoteScript = remote.scripts.find(s => s.id === localScript.id);
        if (!remoteScript) return localScript;
        // If remote was updated more recently, prefer remote content
        if (remoteScript.updatedAt > localScript.updatedAt) {
          return remoteScript;
        }
        return localScript;
      }),
      storyMap: [...new Map([...remote.storyMap, ...local.storyMap].map(n => [n.id, n])).values()],
      outline: mergeOutlineNodes(remote.outline, local.outline),
      notes: [...new Map([...remote.notes, ...local.notes].map(n => [n.id, n])).values()],
      moodBoard: [...new Map([...remote.moodBoard, ...local.moodBoard].map(m => [m.id, m])).values()],
      chatHistory: [...remote.chatHistory, ...local.chatHistory].sort((a, b) => a.timestamp - b.timestamp),
      // Beat sheet: prefer most recent changes
      beatSheet: remote.updatedAt > local.updatedAt ? remote.beatSheet : local.beatSheet,
      updatedAt: Date.now(),
    };
    return merged;
  }, [mergeOutlineNodes]);

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
          const editableProjects = projects.filter(project => (projectPermissions[project.id] || 'owner') !== 'view');
          
          // Check for conflicts before saving
          for (const project of editableProjects) {
            try {
              // Fetch current remote version
              const { data: remoteData, error: fetchError } = await supabase
                .from('projects')
                .select('updated_at, data')
                .eq('id', project.id)
                .single();

              if (!fetchError && remoteData) {
                const remoteProject = remoteData.data as Project;
                const remoteUpdatedAt = new Date(remoteData.updated_at).getTime();
                const localUpdatedAt = project.updatedAt;

                // If remote is newer and different, attempt merge
                if (remoteUpdatedAt > localUpdatedAt && remoteUpdatedAt !== localUpdatedAt) {
                  try {
                    const mergedProject = deepMerge(project, remoteProject);
                    // Update local project with merged version
                    setProjects(prev => prev.map(p => p.id === project.id ? mergedProject : p));
                    
                    // Log activity
                    const { error: logError } = await supabase.from('project_activity').insert({
                      project_id: project.id,
                      user_id: user.id,
                      action: 'edit',
                      metadata: { conflict_resolved: true, merged: true },
                    });
                    if (logError) {
                      console.warn('Failed to log conflict resolution activity', logError);
                    }
                  } catch (mergeError) {
                    console.warn('Merge failed, setting conflict status:', mergeError);
                    setSaveStatus('conflict');
                    // Show notification to user (could be enhanced with a toast/notification system)
                    return;
                  }
                }
              }
            } catch (conflictCheckError) {
              console.warn('Conflict check failed, proceeding with save:', conflictCheckError);
              // Continue with save if conflict check fails
            }
          }

          const payload = editableProjects.map(project => ({
            id: project.id,
            user_id: project.ownerId || user.id,
            name: project.name,
            data: project,
            updated_at: new Date().toISOString(),
          }));

          if (payload.length > 0) {
            const { error } = await supabase
              .from('projects')
              .upsert(payload, { onConflict: 'id' });

            if (error) throw error;

            // Log activity for successful saves
              for (const project of editableProjects) {
                const { error: activityError } = await supabase.from('project_activity').insert({
                  project_id: project.id,
                  user_id: user.id,
                  action: 'edit',
                  metadata: { autosave: true },
                });
                if (activityError) {
                  console.warn('Failed to log autosave activity', activityError);
                }
              }
          }

          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
          localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, currentProjectId);
        } else {
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
  }, [projects, currentProjectId, isSupabaseMode, isAuthenticated, user, projectPermissions, deepMerge]);

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
    if (currentProject && canEditProject(currentProject.id)) {
      setUndoStack(prev => [...prev.slice(-49), currentProject]);
      setRedoStack([]);
    }
  }, [currentProject, canEditProject]);

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  const updateCurrentProject = useCallback((updates: Partial<Project>) => {
    if (!currentProjectId || !canEditProject(currentProjectId)) return;
    setProjects(prev =>
      prev.map(p =>
        p.id === currentProjectId
          ? { ...p, ...updates, updatedAt: Date.now() }
          : p
      )
    );
  }, [currentProjectId, canEditProject]);

  const createProject = useCallback((name: string, description?: string) => {
    if (!ensureProjectQuota()) return;
    const newProject = createDefaultProject(name, description, user?.id || 'local');
    setProjects(prev => [...prev, newProject]);
    setProjectPermissions(prev => ({ ...prev, [newProject.id]: 'owner' }));
    setCurrentProjectId(newProject.id);
  }, [ensureProjectQuota, user?.id]);

  const selectProject = useCallback((id: string) => {
    setCurrentProjectId(id);
    setActiveScriptId(null);
  }, []);

  const updateProject = useCallback((updates: Partial<Project>) => {
    pushUndo();
    updateCurrentProject(updates);
  }, [pushUndo, updateCurrentProject]);

  const deleteProject = useCallback((id: string) => {
    if (!isProjectOwner(id)) {
      console.warn('Only project owners can delete projects');
      return;
    }

    setProjects(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length === 0) {
        const fallback = createDefaultProject('Untitled Project', undefined, user?.id || 'local');
        setCurrentProjectId(fallback.id);
        setProjectPermissions({ [fallback.id]: 'owner' });
        return [fallback];
      }

      if (currentProjectId === id) {
        setCurrentProjectId(filtered[0]?.id || '');
      }

      return filtered;
    });

    setProjectPermissions(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (isSupabaseMode && isAuthenticated && user) {
      supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to delete project from Supabase:', error);
          }
        });
    }
  }, [isProjectOwner, user, currentProjectId, isSupabaseMode, isAuthenticated, projects]);

  const duplicateProject = useCallback((id: string) => {
    if (!ensureProjectQuota()) return;
    const project = projects.find(p => p.id === id);
    if (project) {
      const newProject: Project = {
        ...project,
        id: generateId(),
        name: `${project.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ownerId: user?.id || project.ownerId || 'local',
        access: 'owner',
      };
      setProjects(prev => [...prev, newProject]);
      setProjectPermissions(prev => ({ ...prev, [newProject.id]: 'owner' }));
    }
  }, [projects, user?.id, ensureProjectQuota]);

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
      case 'fountain': {
        // Convert to Fountain format
        const script = activeScript?.content || '';
        content = `Title: ${currentProject.name}\nAuthor: StoryVerse Export\n\n${script}`;
        filename = `${currentProject.name}.fountain`;
        mimeType = 'text/plain';
        break;
      }
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
    if (!ensureProjectQuota()) return;
    try {
      const imported = JSON.parse(data) as Project;
      imported.id = generateId(); // Generate new ID to avoid conflicts
      imported.name = `${imported.name} (Imported)`;
      imported.createdAt = Date.now();
      imported.updatedAt = Date.now();
      imported.ownerId = user?.id || 'local';
      imported.access = 'owner';
      setProjects(prev => [...prev, imported]);
      setProjectPermissions(prev => ({ ...prev, [imported.id]: 'owner' }));
      setCurrentProjectId(imported.id);
    } catch (e) {
      console.error('Failed to import project:', e);
    }
  }, [user?.id, ensureProjectQuota]);

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
    currentProjectPermission,
    canEditCurrentProject,
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

    // Collaboration
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    currentProjectShares,
    incomingInvites,
    inviteCollaborator,
    revokeShare,
    acceptInvite,
    declineInvite,

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
