import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Environment variables - set these in Vercel or .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Create Supabase client only if configured
// Uses a placeholder client for development without Supabase
const createSupabaseClient = (): SupabaseClient => {
  if (isSupabaseConfigured()) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  
  // Return a mock client that won't crash but won't work either
  // All Supabase calls will be intercepted by isSupabaseConfigured() checks
  return createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const supabase: SupabaseClient = createSupabaseClient();

// ============================================
// AUTH FUNCTIONS
// ============================================

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as Error,
    };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as Error,
    };
  }
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const updatePassword = async (newPassword: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const getCurrentSession = async (): Promise<{ session: Session | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, error: null };
  } catch (error) {
    return { session: null, error: error as Error };
  }
};

export const getCurrentUser = async (): Promise<{ user: User | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// ============================================
// PROJECT STORAGE FUNCTIONS
// ============================================

export interface StoredProject {
  id: string;
  user_id: string;
  name: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const saveProject = async (projectId: string, name: string, data: Record<string, unknown>): Promise<{ error: Error | null }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('projects')
      .upsert({
        id: projectId,
        user_id: userData.user.id,
        name,
        data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const loadProjects = async (): Promise<{ projects: StoredProject[]; error: Error | null }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { projects: data || [], error: null };
  } catch (error) {
    return { projects: [], error: error as Error };
  }
};

export const deleteProject = async (projectId: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export const subscribeToProjectChanges = (
  userId: string,
  callback: (payload: { eventType: string; new: StoredProject; old: StoredProject }) => void
) => {
  return supabase
    .channel('project_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType,
          new: payload.new as StoredProject,
          old: payload.old as StoredProject,
        });
      }
    )
    .subscribe();
};

// ============================================
// SETTINGS STORAGE
// ============================================

export const saveSettings = async (settings: Record<string, unknown>): Promise<{ error: Error | null }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userData.user.id,
        settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};

export const loadSettings = async (): Promise<{ settings: Record<string, unknown> | null; error: Error | null }> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userData.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return { settings: data?.settings || null, error: null };
  } catch (error) {
    return { settings: null, error: error as Error };
  }
};

export default supabase;

