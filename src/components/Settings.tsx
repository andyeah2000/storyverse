import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { 
  ArrowLeft, User, Key, Trash2, LogOut, 
  Eye, EyeOff, Check, Loader2, AlertTriangle, Download, Upload,
  Moon, Sun, Monitor, FolderOpen, Copy, Settings as SettingsIcon,
  Palette, Database
} from 'lucide-react';
import { cn } from '../lib/utils';

type SettingsTab = 'profile' | 'appearance' | 'editor' | 'projects' | 'security' | 'data';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme === 'dark';
  
  const { 
    settings, 
    updateSettings,
    projects,
    currentProject,
    selectProject,
    createProject,
    deleteProject,
    duplicateProject,
    exportProject,
    importProject
  } = useStory();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    
    const userData = localStorage.getItem('storyverse_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      parsed.name = profile.name;
      localStorage.setItem('storyverse_user', JSON.stringify(parsed));
    }
    
    setIsSaving(false);
    showSuccessToast();
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setPasswords({ current: '', new: '', confirm: '' });
    setIsSaving(false);
    showSuccessToast();
  };

  const showSuccessToast = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      user,
      settings: localStorage.getItem('storyverse_settings'),
      projects: localStorage.getItem('storyverse_projects'),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyverse-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    localStorage.clear();
    logout();
    navigate('/');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          importProject(data);
          showSuccessToast();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: SettingsIcon },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'data', label: 'Data', icon: Database },
  ] as const;

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-300",
      isDark ? 'bg-[#0c0a09]' : 'bg-[#FAFAF9]'
    )}>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-slide-down">
          <Check size={18} />
          Changes saved
        </div>
      )}

      {/* Header */}
      <header className={cn("border-b shrink-0", isDark ? 'border-stone-800' : 'border-stone-200')}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/app" 
            className={cn(
              "inline-flex items-center gap-2 text-sm transition-colors group",
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
            )}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to App
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                updateSettings({ theme: isDark ? 'light' : 'dark' });
                window.location.reload();
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
            >
              {isDark ? <Sun size={16} className="text-stone-400" /> : <Moon size={16} className="text-stone-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className={cn("text-2xl font-bold mb-6", isDark ? 'text-white' : 'text-stone-900')}>
            Settings
          </h1>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      activeTab === tab.id
                        ? isDark 
                          ? 'bg-white text-stone-900'
                          : 'bg-stone-900 text-white'
                        : isDark
                          ? 'text-stone-400 hover:bg-stone-800 hover:text-white'
                          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className={cn("mt-6 pt-6 border-t", isDark ? 'border-stone-800' : 'border-stone-200')}>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 transition-colors",
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  )}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card isDark={isDark} title="Profile Information">
                  <div className="space-y-4">
                    <InputField
                      label="Full Name"
                      value={profile.name}
                      onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                      isDark={isDark}
                    />
                    <InputField
                      label="Email Address"
                      value={profile.email}
                      disabled
                      hint="Contact support to change your email"
                      isDark={isDark}
                    />
                  </div>
                  <CardFooter isDark={isDark}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={cn(
                        "h-10 px-5 font-medium rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all press-effect",
                        isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                      )}
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Save
                    </button>
                  </CardFooter>
                </Card>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <>
                  <Card isDark={isDark} title="Theme">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => { updateSettings({ theme: t.id as 'light' | 'dark' | 'system' }); window.location.reload(); }}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                            settings.theme === t.id
                              ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                              : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                          )}
                        >
                          <t.icon size={20} className="text-stone-600 dark:text-stone-300" />
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card isDark={isDark} title="Font Size">
                    <div className="grid grid-cols-3 gap-3">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => updateSettings({ fontSize: size as 'small' | 'medium' | 'large' })}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                            settings.fontSize === size
                              ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                              : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                          )}
                        >
                          <span className={cn(
                            "font-mono",
                            size === 'small' && 'text-sm',
                            size === 'medium' && 'text-base',
                            size === 'large' && 'text-lg'
                          )}>Aa</span>
                          <span className="text-xs font-medium capitalize">{size}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Editor Tab */}
              {activeTab === 'editor' && (
                <>
                  <Card isDark={isDark} title="API Key" description="Enter your Gemini API key for AI features">
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.apiKey || ''}
                        onChange={(e) => updateSettings({ apiKey: e.target.value })}
                        placeholder="AIza..."
                        className={cn(
                          "w-full h-11 pl-4 pr-12 rounded-xl border outline-none font-mono text-sm transition-all",
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                        )}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Card>

                  <Card isDark={isDark} title="Editor Options">
                    <div className="space-y-4">
                      <Toggle
                        label="Auto-Save"
                        description="Automatically save your work"
                        checked={settings.autoSave}
                        onChange={(v) => updateSettings({ autoSave: v })}
                        isDark={isDark}
                      />
                      <Toggle
                        label="Word Count"
                        description="Show word count in editor"
                        checked={settings.showWordCount}
                        onChange={(v) => updateSettings({ showWordCount: v })}
                        isDark={isDark}
                      />
                      <Toggle
                        label="Page Count"
                        description="Show estimated page count"
                        checked={settings.showPageCount}
                        onChange={(v) => updateSettings({ showPageCount: v })}
                        isDark={isDark}
                      />
                    </div>
                  </Card>

                  <Card isDark={isDark} title="Keyboard Shortcuts">
                    <div className="space-y-2">
                      {Object.entries(settings.keyboardShortcuts).map(([key, value]) => (
                        <div key={key} className={cn(
                          "flex items-center justify-between py-2 border-b last:border-b-0",
                          isDark ? 'border-stone-800' : 'border-stone-100'
                        )}>
                          <span className="text-sm text-stone-600 dark:text-stone-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <kbd className="px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-mono rounded-md border border-stone-200 dark:border-stone-700">
                            {value}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <>
                  <Card isDark={isDark} title="Your Projects">
                    <div className="space-y-2 mb-4">
                      {projects.map(project => (
                        <div 
                          key={project.id}
                          className={cn(
                            "p-3 rounded-xl border transition-all flex items-center justify-between group",
                            project.id === currentProject?.id
                              ? 'border-stone-900 dark:border-white bg-stone-50 dark:bg-stone-800'
                              : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                          )}
                        >
                          <button onClick={() => selectProject(project.id)} className="flex-1 text-left">
                            <div className="font-medium text-sm">{project.name}</div>
                            <div className="text-xs text-stone-500">
                              {project.sources.length} sources · {project.scripts.length} scripts
                            </div>
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => duplicateProject(project.id)}
                              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                            >
                              <Copy size={14} />
                            </button>
                            {projects.length > 1 && (
                              <button
                                onClick={() => deleteProject(project.id)}
                                className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="New project name..."
                        className={cn(
                          "flex-1 h-10 px-4 rounded-xl border outline-none text-sm transition-all",
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                        )}
                      />
                      <button
                        onClick={() => { if (newProjectName.trim()) { createProject(newProjectName.trim()); setNewProjectName(''); }}}
                        disabled={!newProjectName.trim()}
                        className={cn(
                          "h-10 px-4 rounded-xl font-medium text-sm disabled:opacity-40 transition-all",
                          isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                        )}
                      >
                        Create
                      </button>
                    </div>
                  </Card>

                  <Card isDark={isDark} title="Export / Import">
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { format: 'json', label: 'JSON', desc: 'Full backup' },
                        { format: 'fountain', label: 'Fountain', desc: 'Script' },
                        { format: 'pdf', label: 'PDF', desc: 'Printable' },
                      ].map(({ format, label, desc }) => (
                        <button
                          key={format}
                          onClick={() => exportProject(format as 'json' | 'fountain' | 'pdf')}
                          className={cn(
                            "p-4 rounded-xl border transition-all flex flex-col items-center gap-1.5 hover-scale",
                            isDark ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-50'
                          )}
                        >
                          <Download size={18} className="text-stone-500" />
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-[10px] text-stone-400">{desc}</span>
                        </button>
                      ))}
                      <button
                        onClick={handleImport}
                        className={cn(
                          "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-1.5 hover-scale",
                          isDark ? 'border-stone-700 hover:bg-stone-800' : 'border-stone-200 hover:bg-stone-50'
                        )}
                      >
                        <Upload size={18} className="text-stone-400" />
                        <span className="text-xs font-medium">Import</span>
                        <span className="text-[10px] text-stone-400">JSON file</span>
                      </button>
                    </div>
                  </Card>
                </>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <Card isDark={isDark} title="Change Password">
                  <div className="space-y-4">
                    {(['current', 'new', 'confirm'] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium mb-1.5">
                          {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords[field] ? 'text' : 'password'}
                            value={passwords[field]}
                            onChange={(e) => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                            className={cn(
                              "w-full h-11 px-4 pr-12 rounded-xl border outline-none transition-all",
                              isDark
                                ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600'
                                : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(s => ({ ...s, [field]: !s[field] }))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                          >
                            {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <CardFooter isDark={isDark}>
                    <button
                      onClick={handleChangePassword}
                      disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                      className={cn(
                        "h-10 px-5 font-medium rounded-xl flex items-center gap-2 disabled:opacity-40 transition-all",
                        isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                      )}
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                      Update Password
                    </button>
                  </CardFooter>
                </Card>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <>
                  <Card isDark={isDark} title="Export Your Data" description="Download a copy of all your data">
                    <button
                      onClick={handleExportData}
                      className={cn(
                        "h-10 px-5 font-medium rounded-xl flex items-center gap-2 transition-colors",
                        isDark ? 'border border-stone-700 hover:bg-stone-800' : 'border border-stone-200 hover:bg-stone-50'
                      )}
                    >
                      <Download size={16} />
                      Export All Data
                    </button>
                  </Card>

                  <div className={cn(
                    "rounded-2xl border p-6",
                    isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                  )}>
                    <h2 className={cn("text-lg font-semibold mb-2 flex items-center gap-2", isDark ? 'text-red-400' : 'text-red-700')}>
                      <AlertTriangle size={20} />
                      Danger Zone
                    </h2>
                    <p className={cn("text-sm mb-4", isDark ? 'text-red-300' : 'text-red-600')}>
                      Deleting your account is irreversible. All data will be permanently lost.
                    </p>
                    
                    {showDeleteConfirm ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          className="h-10 px-5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700"
                        >
                          Yes, Delete Everything
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className={cn(
                            "h-10 px-5 font-medium rounded-xl border",
                            isDark ? 'border-red-500/30 text-red-400' : 'border-red-300 text-red-600'
                          )}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={cn(
                          "h-10 px-5 font-medium rounded-xl flex items-center gap-2 border",
                          isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-red-300 text-red-600 hover:bg-red-100'
                        )}
                      >
                        <Trash2 size={16} />
                        Delete Account
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Reusable Components
const Card: React.FC<{ 
  isDark: boolean; 
  title: string; 
  description?: string;
  children: React.ReactNode;
}> = ({ isDark, title, description, children }) => (
  <div className={cn(
    "rounded-2xl border p-6",
    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
  )}>
    <h3 className={cn("text-base font-semibold mb-1", isDark ? 'text-white' : 'text-stone-900')}>
      {title}
    </h3>
    {description && (
      <p className={cn("text-xs mb-4", isDark ? 'text-stone-500' : 'text-stone-400')}>
        {description}
      </p>
    )}
    {!description && <div className="mb-4" />}
    {children}
  </div>
);

const CardFooter: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <div className={cn("mt-6 pt-4 border-t flex justify-end", isDark ? 'border-stone-800' : 'border-stone-200')}>
    {children}
  </div>
);

const InputField: React.FC<{
  label: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  hint?: string;
  isDark: boolean;
}> = ({ label, value, onChange, disabled, hint, isDark }) => (
  <div>
    <label className={cn("block text-sm font-medium mb-1.5", isDark ? 'text-stone-300' : 'text-stone-700')}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "w-full h-11 px-4 rounded-xl border outline-none transition-all",
        disabled && 'cursor-not-allowed opacity-60',
        isDark
          ? 'bg-stone-800 border-stone-700 text-white focus:border-stone-600'
          : 'bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-400'
      )}
    />
    {hint && <p className={cn("mt-1.5 text-xs", isDark ? 'text-stone-500' : 'text-stone-400')}>{hint}</p>}
  </div>
);

const Toggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
}> = ({ label, description, checked, onChange, isDark }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className={cn("text-sm font-medium", isDark ? 'text-white' : 'text-stone-900')}>{label}</p>
      <p className="text-xs text-stone-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-10 h-6 rounded-full relative transition-colors",
        checked
          ? isDark ? 'bg-white' : 'bg-stone-900'
          : isDark ? 'bg-stone-700' : 'bg-stone-300'
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all",
        checked
          ? `right-1 ${isDark ? 'bg-stone-900' : 'bg-white'}`
          : `left-1 ${isDark ? 'bg-stone-400' : 'bg-white'}`
      )} />
    </button>
  </div>
);

export default Settings;

