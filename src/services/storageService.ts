/**
 * Storage Service
 * Abstracts storage operations to support both LocalStorage (development)
 * and Supabase (production) backends
 */

import { supabase, isSupabaseConfigured, saveProject, loadProjects as supabaseLoadProjects, deleteProject as supabaseDeleteProject, saveSettings as supabaseSaveSettings, loadSettings as supabaseLoadSettings } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export interface StoredProject {
  id: string;
  name: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

export interface StorageResult<T> {
  data: T | null;
  error: Error | null;
}

// ============================================
// BACKEND DETECTION
// ============================================

const useSupabase = (): boolean => {
  // Use Supabase if configured and user is authenticated
  if (!isSupabaseConfigured()) return false;
  
  // Check if there's an active session
  const session = supabase.auth.getSession();
  return session !== null;
};

// ============================================
// PROJECT STORAGE
// ============================================

export const saveProjectData = async (project: StoredProject): Promise<StorageResult<void>> => {
  try {
    if (useSupabase()) {
      const result = await saveProject(project.id, project.name, project.data);
      if (result.error) throw result.error;
    } else {
      // LocalStorage fallback
      const key = `storyverse_project_${project.id}`;
      localStorage.setItem(key, JSON.stringify({
        ...project,
        updatedAt: new Date().toISOString(),
      }));
      
      // Update project list
      const projectList = getLocalProjectList();
      if (!projectList.includes(project.id)) {
        projectList.push(project.id);
        localStorage.setItem('storyverse_project_list', JSON.stringify(projectList));
      }
    }
    
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const loadAllProjects = async (): Promise<StorageResult<StoredProject[]>> => {
  try {
    if (useSupabase()) {
      const result = await supabaseLoadProjects();
      if (result.error) throw result.error;
      
      return {
        data: result.projects.map(p => ({
          id: p.id,
          name: p.name,
          data: p.data as Record<string, unknown>,
          updatedAt: p.updated_at,
        })),
        error: null,
      };
    } else {
      // LocalStorage fallback
      const projectList = getLocalProjectList();
      const projects: StoredProject[] = [];
      
      for (const id of projectList) {
        const key = `storyverse_project_${id}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            projects.push(JSON.parse(data));
          } catch {
            // Skip corrupted data
          }
        }
      }
      
      return { data: projects, error: null };
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const deleteProjectData = async (projectId: string): Promise<StorageResult<void>> => {
  try {
    if (useSupabase()) {
      const result = await supabaseDeleteProject(projectId);
      if (result.error) throw result.error;
    } else {
      // LocalStorage fallback
      const key = `storyverse_project_${projectId}`;
      localStorage.removeItem(key);
      
      // Update project list
      const projectList = getLocalProjectList().filter(id => id !== projectId);
      localStorage.setItem('storyverse_project_list', JSON.stringify(projectList));
    }
    
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// ============================================
// SETTINGS STORAGE
// ============================================

export const saveUserSettings = async (settings: Record<string, unknown>): Promise<StorageResult<void>> => {
  try {
    if (useSupabase()) {
      const result = await supabaseSaveSettings(settings);
      if (result.error) throw result.error;
    } else {
      localStorage.setItem('storyverse_settings', JSON.stringify(settings));
    }
    
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const loadUserSettings = async (): Promise<StorageResult<Record<string, unknown>>> => {
  try {
    if (useSupabase()) {
      const result = await supabaseLoadSettings();
      if (result.error) throw result.error;
      return { data: result.settings, error: null };
    } else {
      const data = localStorage.getItem('storyverse_settings');
      return { data: data ? JSON.parse(data) : null, error: null };
    }
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

// ============================================
// HELPERS
// ============================================

const getLocalProjectList = (): string[] => {
  try {
    const data = localStorage.getItem('storyverse_project_list');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// ============================================
// SYNC
// ============================================

export const syncToCloud = async (): Promise<StorageResult<void>> => {
  if (!useSupabase()) {
    return { data: null, error: new Error('Cloud sync not available - Supabase not configured') };
  }
  
  try {
    // Load local projects
    const localProjects = getLocalProjectList();
    
    for (const id of localProjects) {
      const key = `storyverse_project_${id}`;
      const data = localStorage.getItem(key);
      if (data) {
        const project = JSON.parse(data) as StoredProject;
        await saveProject(project.id, project.name, project.data);
      }
    }
    
    // Sync settings
    const localSettings = localStorage.getItem('storyverse_settings');
    if (localSettings) {
      await supabaseSaveSettings(JSON.parse(localSettings));
    }
    
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const isCloudEnabled = (): boolean => useSupabase();

export const getStorageBackend = (): 'supabase' | 'local' => {
  return useSupabase() ? 'supabase' : 'local';
};

